import { z } from 'zod';
import { baseResponseSchema } from './base';

// AI Provider schemas (new structure)
export const aiProviderSchema = z.object({
  name: z.string().min(1).max(100),
  provider: z.string().min(1).max(100), // e.g., "OpenAI", "Anthropic", "Google"
  description: z.string().min(1).max(500),
  isActive: z.boolean().default(true),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});

export const aiProviderUpdateSchema = aiProviderSchema.partial();

export const aiProviderResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  provider: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  slug: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const aiProviderListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.array(aiProviderResponseSchema),
});

export const aiProviderPaginatedResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    items: z.array(aiProviderResponseSchema),
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
export type AiProviderCreate = z.infer<typeof aiProviderSchema>;
export type AiProviderUpdate = z.infer<typeof aiProviderUpdateSchema>;
export type AiProviderResponse = z.infer<typeof aiProviderResponseSchema>;
export type AiProviderListResponse = z.infer<typeof aiProviderListResponseSchema>;
export type AiProviderPaginatedResponse = z.infer<typeof aiProviderPaginatedResponseSchema>;

// API Documentation 