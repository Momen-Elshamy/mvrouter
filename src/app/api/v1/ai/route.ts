import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/dto/base';
import { handleZodError } from '@/lib/utils/error-handler';
import { validateApiToken } from '@/lib/middleware/auth';
import Connection from '@/Database/Connection';
import AiProvider from '@/Database/Models/AiProvider';
import AiProviderParameter from '@/Database/Models/AiProviderModelParameters';
import ProviderEndpoint from '@/Database/Models/ProviderEndpoint';
import User from '@/Database/Models/User';
import AiProviderModels from '@/Database/Models/AiProviderModels';
import ProviderAdapter from '@/Database/Models/ProviderAdapter';
import AiProviderModelParameters from '@/Database/Models/AiProviderModelParameters';
import GlobalDefaultParameter from '@/Database/Models/GlobalDefaultParameter';

export async function POST(request: NextRequest) {
  try {
    // Debug: Log all headers
    console.log('All headers:', Object.fromEntries(request.headers.entries()));
    
    // Get API token from header
    const apiToken = request.headers.get('x-api-key');
    console.log('apiToken from x-api-key header:', apiToken);
    
    // Also check other common header names
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header:', authHeader);
    
    const apiKeyHeader = request.headers.get('apikey');
    console.log('apikey header:', apiKeyHeader);
    
    // Try to get token from different possible headers
    let finalApiToken = apiToken;
    
    if (!finalApiToken && authHeader && authHeader.startsWith('Bearer ')) {
      finalApiToken = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('Using token from Authorization header');
    }
    
    if (!finalApiToken && apiKeyHeader) {
      finalApiToken = apiKeyHeader;
      console.log('Using token from apikey header');
    }
    
    if (!finalApiToken) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 'API token is required in x-api-key, Authorization, or apikey header', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    // Validate API token
    const tokenValidation = await validateApiToken(finalApiToken);
    if (!tokenValidation.valid) {
      return NextResponse.json(
        createErrorResponse('Authentication failed', tokenValidation.error || 'Invalid API token', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    await Connection.getInstance().connect();
    console.log('tokenValidation?.user?.uid : ',tokenValidation?.user?.uid);
    
    // add here logic to try to get user from token by uid
    const user = await User.findById(tokenValidation?.user?.uid);
    if (!user) {
      return NextResponse.json(
        createErrorResponse('User not found', 'User not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // get body from request
    const body = await request.json();
    const providerSlug = body.provider;
    const provider_function = body.provider_function;

    // check if the provider and provider function is exist in the body
    if (!providerSlug || !provider_function) {
      return NextResponse.json(
        createErrorResponse('Provider and provider function are required', 'Provider and provider function are required', 'BAD_REQUEST'),
        { status: 400 }
      );
    }

    // check if the model is auto don't need to check the provider and model
    if (body.model === 'auto') {
      // TODO: here we need to get the best provider and model for the request
      // for now we will return a mock response
      return NextResponse.json(createSuccessResponse({ message: 'Request processed successfully' }, 'Request processed successfully'), { status: 200 });
    }

    // Find the provider by slug
    const provider = await AiProvider.findOne({ slug: providerSlug, isActive: true });
    if (!provider) {
      return NextResponse.json(
        createErrorResponse('Provider not found or not active in this time', `Provider with slug '${providerSlug}' not found`, 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // get model from body and check if its exist in the provider
    const model = body.model;
    const modelRow = await AiProviderModels.findOne({ name: model, isActive: true, ai_provider_id: provider._id });
    if (!modelRow) {
      return NextResponse.json(
        createErrorResponse('Model not found or not active in this time', `Model with name '${model}' not found`, 'NOT_FOUND'),
        { status: 404 }
      );
    }

    console.log('{ ai_provider_id: provider._id, isActive: true , name: provider_function} ::: ',{ ai_provider_id: provider._id, isActive: true , name: provider_function});
    
    // we need to get the provider endpoint for this provider and provider function
    const providerEndpoint = await ProviderEndpoint.findOne({ ai_provider_id: provider._id, isActive: true , name: provider_function});
    console.log('providerEndpoint ::: ',providerEndpoint);
    
    if (!providerEndpoint) {
      return NextResponse.json(
        createErrorResponse('Provider endpoint not found', 'Provider endpoint not configured', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Validate provider endpoint URL
    if (!providerEndpoint.path_to_api) {
      return NextResponse.json(
        createErrorResponse('Provider endpoint URL not configured', 'Provider endpoint URL is missing', 'BAD_REQUEST'),
        { status: 400 }
      );
    }

    console.log('Provider endpoint found:', {
      id: providerEndpoint._id,
      name: providerEndpoint.name,
      url: providerEndpoint.path_to_api,
      method: providerEndpoint.method
    });

    // get provider endpoint parameters
    const providerEndpointParameters = await AiProviderModelParameters.findOne({ provider_endpoint_id: providerEndpoint._id });
    if (!providerEndpointParameters) {
      return NextResponse.json(
        createErrorResponse('Provider endpoint parameters not found', 'Provider endpoint parameters not configured', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Force register GlobalDefaultParameter model by making a simple query
    await GlobalDefaultParameter.findOne().limit(1);

    // get the provider endpoint adapter and populate defaultParameterId
    const providerEndpointAdapter = await ProviderAdapter.findOne({ providerEndpointId: providerEndpoint._id, isActive: true }).populate({
      path: 'defaultParameterId',
      model: 'GlobalDefaultParameter'
    });
    if (!providerEndpointAdapter) {
      return NextResponse.json(
        createErrorResponse('Provider endpoint adapter not found', 'Provider endpoint adapter not configured', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    //default paramter data from provider endpoint adapter
    const defaultParameterData = providerEndpointAdapter.defaultParameterId;

    // now we have the defualt and provider endpoint parameters we need to get the mapping of the parameters
    const mapping = providerEndpointAdapter.mappings;

    // now we need to create request body for the provider endpoint but we need to match the mapping with the endpoint parameters
    // Map the incoming request body to the provider's expected format using reverse mapping
    const mappedRequest = mapRequestToProviderFormat(body, mapping, defaultParameterData);

    // Validate provider endpoint URL
    if (!providerEndpoint.path_to_api) {
      return NextResponse.json(
        createErrorResponse('Provider endpoint URL not configured', 'Provider endpoint URL is missing', 'BAD_REQUEST'),
        { status: 400 }
      );
    }

    console.log('Provider endpoint URL:', providerEndpoint.path_to_api);
    console.log('Mapped request:', mappedRequest);

    // Validate and clean the mapped request using provider adapter mappings
    const validatedRequest = validateAndCleanRequest(mappedRequest, providerEndpointParameters.paramter, mapping);
    console.log('Validated request:', validatedRequest);

    // Fix request structure using OpenAI for provider compatibility
    const fixedRequest = await fixRequestWithOpenAI(
      validatedRequest,
      providerEndpoint,
      providerEndpointParameters.paramter,
      provider
    );
    console.log('Fixed request:', fixedRequest);

    // now we need to create request body for the provider endpoint
    // Make the actual API call to the provider endpoint
    console.log('fixedRequest ::: ',fixedRequest);

    // we need to get the provider slug and get the provider api key from the env
    const providerApiKey = process.env[`PROVIDER_API_KEY_${provider.slug.toUpperCase()}`];
    if (!providerApiKey) {
      return NextResponse.json(
        createErrorResponse('Provider API key not found', 'Provider API key not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    if(provider.slug === 'openai'){
      fixedRequest.headers['Authorization'] = `Bearer ${providerApiKey}`;
    }else if(provider.slug === 'anthropic'){
      fixedRequest.headers['Authorization'] = `Bearer ${providerApiKey}`;
    }else if(provider.slug === 'gemini'){
      fixedRequest.headers['x-goog-api-key'] = `${providerApiKey}`;
    }else if(provider.slug === 'claude'){
      fixedRequest.headers['Authorization'] = `Bearer ${providerApiKey}`;
    }
    
    const providerResponse = await makeProviderApiCall(
      providerEndpoint.path_to_api,
      fixedRequest.body,
      fixedRequest.headers,
      fixedRequest.parameters,
      fixedRequest.query
    );

    // Return the provider's response
    const response = createSuccessResponse(
      providerResponse,
      `Request processed successfully by ${provider.name}`
    );
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error(`POST /api/v1/ai error:`, error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Provider API')) {
        return NextResponse.json(
          createErrorResponse('Provider API Error', error.message, 'PROVIDER_ERROR'),
          { status: 502 }
        );
      }
      
      if (error.message.includes('URL is required') || error.message.includes('Invalid URL')) {
        return NextResponse.json(
          createErrorResponse('Configuration Error', error.message, 'CONFIGURATION_ERROR'),
          { status: 500 }
        );
      }
    }
    
    return handleZodError(error);
  }
}

// Function to validate and clean request using provider adapter mappings
function validateAndCleanRequest(
  mappedRequest: { body: any; headers: any; parameters: any; query: any },
  providerParameters: any,
  mappings: Array<{fromField: string, toField: string, fieldType: string}>
): { body: any; headers: any; parameters: any; query: any } {
  console.log('mappedRequest ::: ',mappedRequest);
  console.log('providerParameters ::: ',providerParameters);
  console.log('mappings ::: ',mappings);
  
  const cleanedRequest: {
    body: Record<string, any>;
    headers: Record<string, any>;
    parameters: Record<string, any>;
    query: Record<string, any>;
  } = {
    body: {},
    headers: {},
    parameters: {},
    query: {}
  };

  // Apply mappings to transform the request
  if (mappings && Array.isArray(mappings)) {
    mappings.forEach(mapping => {
      const { fromField, toField, fieldType } = mapping;
      console.log(`Processing mapping: ${toField} -> ${fromField} in ${fieldType}`);
      
      // Get the value from the mapped request using the toField (default format)
      const value = getNestedValue(mappedRequest, toField);
      console.log(`Value for ${toField}:`, value);
      
      if (value !== undefined) {
        // Set the value in the appropriate field type using fromField (provider format)
        setNestedValue(cleanedRequest[fieldType as keyof typeof cleanedRequest], fromField, value);
        console.log(`Mapped ${toField} (${value}) to ${fromField} in ${fieldType}`);
      } else {
        // Try alternative paths if the exact path doesn't exist
        const alternativePaths = [
          toField.replace('body.data.', 'body.'),
          toField.replace('body.', ''),
          toField.split('.').pop() || '' // Just the field name
        ];
        console.log(`Trying alternative paths:`, alternativePaths);
        
        for (const altPath of alternativePaths) {
          const altValue = getNestedValue(mappedRequest, altPath);
          console.log(`Alternative path ${altPath}:`, altValue);
          if (altValue !== undefined) {
            setNestedValue(cleanedRequest[fieldType as keyof typeof cleanedRequest], fromField, altValue);
            console.log(`Mapped ${altPath} (${altValue}) to ${fromField} in ${fieldType} (alternative path)`);
            break;
          }
        }
      }
    });
  }

  return cleanedRequest;
}

// Function to clean OpenAI response and extract actual data
function cleanOpenAIResponse(fixedRequest: any): { body: any; headers: any; parameters: any; query: any } {
  const cleaned = {
    body: {},
    headers: {},
    parameters: {},
    query: {}
  };

  // Clean body - extract data from nested structure
  if (fixedRequest.body) {
    if (fixedRequest.body.data) {
      // Extract actual data from body.data
      cleaned.body = fixedRequest.body.data;
    } else {
      cleaned.body = fixedRequest.body;
    }
  }

  // Clean headers - extract data from nested structure
  if (fixedRequest.headers) {
    if (fixedRequest.headers.data) {
      cleaned.headers = fixedRequest.headers.data;
    } else {
      cleaned.headers = fixedRequest.headers;
    }
  }

  // Clean parameters - extract data from nested structure
  if (fixedRequest.parameters) {
    if (fixedRequest.parameters.data) {
      cleaned.parameters = fixedRequest.parameters.data;
    } else {
      cleaned.parameters = fixedRequest.parameters;
    }
  }

  // Clean query - extract data from nested structure
  if (fixedRequest.query) {
    if (fixedRequest.query.data) {
      cleaned.query = fixedRequest.query.data;
    } else {
      cleaned.query = fixedRequest.query;
    }
  }

  return cleaned;
}

// Function to fix request structure using OpenAI for provider compatibility
async function fixRequestWithOpenAI(
  validatedRequest: { body: any; headers: any; parameters: any; query: any },
  providerEndpoint: any,
  providerParameters: any,
  provider: any
): Promise<{ body: any; headers: any; parameters: any; query: any }> {
  try {
    // Get OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.log('OpenAI API key not found, using original request');
      return validatedRequest;
    }

    // Create system prompt
    const systemPrompt = `You are an expert API request transformer. Your job is to fix request structures to match different AI provider APIs.

Provider Details:
- Provider: ${provider.provider}
- Endpoint: ${providerEndpoint.path_to_api}
- Model: ${providerEndpoint.name}
- Provider Name: ${provider.name}

Current Request Structure (the actual request data):
${JSON.stringify(validatedRequest, null, 2)}

Provider Expected Parameters (the schema/definition):
${JSON.stringify(providerParameters, null, 2)}

Your task is to transform the CURRENT REQUEST DATA to match the provider's expected format. 
CRITICAL: Return the ACTUAL REQUEST DATA transformed, NOT the parameter schema.
CRITICAL: Use the values from the Current Request Structure, not the parameter definitions.

Key considerations:
1. Field name mappings (e.g., "messages" → "contents", "content" → "text", etc.)
2. Nested structure differences (e.g., "content" vs "parts[0].text")
3. Role name variations (e.g., "user/assistant" vs "user/model" vs "human/ai")
4. if the field is not in the provider expected parameters, transform it to fix the request structure , Example: if provider expect [{"role": "user", "content": "Hello, how are you?"}] and the current request is "Hello, how are you?" then you need to transform it to [{"role": "user", "contents": "Hello, how are you?"}]
5. Array vs object structures
6. Required vs optional fields

Transform the actual request data to match the provider's format. Return the corrected request structure with the actual data values.`;

    // Function definition for structured response
    const functionDefinition = {
      name: "fix_request_structure",
      description: "Fix the request structure to match the target provider API",
      parameters: {
        type: "object",
        properties: {
          body: {
            type: "object",
            description: "The corrected request body with actual data (not schema)"
          },
          headers: {
            type: "object", 
            description: "The corrected request headers with actual data (not schema)"
          },
          parameters: {
            type: "object",
            description: "The corrected URL parameters with actual data (not schema)"
          },
          query: {
            type: "object",
            description: "The corrected query parameters with actual data (not schema)"
          }
        },
        required: ["body", "headers", "parameters", "query"]
      }
    };

    // Make OpenAI API call
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Please fix this request structure for the target provider.' }
        ],
        functions: [functionDefinition],
        function_call: { name: 'fix_request_structure' },
        temperature: 0.1
      })
    });

    if (!openaiResponse.ok) {
      console.log('OpenAI API call failed, using original request');
      return validatedRequest;
    }

    const openaiData = await openaiResponse.json();
    const functionCall = openaiData.choices[0]?.message?.function_call;
    
    if (functionCall && functionCall.name === 'fix_request_structure') {
      const fixedRequest = JSON.parse(functionCall.arguments);
      console.log('OpenAI fixed request structure:', fixedRequest);
      
      // Clean the OpenAI response to extract actual data
      const cleanedRequest = cleanOpenAIResponse(fixedRequest);
      console.log('Cleaned request:', cleanedRequest);
      return cleanedRequest;
    }

    console.log('No function call returned, using original request');
    return validatedRequest;

  } catch (error) {
    console.error('Error in OpenAI fixing:', error);
    return validatedRequest;
  }
}


// Helper function to map request body to provider format using reverse mapping
function mapRequestToProviderFormat(
  requestBody: any, 
  mappings: Array<{fromField: string, toField: string, fieldType: string}>, 
  defaultParameters: any
): {body: any, headers: any, parameters: any, query: any} {
  // Extract only the actual data from Mongoose document
  const defaultParamsData = defaultParameters && defaultParameters._doc ? defaultParameters._doc : defaultParameters;
  
  const result: {
    body: Record<string, any>;
    headers: Record<string, any>;
    parameters: Record<string, any>;
    query: Record<string, any>;
  } = {
    body: {},
    headers: {},
    parameters: {},
    query: {}
  };

  // Apply reverse mapping: from default format (toField) to provider format (fromField)
  if (mappings && Array.isArray(mappings)) {
    mappings.forEach(mapping => {
      const { fromField, toField, fieldType } = mapping;
      
      // Get the value from the user's request using the toField (default format)
      const value = getNestedValue(requestBody, toField);
      
      if (value !== undefined) {
        // Set the value in the appropriate field type using fromField (provider format)
        setNestedValue(result[fieldType as keyof typeof result], fromField, value);
      }
    });
  }

  // Remove provider and provider_function from body as they're not needed for the provider API
  const { provider, provider_function, ...cleanRequestBody } = requestBody;
  
  // Add any remaining unmapped fields from request body to the body section
  Object.entries(cleanRequestBody).forEach(([key, value]) => {
    if (!result.body.hasOwnProperty(key)) {
      result.body[key] = value;
    }
  });

  return result;
}

// Helper function to get nested object value using dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// Helper function to set nested object value using dot notation
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  
  const target = keys.reduce((current, key) => {
    if (!current[key]) {
      current[key] = {};
    }
    return current[key];
  }, obj);
  
  target[lastKey] = value;
}

// Helper function to make API call to provider
async function makeProviderApiCall(
  url: string, 
  body: any, 
  headers: any,
  parameters: any,
  query: any
): Promise<any> {
  try {
    // Validate input parameters
    if (!url) {
      throw new Error('URL is required for API call');
    }

    if (typeof url !== 'string') {
      throw new Error(`Invalid URL type: ${typeof url}. Expected string.`);
    }

    console.log('Making API call to:', url);
    console.log('Request body:', JSON.stringify(body));
    console.log('Request headers:', JSON.stringify(headers));
    console.log('Request parameters:', JSON.stringify(parameters));
    console.log('Request query:', JSON.stringify(query));

    // Build URL with query parameters
    let finalUrl = url;
    if (Object.keys(query).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
      finalUrl += `?${queryParams.toString()}`;
    }

    console.log('Final URL:', finalUrl);

    // Build request headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    // Add parameters to headers if they exist
    if (parameters && typeof parameters === 'object') {
      Object.entries(parameters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          requestHeaders[key] = String(value);
        }
      });
    }

    console.log('Final request headers:', requestHeaders);
    console.log('finalUrl ::: ',finalUrl);
    console.log('requestHeaders ::: ',requestHeaders);
    console.log('body ::: ',body);

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(body)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Provider API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('Provider API call error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to call provider API: ${error.message}`);
    } else {
      throw new Error(`Failed to call provider API: Unknown error`);
    }
  }
} 