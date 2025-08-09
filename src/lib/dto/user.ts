import { z } from 'zod';
import { baseResponseSchema } from './base';

// User schemas
export const userCreateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export const userResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.object({
    _id: z.string(),
    name: z.string(),
    description: z.string().optional(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const userListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.array(userResponseSchema),
});

export const userPaginatedResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    items: z.array(userResponseSchema),
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
export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type UserListResponse = z.infer<typeof userListResponseSchema>;
export type UserPaginatedResponse = z.infer<typeof userPaginatedResponseSchema>;

// API Documentation 