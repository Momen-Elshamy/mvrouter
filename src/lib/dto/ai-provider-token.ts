import { z } from 'zod';
import { baseResponseSchema } from './base';

// AI Provider Token schemas
export const aiProviderTokenSchema = z.object({
  name: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
});

export const aiProviderTokenUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const aiProviderTokenResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const aiProviderTokenCreateResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  token: z.string(), // Only shown once during creation
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const aiProviderTokenListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.array(aiProviderTokenResponseSchema),
});

export const aiProviderTokenPaginatedResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    items: z.array(aiProviderTokenResponseSchema),
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
export type AiProviderTokenCreate = z.infer<typeof aiProviderTokenSchema>;
export type AiProviderTokenUpdate = z.infer<typeof aiProviderTokenUpdateSchema>;
export type AiProviderTokenResponse = z.infer<typeof aiProviderTokenResponseSchema>;
export type AiProviderTokenCreateResponse = z.infer<typeof aiProviderTokenCreateResponseSchema>;
export type AiProviderTokenListResponse = z.infer<typeof aiProviderTokenListResponseSchema>;
export type AiProviderTokenPaginatedResponse = z.infer<typeof aiProviderTokenPaginatedResponseSchema>;

// API Documentation 