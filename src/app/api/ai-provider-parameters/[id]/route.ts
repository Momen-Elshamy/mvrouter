import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  aiProviderStructuredParametersUpdateSchema,
  type AiProviderStructuredParametersUpdate
} from '@/lib/dto/ai-provider-parameters';
import { requireAdmin } from '@/lib/middleware/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/dto/base';
import { withWriteTransaction, withReadTransaction } from '@/lib/database/transaction';
import { handleZodError, handleNotFoundError } from '@/lib/utils/error-handler';
import Connection from '@/Database/Connection';
import AiProviderParameters from '@/Database/Models/AiProviderModelParameters';
import AiProviderModels from '@/Database/Models/AiProviderModels';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Check authentication (admin only)
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    await Connection.getInstance().connect();

    // Get AI provider parameters by ID
    const parameters = await withReadTransaction(async (session) => {
      return await AiProviderParameters.findById(id)
        .session(session)
        .lean();
    });

    if (!parameters) {
      return NextResponse.json(
        createErrorResponse('AI provider parameters not found', 'AI provider parameters not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const response = createSuccessResponse(parameters, 'AI provider parameters retrieved successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/ai-provider-parameters/[id] error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch AI provider parameters', error instanceof Error ? error.message : 'Unknown error'),
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
    const validatedData = aiProviderStructuredParametersUpdateSchema.parse(body);

    // Update AI provider parameters with transaction
    const parameters = await withWriteTransaction(async (session) => {
      const updatedParameters = await AiProviderParameters.findByIdAndUpdate(
        id,
        { $set: validatedData },
        { new: true, runValidators: true, session }
      );

      if (!updatedParameters) {
        throw new Error('AI provider parameters not found');
      }

      return updatedParameters;
    });

    const response = createSuccessResponse(parameters, 'AI provider parameters updated successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('PUT /api/ai-provider-parameters/[id] error:', error);
    
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }

    if (error instanceof Error && error.message === 'AI provider parameters not found') {
      return handleNotFoundError(error, 'AI provider parameters');
    }

    return NextResponse.json(
      createErrorResponse('Failed to update AI provider parameters', error instanceof Error ? error.message : 'Unknown error'),
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

    // Delete AI provider parameters with transaction
    await withWriteTransaction(async (session) => {
      const deletedParameters = await AiProviderParameters.findByIdAndDelete(id).session(session);
      
      if (!deletedParameters) {
        throw new Error('AI provider parameters not found');
      }

      return deletedParameters;
    });

    const response = createSuccessResponse(null, 'AI provider parameters deleted successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('DELETE /api/ai-provider-parameters/[id] error:', error);
    
    if (error instanceof Error && error.message === 'AI provider parameters not found') {
      return NextResponse.json(
        createErrorResponse('AI provider parameters not found', 'AI provider parameters not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Failed to delete AI provider parameters', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
} 