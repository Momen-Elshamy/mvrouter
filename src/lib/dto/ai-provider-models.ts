import { z } from 'zod';
import { baseResponseSchema } from './base';

// AI Provider Models schemas
export const aiProviderModelsSchema = z.object({
  name: z.string().min(1),
  model_id: z.string().min(1),
  description: z.string().min(1).max(500),
  ai_provider_id: z.string().min(1),
  slug: z.string().min(1).optional(),
  isActive: z.boolean().default(true),
});

export const aiProviderModelsUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).max(500).optional(),
  isActive: z.boolean().optional(),
});

export const aiProviderModelsResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string(),
  ai_provider_id: z.string(),
  isActive: z.boolean(),
  provider: z.object({
    _id: z.string(),
    name: z.string(),
    path_to_api: z.string(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const aiProviderModelsListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.array(aiProviderModelsResponseSchema),
});

export const aiProviderModelsPaginatedResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    items: z.array(aiProviderModelsResponseSchema),
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
export type AiProviderModelsCreate = z.infer<typeof aiProviderModelsSchema>;
export type AiProviderModelsUpdate = z.infer<typeof aiProviderModelsUpdateSchema>;
export type AiProviderModelsResponse = z.infer<typeof aiProviderModelsResponseSchema>;
export type AiProviderModelsListResponse = z.infer<typeof aiProviderModelsListResponseSchema>;
export type AiProviderModelsPaginatedResponse = z.infer<typeof aiProviderModelsPaginatedResponseSchema>; 