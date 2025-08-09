import { z } from 'zod';
import { baseResponseSchema } from './base';

// Adapter field schema
const adapterFieldSchema = z.object({
  matchFromProvider: z.string().min(1),
  defaultValue: z.any().optional(),
});

// Body adapter structure schema
const bodyAdapterStructureSchema = z.object({
  type: z.string().nullable(),
  data: z.record(z.string(), adapterFieldSchema),
});

// Structured adapter schema
const structuredAdapterSchema = z.object({
  headers: z.record(z.string(), adapterFieldSchema),
  body: bodyAdapterStructureSchema,
  query: z.record(z.string(), adapterFieldSchema),
  parameters: z.record(z.string(), adapterFieldSchema),
});

// Provider Parameter Adapter schemas
export const providerParameterAdapterSchema = z.object({
  name: z.string().min(1).max(100),
  ai_provider_id: z.string().min(1),
  global_default_parameter_id: z.string().min(1),
  description: z.string().min(1).max(500),
  isActive: z.boolean().default(true),
  adapter: structuredAdapterSchema,
});

export const providerParameterAdapterUpdateSchema = providerParameterAdapterSchema.partial();

export const providerParameterAdapterResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  ai_provider_id: z.string(),
  global_default_parameter_id: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  adapter: structuredAdapterSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const providerParameterAdapterListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.array(providerParameterAdapterResponseSchema),
});

export const providerParameterAdapterPaginatedResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    items: z.array(providerParameterAdapterResponseSchema),
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
export type ProviderParameterAdapterCreate = z.infer<typeof providerParameterAdapterSchema>;
export type ProviderParameterAdapterUpdate = z.infer<typeof providerParameterAdapterUpdateSchema>;
export type ProviderParameterAdapterResponse = z.infer<typeof providerParameterAdapterResponseSchema>;
export type ProviderParameterAdapterListResponse = z.infer<typeof providerParameterAdapterListResponseSchema>;
export type ProviderParameterAdapterPaginatedResponse = z.infer<typeof providerParameterAdapterPaginatedResponseSchema>; 