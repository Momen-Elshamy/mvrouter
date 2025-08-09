import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface ParameterField {
  type: string;
  required: boolean;
  placeholder?: string;
  description?: string;
}

interface BodyStructure {
  type: string | null;
  data: Record<string, ParameterField>;
}

interface StructuredParameters {
  headers: Record<string, ParameterField>;
  body: BodyStructure;
  query: Record<string, ParameterField>;
  parameters: Record<string, ParameterField>;
}

interface AiProvider {
  _id: string;
  name: string;
  slug: string;
  path_to_api: string;
  description: string;
  version: string;
  type: string;
  icon: string;
  isActive: boolean;
}

interface AiProviderParameter {
  _id: string;
  ai_provider_id: string;
  paramter: StructuredParameters;
}

export function generateProviderOpenAPI(
  provider: AiProvider,
  parameters: AiProviderParameter[]
): any {
  // Find the parameter set for this provider
  const providerParams = parameters.find(p => p.ai_provider_id === provider._id);
  
  if (!providerParams) {
    throw new Error(`No parameters found for provider ${provider.name}`);
  }

  const params = providerParams.paramter;

  // Generate request body schema
  const requestBodySchema: any = {
    type: 'object',
    properties: {},
    required: []
  };

  // Add body parameters to schema
  if (params.body.type && params.body.data) {
    Object.entries(params.body.data).forEach(([name, config]) => {
      const propertySchema = getPropertySchema(config.type);
      requestBodySchema.properties[name] = {
        ...propertySchema,
        description: config.description || `${name} parameter`,
        example: getExampleValue(config.type, config.placeholder)
      };
      
      if (config.required) {
        requestBodySchema.required.push(name);
      }
    });
  }

  // Generate OpenAPI path
  const pathItem: any = {
    post: {
      tags: [provider.name],
      summary: `${provider.name} API`,
      description: provider.description,
      operationId: `${provider.slug}_process`,
      parameters: [],
      requestBody: {
        content: {}
      },
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  data: {
                    type: 'object',
                    description: 'AI provider response data'
                  },
                  message: {
                    type: 'string',
                    example: 'Request processed successfully'
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  };

  // Add header parameters
  if (params.headers) {
    Object.entries(params.headers).forEach(([name, config]) => {
      pathItem.post.parameters.push({
        name,
        in: 'header',
        required: config.required,
        schema: {
          type: getOpenAPIType(config.type)
        },
        description: config.description || `${name} header parameter`
      });
    });
  }

  // Add query parameters
  if (params.query) {
    Object.entries(params.query).forEach(([name, config]) => {
      pathItem.post.parameters.push({
        name,
        in: 'query',
        required: config.required,
        schema: {
          type: getOpenAPIType(config.type)
        },
        description: config.description || `${name} query parameter`
      });
    });
  }



  // Set request body content type based on body type
  if (params.body.type) {
    const contentType = getContentType(params.body.type);
    pathItem.post.requestBody.content[contentType] = {
      schema: requestBodySchema
    };
  }

  return pathItem;
}

function getPropertySchema(dataType: string): any {
  switch (dataType) {
    case 'string':
      return { type: 'string' };
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'json':
      return { type: 'object' };
    case 'array':
      return { type: 'array', items: { type: 'string' } };
    case 'object':
      return { type: 'object' };
    default:
      return { type: 'string' };
  }
}

function getOpenAPIType(dataType: string): string {
  switch (dataType) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'json':
    case 'object':
      return 'object';
    case 'array':
      return 'array';
    default:
      return 'string';
  }
}

function getContentType(bodyType: string): string {
  switch (bodyType) {
    case 'body-json':
      return 'application/json';
    case 'body-form':
      return 'multipart/form-data';
    case 'body-x-www-form-urlencoded':
      return 'application/x-www-form-urlencoded';
    default:
      return 'application/json';
  }
}

function getExampleValue(dataType: string, placeholder?: string): any {
  if (placeholder) {
    return placeholder;
  }
  
  switch (dataType) {
    case 'string':
      return 'example string';
    case 'number':
      return 123;
    case 'boolean':
      return true;
    case 'json':
      return { key: 'value' };
    case 'array':
      return ['item1', 'item2'];
    case 'object':
      return { property: 'value' };
    default:
      return 'example';
  }
}

export function updateOpenAPIFile(provider: AiProvider, parameters: AiProviderParameter[]): void {
  try {
    // Read current OpenAPI file
    const openapiPath = join(process.cwd(), 'openapi.json');
    
    // Check if file exists
    try {
      const openapiContent = readFileSync(openapiPath, 'utf8');
      const openapi = JSON.parse(openapiContent);

      // Generate the new path
      const pathItem = generateProviderOpenAPI(provider, parameters);
      
      // Add the new path to the OpenAPI spec
      if (!openapi.paths) {
        openapi.paths = {};
      }
      
      openapi.paths[`/api/v1/${provider.slug}`] = pathItem;

      // Write updated OpenAPI file
      writeFileSync(openapiPath, JSON.stringify(openapi, null, 2));
      
      console.log(`✅ OpenAPI documentation updated for provider: ${provider.name}`);
    } catch (fileError) {
      console.error('❌ Error reading or writing OpenAPI file:', fileError);
      throw new Error(`Failed to update OpenAPI file: ${fileError}`);
    }
  } catch (error) {
    console.error('❌ Error updating OpenAPI file:', error);
    throw error;
  }
} 