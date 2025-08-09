import { z } from 'zod';

// Base pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

// Base response schemas
export const baseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  baseResponseSchema.extend({
    data: z.object({
      items: z.array(dataSchema),
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

// Error response schema
export const errorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  error: z.string(),
  code: z.string().optional(),
});

// Success response schema
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: dataSchema,
  });

// Types
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type BaseResponse = z.infer<typeof baseResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type PaginatedResponse<T> = {
  success: true;
  message: string;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
};

// Helper functions
export const createPaginatedResponse = <T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    message: 'Data retrieved successfully',
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  };
};

export const createSuccessResponse = <T>(data: T, message: string = 'Success') => ({
  success: true as const,
  message,
  data,
});

export const createErrorResponse = (message: string, error?: string, code?: string): ErrorResponse => ({
  success: false,
  message,
  error: error || message,
  code,
}); 