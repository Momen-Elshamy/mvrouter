// import { NextRequest, NextResponse } from 'next/server';
// import { createSuccessResponse, createErrorResponse } from '@/lib/dto/base';
// import { handleZodError } from '@/lib/utils/error-handler';
// import { validateApiToken } from '@/lib/middleware/auth';
// import Connection from '@/Database/Connection';
// import AiProvider from '@/Database/Models/AiProvider';
// import AiProviderParameter from '@/Database/Models/AiProviderModelParameters';
// import ProviderEndpoint from '@/Database/Models/ProviderEndpoint';
// import User from '@/Database/Models/User';
// import AiProviderModels from '@/Database/Models/AiProviderModels';
// import ProviderAdapter from '@/Database/Models/ProviderAdapter';
// import AiProviderModelParameters from '@/Database/Models/AiProviderModelParameters';

// export async function POST(
//   request: NextRequest,
//   { params }: { params: { slug: string } }
// ) {
//   try {
//     // Debug: Log all headers
//     console.log('All headers:', Object.fromEntries(request.headers.entries()));
    
//     // Get API token from header
//     const apiToken = request.headers.get('x-api-key');
//     console.log('apiToken from x-api-key header:', apiToken);
    
//     // Also check other common header names
//     const authHeader = request.headers.get('authorization');
//     console.log('Authorization header:', authHeader);
    
//     const apiKeyHeader = request.headers.get('apikey');
//     console.log('apikey header:', apiKeyHeader);
    
//     // Try to get token from different possible headers
//     let finalApiToken = apiToken;
    
//     if (!finalApiToken && authHeader && authHeader.startsWith('Bearer ')) {
//       finalApiToken = authHeader.substring(7); // Remove 'Bearer ' prefix
//       console.log('Using token from Authorization header');
//     }
    
//     if (!finalApiToken && apiKeyHeader) {
//       finalApiToken = apiKeyHeader;
//       console.log('Using token from apikey header');
//     }
    
//     if (!finalApiToken) {
//       return NextResponse.json(
//         createErrorResponse('Authentication required', 'API token is required in x-api-key, Authorization, or apikey header', 'UNAUTHORIZED'),
//         { status: 401 }
//       );
//     }

//     // Validate API token
//     const tokenValidation = await validateApiToken(finalApiToken);
//     if (!tokenValidation.valid) {
//       return NextResponse.json(
//         createErrorResponse('Authentication failed', tokenValidation.error || 'Invalid API token', 'UNAUTHORIZED'),
//         { status: 401 }
//       );
//     }

//     await Connection.getInstance().connect();

//     // add here logic to try to get user from token by uid
//     const user = await User.findOne({ uid: tokenValidation?.user?.uid });
//     if (!user) {
//       return NextResponse.json(
//         createErrorResponse('User not found', 'User not found', 'NOT_FOUND'),
//         { status: 404 }
//       );
//     }

//     // get body from request
//     const body = await request.json();
//     const providerSlug = body.provider;
//     const provider_function = body.provider_function;

//     // check if the provider and provider function is exist in the body
//     if (!providerSlug || !provider_function) {
//       return NextResponse.json(
//         createErrorResponse('Provider and provider function are required', 'Provider and provider function are required', 'BAD_REQUEST'),
//         { status: 400 }
//       );
//     }

//     // check if the model is auto don't need to check the provider and model
//     if (body.model === 'auto') {
//       // TODO: here we need to get the best provider and model for the request
//       // for now we will return a mock response
//       return NextResponse.json(createSuccessResponse({ message: 'Request processed successfully' }, 'Request processed successfully'), { status: 200 });
//     }

//     // Find the provider by slug
//     const provider = await AiProvider.findOne({ slug: providerSlug, isActive: true });
//     if (!provider) {
//       return NextResponse.json(
//         createErrorResponse('Provider not found or not active in this time', `Provider with slug '${params.slug}' not found`, 'NOT_FOUND'),
//         { status: 404 }
//       );
//     }

