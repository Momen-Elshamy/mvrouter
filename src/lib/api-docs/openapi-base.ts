import { z } from 'zod';
import { 
  aiProviderSchema,
  aiProviderUpdateSchema,
  aiProviderResponseSchema,
  aiProviderListResponseSchema,
  aiProviderPaginatedResponseSchema,
} from '@/lib/dto/ai-provider';
import { 
  aiProviderTokenSchema,
  aiProviderTokenUpdateSchema,
  aiProviderTokenResponseSchema,
  aiProviderTokenCreateResponseSchema,
  aiProviderTokenListResponseSchema,
  aiProviderTokenPaginatedResponseSchema,
} from '@/lib/dto/ai-provider-token';
import { 
  aiProviderParametersSchema,
  aiProviderParametersUpdateSchema,
  aiProviderParametersResponseSchema,
  aiProviderParametersListResponseSchema,
  aiProviderParametersPaginatedResponseSchema,
} from '@/lib/dto/ai-provider-parameters';
import { 
  userCreateSchema,
  userUpdateSchema,
  userResponseSchema,
  userListResponseSchema,
  userPaginatedResponseSchema,
} from '@/lib/dto/user';

// Base OpenAPI 3.0 Specification
export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'HiveRouter API',
    description: 'AI Provider Management System API',
    version: '1.0.0',
    contact: {
      name: 'HiveRouter Support',
      email: 'support@hiverouter.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  security: [
    {
      bearerAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from NextAuth.js',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
          error: {
            type: 'string',
            example: 'ERROR_CODE',
          },
        },
        required: ['success', 'message', 'error'],
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            example: 1,
          },
          limit: {
            type: 'integer',
            example: 10,
          },
          total: {
            type: 'integer',
            example: 100,
          },
          totalPages: {
            type: 'integer',
            example: 10,
          },
          hasNext: {
            type: 'boolean',
            example: true,
          },
          hasPrev: {
            type: 'boolean',
            example: false,
          },
        },
        required: ['page', 'limit', 'total', 'totalPages', 'hasNext', 'hasPrev'],
      },
      // AI Provider Schemas
      AiProvider: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          name: {
            type: 'string',
            example: 'OpenAI',
          },
          description: {
            type: 'string',
            example: 'OpenAI API provider',
          },
          baseUrl: {
            type: 'string',
            example: 'https://api.openai.com/v1',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive'],
            example: 'active',
          },
          icon: {
            type: 'string',
            example: 'openai-icon.svg',
          },
          color: {
            type: 'string',
            example: '#10A37F',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
        required: ['name', 'description', 'baseUrl', 'status'],
      },
      // AI Provider Token Schemas
      AiProviderToken: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          name: {
            type: 'string',
            example: 'My OpenAI Token',
          },
          userId: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          isActive: {
            type: 'boolean',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
        required: ['name', 'userId', 'isActive'],
      },
      // AI Provider Parameters Schemas
      AiProviderParameters: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          ai_provider_id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          paramter: {
            type: 'object',
            example: {
              max_tokens: 1000,
              temperature: 0.7,
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
        required: ['ai_provider_id', 'paramter'],
      },
      // User Schemas
      User: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john@example.com',
          },
          role: {
            type: 'object',
            properties: {
              _id: {
                type: 'string',
                example: '507f1f77bcf86cd799439011',
              },
              name: {
                type: 'string',
                enum: ['admin', 'user'],
                example: 'user',
              },
              description: {
                type: 'string',
                example: 'Regular user role',
              },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
        required: ['name', 'email', 'role'],
      },
    },
  },
  paths: {
    // AI Providers
    '/api/ai-providers': {
      get: {
        summary: 'List AI providers',
        description: 'Get paginated list of AI providers (Admin and User access)',
        tags: ['AI Providers'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page',
            schema: { type: 'integer', default: 10 },
          },
          {
            name: 'sortBy',
            in: 'query',
            description: 'Sort field',
            schema: { type: 'string', default: 'createdAt' },
          },
          {
            name: 'sortOrder',
            in: 'query',
            description: 'Sort order',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search term',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AiProviderPaginatedResponse',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create AI provider',
        description: 'Create a new AI provider (Admin only)',
        tags: ['AI Providers'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AiProvider' },
            },
          },
        },
        responses: {
          201: {
            description: 'AI provider created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AiProvider' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          403: {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/ai-providers/{id}': {
      get: {
        summary: 'Get AI provider by ID',
        description: 'Get a specific AI provider by ID (Admin and User access)',
        tags: ['AI Providers'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'AI provider ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AiProvider' },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'AI provider not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update AI provider',
        description: 'Update an AI provider (Admin only)',
        tags: ['AI Providers'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'AI provider ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AiProvider' },
            },
          },
        },
        responses: {
          200: {
            description: 'AI provider updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AiProvider' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          403: {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'AI provider not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete AI provider',
        description: 'Delete an AI provider (Admin only)',
        tags: ['AI Providers'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'AI provider ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'AI provider deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'AI provider deleted successfully' },
                    data: { type: 'null', example: null },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          403: {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'AI provider not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    // AI Provider Tokens
    '/api/ai-provider-tokens': {
      get: {
        summary: 'List AI provider tokens',
        description: 'Get paginated list of AI provider tokens (User-specific access)',
        tags: ['AI Provider Tokens'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page',
            schema: { type: 'integer', default: 10 },
          },
          {
            name: 'sortBy',
            in: 'query',
            description: 'Sort field',
            schema: { type: 'string', default: 'createdAt' },
          },
          {
            name: 'sortOrder',
            in: 'query',
            description: 'Sort order',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search term',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AiProviderTokenPaginatedResponse',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create AI provider token',
        description: 'Create a new AI provider token (User access, token hashed after first display)',
        tags: ['AI Provider Tokens'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'My OpenAI Token' },
                  token: { type: 'string', example: 'sk-...' },
                },
                required: ['name', 'token'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'AI provider token created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AiProviderTokenCreateResponse',
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'AI provider not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/ai-provider-tokens/{id}': {
      get: {
        summary: 'Get AI provider token by ID',
        description: 'Get a specific AI provider token by ID (User-specific access)',
        tags: ['AI Provider Tokens'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'AI provider token ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AiProviderToken' },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'AI provider token not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update AI provider token',
        description: 'Update an AI provider token (User-specific access, for revoking/activating)',
        tags: ['AI Provider Tokens'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'AI provider token ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'My OpenAI Token' },
                  isActive: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'AI provider token updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AiProviderToken' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'AI provider token not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    // AI Provider Parameters
    '/api/ai-provider-parameters': {
      get: {
        summary: 'List AI provider parameters',
        description: 'Get paginated list of AI provider parameters (Admin only)',
        tags: ['AI Provider Parameters'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page',
            schema: { type: 'integer', default: 10 },
          },
          {
            name: 'sortBy',
            in: 'query',
            description: 'Sort field',
            schema: { type: 'string', default: 'createdAt' },
          },
          {
            name: 'sortOrder',
            in: 'query',
            description: 'Sort order',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search term',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AiProviderParametersPaginatedResponse',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          403: {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create AI provider parameters',
        description: 'Create new AI provider parameters (Admin only)',
        tags: ['AI Provider Parameters'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AiProviderParameters' },
            },
          },
        },
        responses: {
          201: {
            description: 'AI provider parameters created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AiProviderParameters' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          403: {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'AI provider not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/ai-provider-parameters/{id}': {
      get: {
        summary: 'Get AI provider parameters by ID',
        description: 'Get specific AI provider parameters by ID (Admin only)',
        tags: ['AI Provider Parameters'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'AI provider parameters ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AiProviderParameters' },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          403: {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'AI provider parameters not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update AI provider parameters',
        description: 'Update AI provider parameters (Admin only)',
        tags: ['AI Provider Parameters'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'AI provider parameters ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AiProviderParameters' },
            },
          },
        },
        responses: {
          200: {
            description: 'AI provider parameters updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AiProviderParameters' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          403: {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'AI provider parameters not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete AI provider parameters',
        description: 'Delete AI provider parameters (Admin only)',
        tags: ['AI Provider Parameters'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'AI provider parameters ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'AI provider parameters deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'AI provider parameters deleted successfully' },
                    data: { type: 'null', example: null },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          403: {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'AI provider parameters not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    // Users
    '/api/users': {
      get: {
        summary: 'List users',
        description: 'Get paginated list of users (Admin only)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page',
            schema: { type: 'integer', default: 10 },
          },
          {
            name: 'sortBy',
            in: 'query',
            description: 'Sort field',
            schema: { type: 'string', default: 'createdAt' },
          },
          {
            name: 'sortOrder',
            in: 'query',
            description: 'Sort order',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search term',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UserPaginatedResponse',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          403: {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        summary: 'Get user by ID',
        description: 'Get a specific user by ID (Admin only)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          403: {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update user',
        description: 'Update a user (Admin only)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', example: 'newpassword123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          403: {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
  },
}; 