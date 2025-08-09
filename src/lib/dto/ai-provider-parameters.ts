import { z } from 'zod';
import { baseResponseSchema } from './base';
import { createNoDuplicateParametersSchema, createParametersArrayNoDuplicatesSchema } from '@/lib/utils/parameter-validation';

// Parameter field schema
const parameterFieldSchema = z.object({
  type: z.string(),
  required: z.boolean(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
});

// Body structure schema
const bodyStructureSchema = z.object({
  type: z.string().nullable(),
  data: z.record(z.string(), parameterFieldSchema),
});

// Structured parameters schema
const structuredParametersSchema = z.object({
  headers: z.record(z.string(), parameterFieldSchema),
  body: bodyStructureSchema,
  query: z.record(z.string(), parameterFieldSchema),
  parameters: z.record(z.string(), parameterFieldSchema),
});

// AI Provider Parameters schemas (for backward compatibility with individual parameters)
export const aiProviderParametersSchema = z.object({
  provider_endpoint_id: z.string().min(1),
  paramter: z.object({
    name: z.string().min(1).max(100),
    requestType: z.enum(['header', 'body-json', 'body-form', 'body-x-www-form-urlencoded', 'parameter', 'query']),
    dataType: z.enum(['string', 'number', 'boolean', 'json', 'array', 'object', 'any']),
    required: z.boolean(),
    placeholder: z.string().optional(),
    description: z.string().max(500).optional(),
  }),
});

export const aiProviderParametersUpdateSchema = z.object({
  provider_endpoint_id: z.string().min(1).optional(),
  paramter: z.object({
    name: z.string().min(1).max(100).optional(),
    requestType: z.enum(['header', 'body-json', 'body-form', 'body-x-www-form-urlencoded', 'parameter', 'query']).optional(),
    dataType: z.enum(['string', 'number', 'boolean', 'json', 'array', 'object', 'any']).optional(),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
    description: z.string().max(500).optional(),
  }).optional(),
});

// New structured parameters schema
export const aiProviderStructuredParametersSchema = createNoDuplicateParametersSchema(
  z.object({
    provider_endpoint_id: z.string().min(1),
    paramter: structuredParametersSchema,
  })
);

export const aiProviderStructuredParametersUpdateSchema = createNoDuplicateParametersSchema(
  z.object({
    provider_endpoint_id: z.string().min(1).optional(),
    paramter: structuredParametersSchema.optional(),
  })
);

// Custom validation for multiple parameters to ensure only one body type and no duplicates
export const aiProviderParametersArraySchema = createParametersArrayNoDuplicatesSchema(
  z.array(aiProviderParametersSchema).refine(
    (parameters) => {
      const bodyTypes = parameters
        .map(p => p.paramter.requestType)
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

export const aiProviderParametersResponseSchema = z.object({
  _id: z.string(),
  provider_endpoint_id: z.string(),
  paramter: structuredParametersSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const aiProviderParametersListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.array(aiProviderParametersResponseSchema),
});

export const aiProviderParametersPaginatedResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    items: z.array(aiProviderParametersResponseSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
  }),
});

// Types
export type AiProviderParametersCreate = z.infer<typeof aiProviderParametersSchema>;
export type AiProviderParametersUpdate = z.infer<typeof aiProviderParametersUpdateSchema>;
export type AiProviderStructuredParametersCreate = z.infer<typeof aiProviderStructuredParametersSchema>;
export type AiProviderStructuredParametersUpdate = z.infer<typeof aiProviderStructuredParametersUpdateSchema>;
export type AiProviderParametersResponse = z.infer<typeof aiProviderParametersResponseSchema>;
export type AiProviderParametersListResponse = z.infer<typeof aiProviderParametersListResponseSchema>;
export type AiProviderParametersPaginatedResponse = z.infer<typeof aiProviderParametersPaginatedResponseSchema>;

// API Documentation 