//     // get model from body and check if its exist in the provider
//     const model = body.model;
//     const modelRow = await AiProviderModels.findOne({ name: model, isActive: true, ai_provider_id: provider._id });
//     if (!modelRow) {
//       return NextResponse.json(
//         createErrorResponse('Model not found or not active in this time', `Model with name '${model}' not found`, 'NOT_FOUND'),
//         { status: 404 }
//       );
//     }

//     // we need to get the provider endpoint for this provider and provider function
//     const providerEndpoint = await ProviderEndpoint.findOne({ ai_provider_id: provider._id, isActive: true , name: provider_function});
//     if (!providerEndpoint) {
//       return NextResponse.json(
//         createErrorResponse('Provider endpoint not found', 'Provider endpoint not configured', 'NOT_FOUND'),
//         { status: 404 }
//       );
//     }

//     // get provider endpoint parameters
//     const providerEndpointParameters = await AiProviderModelParameters.findOne({ provider_endpoint_id: providerEndpoint._id });
//     if (!providerEndpointParameters) {
//       return NextResponse.json(
//         createErrorResponse('Provider endpoint parameters not found', 'Provider endpoint parameters not configured', 'NOT_FOUND'),
//         { status: 404 }
//       );
//     }

//     // get the provider endpoint adapter and populate defaultParameterId
//     const providerEndpointAdapter = await ProviderAdapter.findOne({ provider_endpoint_id: providerEndpoint._id, isActive: true }).populate('defaultParameterId');
//     if (!providerEndpointAdapter) {
//       return NextResponse.json(
//         createErrorResponse('Provider endpoint adapter not found', 'Provider endpoint adapter not configured', 'NOT_FOUND'),
//         { status: 404 }
//       );
//     }

//     //default paramter data from provider endpoint adapter
//     const defaultParameterData = providerEndpointAdapter.defaultParameterId;

//     // now we have the defualt and provider endpoint parameters we need to get the mapping of the parameters
//     const mapping = providerEndpointAdapter.mappings;

//     // now we need to create request body for the provider endpoint but we need to match the mapping with the endpoint parameters
//     // Map the incoming request body to the provider's expected format using reverse mapping
//     const mappedRequest = mapRequestToProviderFormat(body, mapping, defaultParameterData);

//     //before we call the provider endpoint we need to get provider api key from our env based on slug of provider
//     const providerApiKey = process.env[`PROVIDER_API_KEY_${provider.slug.toUpperCase()}`];
//     if (!providerApiKey) {
//       return NextResponse.json(
//         createErrorResponse('Provider API key not found', 'Provider API key not found', 'NOT_FOUND'),
//         { status: 404 }
//       );
//     }

//     // based on the providerslut we will add the header to the request
//     mappedRequest.headers['Authorization'] = `Bearer ${providerApiKey}`;

//     // now we need to create request body for the provider endpoint
//     // Make the actual API call to the provider endpoint
//     const providerResponse = await makeProviderApiCall(
//       providerEndpoint.url,
//       mappedRequest.body,
//       mappedRequest.headers,
//       mappedRequest.parameters,
//       mappedRequest.query
//     );

//     // Return the provider's response
//     const response = createSuccessResponse(
//       providerResponse,
//       `Request processed successfully by ${provider.name}`
//     );
    
//     return NextResponse.json(response, { status: 200 });
//   } catch (error) {
//     console.error(`POST /api/v1/${params.slug} error:`, error);
    
//     return handleZodError(error);
//   }
// }

// function validateRequestAgainstParameters(requestBody: any, parameters: any): { isValid: boolean; errors: string[] } {
//   const errors: string[] = [];

//   // Validate body parameters
//   if (parameters.body && parameters.body.data) {
//     Object.entries(parameters.body.data).forEach(([name, config]: [string, any]) => {
//       if (config.required && !requestBody[name]) {
//         errors.push(`Required body parameter '${name}' is missing`);
//       }
      
