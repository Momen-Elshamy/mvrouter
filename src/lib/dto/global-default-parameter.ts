import { z } from 'zod';
import { baseResponseSchema } from './base';

// Parameter field schema
const parameterFieldSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'json', 'array', 'object', 'any']),
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

// Global Default Parameter schemas
export const globalDefaultParameterSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  isActive: z.boolean().default(true),
  parameters: structuredParametersSchema,
});

export const globalDefaultParameterUpdateSchema = globalDefaultParameterSchema.partial();

export const globalDefaultParameterResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  parameters: structuredParametersSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const globalDefaultParameterListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.array(globalDefaultParameterResponseSchema),
});

export const globalDefaultParameterPaginatedResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    items: z.array(globalDefaultParameterResponseSchema),
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
export type GlobalDefaultParameterCreate = z.infer<typeof globalDefaultParameterSchema>;
export type GlobalDefaultParameterUpdate = z.infer<typeof globalDefaultParameterUpdateSchema>;
export type GlobalDefaultParameterResponse = z.infer<typeof globalDefaultParameterResponseSchema>;
export type GlobalDefaultParameterListResponse = z.infer<typeof globalDefaultParameterListResponseSchema>;
export type GlobalDefaultParameterPaginatedResponse = z.infer<typeof globalDefaultParameterPaginatedResponseSchema>; 