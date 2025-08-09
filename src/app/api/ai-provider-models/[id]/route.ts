import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  aiProviderModelsUpdateSchema,
  type AiProviderModelsUpdate
} from '@/lib/dto/ai-provider-models';
import { requireAdmin, requireUser } from '@/lib/middleware/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/dto/base';
import { withWriteTransaction, withReadTransaction } from '@/lib/database/transaction';
import { handleZodError, handleNotFoundError } from '@/lib/utils/error-handler';
import Connection from '@/Database/Connection';
import AiProviderModels from '@/Database/Models/AiProviderModels';

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

    // Get AI provider model by ID
    const model = await withReadTransaction(async (session) => {
      return await AiProviderModels.findById(id)
        .session(session)
        .lean();
    });

    if (!model) {
      return NextResponse.json(
        createErrorResponse('AI provider model not found', 'AI provider model not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const response = createSuccessResponse(model, 'AI provider model retrieved successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/ai-provider-models/[id] error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch AI provider model', error instanceof Error ? error.message : 'Unknown error'),
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
    const validatedData = aiProviderModelsUpdateSchema.parse(body);

    // Update AI provider model
    const updatedModel = await withWriteTransaction(async (session) => {
      return await AiProviderModels.findByIdAndUpdate(
        id,
        validatedData,
        { new: true, runValidators: true }
      )
        .session(session)
        .lean();
    });

    if (!updatedModel) {
      return NextResponse.json(
        createErrorResponse('AI provider model not found', 'AI provider model not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const response = createSuccessResponse(updatedModel, 'AI provider model updated successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('PUT /api/ai-provider-models/[id] error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('Validation error', 'Invalid request data', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Failed to update AI provider model', error instanceof Error ? error.message : 'Unknown error'),
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

    // Delete AI provider model
    const deletedModel = await withWriteTransaction(async (session) => {
      return await AiProviderModels.findByIdAndDelete(id).session(session).lean();
    });

    if (!deletedModel) {
      return NextResponse.json(
        createErrorResponse('AI provider model not found', 'AI provider model not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const response = createSuccessResponse(null, 'AI provider model deleted successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('DELETE /api/ai-provider-models/[id] error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to delete AI provider model', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
} 