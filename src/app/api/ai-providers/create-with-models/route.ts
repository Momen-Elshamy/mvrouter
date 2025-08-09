import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { 
  aiProviderSchema,
  type AiProviderCreate
} from '@/lib/dto/ai-provider';
import { aiProviderParametersArraySchema } from '@/lib/dto/ai-provider-parameters';
import { createParametersArrayNoDuplicatesSchema } from '@/lib/utils/parameter-validation';
import { createSuccessResponse, createErrorResponse } from '@/lib/dto/base';
import { withWriteTransaction } from '@/lib/database/transaction';
import { handleZodError } from '@/lib/utils/error-handler';
import Connection from '@/Database/Connection';
import AiProvider from '@/Database/Models/AiProvider';
import AiProviderModel from '@/Database/Models/AiProviderModels';
import AiProviderParameter from '@/Database/Models/AiProviderModelParameters';
import { updateOpenAPIFile } from '@/lib/api-docs/generate-provider-docs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { authOptions } from '@/lib/auth';

const execAsync = promisify(exec);

// Function to transform parameters into structured objects
function transformParametersToStructuredObject(parameters: any[]) {
  const structuredParams: any = {
    headers: {},
    body: {
      type: null,
      data: {}
    },
    query: {},
    parameters: {}
  };

  for (const param of parameters) {
    const { name, requestType, dataType, required, placeholder, description } = param;
    
    switch (requestType) {
      case 'header':
        structuredParams.headers[name] = {
          type: dataType,
          required,
          placeholder,
          description
        };
        break;
        
      case 'body-json':
      case 'body-form':
      case 'body-x-www-form-urlencoded':
        // Set the body type
        structuredParams.body.type = requestType;
        // Add to data object
        structuredParams.body.data[name] = {
          type: dataType,
          required,
          placeholder,
          description
        };
        break;
        
      case 'query':
        structuredParams.query[name] = {
          type: dataType,
          required,
          placeholder,
          description
        };
        break;
        
      case 'parameter':
        structuredParams.parameters[name] = {
          type: dataType,
          required,
          placeholder,
          description
        };
        break;
        

    }
  }

  return structuredParams;
}

// Schema for the complete request with duplicate validation
const createProviderWithModelsSchema = createParametersArrayNoDuplicatesSchema(
  z.object({
    provider: z.object({
      name: z.string().min(1).max(100),
      provider: z.string().min(1).max(100), // e.g., "OpenAI", "Anthropic", "Google"
      version: z.string().min(1).max(20), // e.g., "v1", "v2"
      description: z.string().min(1).max(500),
      isActive: z.boolean().default(true),
    }),
    models: z.array(z.object({
      name: z.string().min(1).max(100),
      description: z.string().min(1).max(500),
    })),
    parameters: z.array(z.object({
      name: z.string().min(1).max(100),
      requestType: z.enum(['header', 'body-json', 'body-form', 'body-x-www-form-urlencoded', 'parameter', 'query']),
              dataType: z.enum(['string', 'number', 'boolean', 'json', 'array', 'object', 'any']),
      required: z.boolean(),
      placeholder: z.string().optional(),
      description: z.string().max(500).optional(),
    }))
  }).refine(
    (data) => {
      const bodyTypes = data.parameters
        .map(p => p.requestType)
        .filter(type => type.startsWith('body-'));
      
      // Check if there's more than one body type
      const uniqueBodyTypes = [...new Set(bodyTypes)];
      return uniqueBodyTypes.length <= 1;
    },
    {
      message: "All body parameters must use the same type (JSON, Form, or URL Encoded)",
      path: ["parameters"]
    }
  )
);

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 'Authentication required', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    // Check if user is admin
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json(
        createErrorResponse('Admin access required', 'Admin access required', 'FORBIDDEN'),
        { status: 403 }
      );
    }

    await Connection.getInstance().connect();

    // Parse and validate request body
    const body = await request.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));
    console.log('Parameters field type:', typeof body.parameters);
    console.log('Parameters field:', body.parameters);
    
    const validatedData = createProviderWithModelsSchema.parse(body);

    // Transform parameters into structured object
    console.log('Validated parameters:', JSON.stringify(validatedData.parameters, null, 2));
    const structuredParameters = transformParametersToStructuredObject(validatedData.parameters);
    console.log('Structured parameters:', JSON.stringify(structuredParameters, null, 2));

    // Create provider with models and parameters in one transaction
    const result = await withWriteTransaction(async (dbSession) => {
      // 1. Create the AI Provider
      const newProvider = new AiProvider({
        name: validatedData.provider.name,
        provider: validatedData.provider.provider,
        version: validatedData.provider.version,
        description: validatedData.provider.description,
        isActive: validatedData.provider.isActive,
      });
      
      const savedProvider = await newProvider.save({ session: dbSession });

      // 2. Create models for this provider
      const savedModels = [];
      for (const modelData of validatedData.models) {
        const newModel = new AiProviderModel({
          name: modelData.name,
          description: modelData.description,
          ai_provider_id: savedProvider._id,
        });
        
        const savedModel = await newModel.save({ session: dbSession });
        savedModels.push(savedModel);
      }

      // 3. Create single parameter entry with structured object
      // Note: This is commented out because AiProviderParameter now links to ProviderEndpoint, not AiProvider
      // const newParameter = new AiProviderParameter({
      //   provider_endpoint_id: savedProvider._id, // Note: This might need to be updated to use ProviderEndpoint ID instead
      //   paramter: structuredParameters,
      // });
      
      // await newParameter.save({ session: dbSession });

      // 4. Generate OpenAPI documentation (commented out due to model restructuring)
      // try {
      //   updateOpenAPIFile(savedProvider, [newParameter]);
      //   
      //   // Regenerate Kubb documentation
      //   try {
      //     await execAsync('npm run generate:docs');
      //     console.log('✅ Kubb documentation regenerated successfully');
      //   } catch (kubbError) {
      //     console.error('Warning: Failed to regenerate Kubb documentation:', kubbError);
      //   }
      // } catch (openapiError) {
      //   console.error('Warning: Failed to generate OpenAPI documentation:', openapiError);
      //   // Don't fail the entire request if OpenAPI generation fails
      // }

      return {
        provider: savedProvider,
        models: savedModels,
        totalModels: savedModels.length,
        totalParameters: 0, // Parameters are now created separately with ProviderEndpoints
        structuredParameters
      };
    });

    const response = createSuccessResponse(
      result, 
      `Provider created successfully with ${result.totalModels} models and ${result.totalParameters} parameters`
    );
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST /api/ai-providers/create-with-models error:', error);
    
    return handleZodError(error);
  }
} 