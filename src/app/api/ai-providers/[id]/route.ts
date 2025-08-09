import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  aiProviderUpdateSchema,
  type AiProviderUpdate
} from '@/lib/dto/ai-provider';
import { requireAdmin, requireUser } from '@/lib/middleware/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/dto/base';
import { withWriteTransaction, withReadTransaction } from '@/lib/database/transaction';
import { handleZodError, handleNotFoundError } from '@/lib/utils/error-handler';
import Connection from '@/Database/Connection';
import AiProvider from '@/Database/Models/AiProvider';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Check authentication (admin or user)
    const user = await requireUser(request);
    if (user instanceof NextResponse) return user;

    await Connection.getInstance().connect();

    // Get AI provider by ID
    const provider = await withReadTransaction(async (session) => {
      return await AiProvider.findById(id).session(session).lean();
    });

    if (!provider) {
      return NextResponse.json(
        createErrorResponse('AI provider not found', 'AI provider not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const response = createSuccessResponse(provider, 'AI provider retrieved successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/ai-providers/[id] error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch AI provider', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Check authentication (admin only)
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    await Connection.getInstance().connect();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = aiProviderUpdateSchema.parse(body);

    // Update AI provider with transaction
    const provider = await withWriteTransaction(async (session) => {
      const updatedProvider = await AiProvider.findByIdAndUpdate(
        id,
        { $set: validatedData },
        { new: true, runValidators: true, session }
      );

      if (!updatedProvider) {
        throw new Error('AI provider not found');
      }

      return updatedProvider;
    });

    const response = createSuccessResponse(provider, 'AI provider updated successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('PUT /api/ai-providers/[id] error:', error);
    
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }

    if (error instanceof Error && error.message === 'AI provider not found') {
      return handleNotFoundError(error, 'AI provider');
    }

    return NextResponse.json(
      createErrorResponse('Failed to update AI provider', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Check authentication (admin only)
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    await Connection.getInstance().connect();

    // Delete AI provider with transaction
    await withWriteTransaction(async (session) => {
      const deletedProvider = await AiProvider.findByIdAndDelete(id).session(session);
      
      if (!deletedProvider) {
        throw new Error('AI provider not found');
      }

      return deletedProvider;
    });

    const response = createSuccessResponse(null, 'AI provider deleted successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('DELETE /api/ai-providers/[id] error:', error);
    
    if (error instanceof Error && error.message === 'AI provider not found') {
      return NextResponse.json(
        createErrorResponse('AI provider not found', 'AI provider not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Failed to delete AI provider', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
} 