//       if (requestBody[name] !== undefined) {
//         // Type validation
//         const actualType = typeof requestBody[name];
//         const expectedType = config.type;
        
//         if (expectedType === 'string' && actualType !== 'string') {
//           errors.push(`Parameter '${name}' must be a string`);
//         } else if (expectedType === 'number' && actualType !== 'number') {
//           errors.push(`Parameter '${name}' must be a number`);
//         } else if (expectedType === 'boolean' && actualType !== 'boolean') {
//           errors.push(`Parameter '${name}' must be a boolean`);
//         }
//       }
//     });
//   }

//   return {
//     isValid: errors.length === 0,
//     errors
//   };
// } 

// // Helper function to map request body to provider format using reverse mapping
// function mapRequestToProviderFormat(
//   requestBody: any, 
//   mappings: Array<{fromField: string, toField: string, fieldType: string}>, 
//   defaultParameters: any
// ): {body: any, headers: any, parameters: any, query: any} {
//   const result = {
//     body: { ...defaultParameters },
//     headers: {},
//     parameters: {},
//     query: {}
//   };

//   // Apply reverse mapping: from default format (toField) to provider format (fromField)
//   if (mappings && Array.isArray(mappings)) {
//     mappings.forEach(mapping => {
//       const { fromField, toField, fieldType } = mapping;
      
//       // Get the value from the user's request using the toField (default format)
//       const value = getNestedValue(requestBody, toField);
      
//       if (value !== undefined) {
//         // Set the value in the appropriate field type using fromField (provider format)
//         setNestedValue(result[fieldType as keyof typeof result], fromField, value);
//       }
//     });
//   }

//   // Also include any unmapped fields from request body in the body section
//   Object.entries(requestBody).forEach(([key, value]) => {
//     if (!result.body.hasOwnProperty(key)) {
//       result.body[key] = value;
//     }
//   });

//   return result;
// }

// // Helper function to get nested object value using dot notation
// function getNestedValue(obj: any, path: string): any {
//   return path.split('.').reduce((current, key) => {
//     return current && current[key] !== undefined ? current[key] : undefined;
//   }, obj);
// }

// // Helper function to set nested object value using dot notation
// function setNestedValue(obj: any, path: string, value: any): void {
//   const keys = path.split('.');
//   const lastKey = keys.pop()!;
  
//   const target = keys.reduce((current, key) => {
//     if (!current[key]) {
//       current[key] = {};
//     }
//     return current[key];
//   }, obj);
  
//   target[lastKey] = value;
// }

// // Helper function to make API call to provider
// async function makeProviderApiCall(
//   url: string, 
//   body: any, 
//   headers: any,
//   parameters: any,
//   query: any
// ): Promise<any> {
//   try {
//     // Build URL with query parameters
//     let finalUrl = url;
//     if (Object.keys(query).length > 0) {
//       const queryParams = new URLSearchParams();
//       Object.entries(query).forEach(([key, value]) => {
//         queryParams.append(key, String(value));
//       });
//       finalUrl += `?${queryParams.toString()}`;
//     }

//     // Build request headers
//     const requestHeaders = {
//       'Content-Type': 'application/json',
//       ...headers
//     };

//     // Add parameters to headers if they exist
//     Object.entries(parameters).forEach(([key, value]) => {
//       requestHeaders[key] = String(value);
//     });

//     const response = await fetch(finalUrl, {
//       method: 'POST',
//       headers: requestHeaders,
//       body: JSON.stringify(body)
//     });

//     if (!response.ok) {
//       throw new Error(`Provider API error: ${response.status} ${response.statusText}`);
//     }

//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error('Provider API call error:', error);
//     throw new Error(`Failed to call provider API: ${error instanceof Error ? error.message : 'Unknown error'}`);
//   }
// } 