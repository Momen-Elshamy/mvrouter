import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/dto/base';

export function handleZodError(error: unknown): NextResponse {
  if (error instanceof z.ZodError) {
    const errorMessages = error.issues.map((issue) => issue.message).join(', ');
    return NextResponse.json(
      createErrorResponse('Validation error', errorMessages, 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }
  
  // Handle other types of errors
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json(
    createErrorResponse('Internal server error', errorMessage, 'INTERNAL_ERROR'),
    { status: 500 }
  );
}

export function handleNotFoundError(error: Error, resourceName: string): NextResponse {
  if (error.message.includes('not found') || error.message.includes('Not found')) {
    return NextResponse.json(
      createErrorResponse(`${resourceName} not found`, `${resourceName} not found`, 'NOT_FOUND'),
      { status: 404 }
    );
  }
  
  return NextResponse.json(
    createErrorResponse('Internal server error', error.message, 'INTERNAL_ERROR'),
    { status: 500 }
  );
} 