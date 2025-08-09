import { z } from 'zod';
import { baseResponseSchema } from './base';

// Provider Endpoint schemas (renamed from AiProvider)
export const providerEndpointSchema = z.object({
  name: z.string().min(1).max(100),
  path_to_api: z.string().min(1),
  icon: z.string().min(1).max(50),
  slug: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  isActive: z.boolean().default(true),
  ai_provider_id: z.string().min(1), // References AiProvider
});

export const providerEndpointUpdateSchema = providerEndpointSchema.partial();

export const providerEndpointResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  path_to_api: z.string(),
  icon: z.string(),
  slug: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const providerEndpointListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.array(providerEndpointResponseSchema),
});

export const providerEndpointPaginatedResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    items: z.array(providerEndpointResponseSchema),
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
export type ProviderEndpointCreate = z.infer<typeof providerEndpointSchema>;
export type ProviderEndpointUpdate = z.infer<typeof providerEndpointUpdateSchema>;
export type ProviderEndpointResponse = z.infer<typeof providerEndpointResponseSchema>;
export type ProviderEndpointListResponse = z.infer<typeof providerEndpointListResponseSchema>;
export type ProviderEndpointPaginatedResponse = z.infer<typeof providerEndpointPaginatedResponseSchema>; 