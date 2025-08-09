import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  aiProviderTokenUpdateSchema,
  type AiProviderTokenUpdate
} from '@/lib/dto/ai-provider-token';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/dto/base';
import { withWriteTransaction, withReadTransaction } from '@/lib/database/transaction';
import Connection from '@/Database/Connection';
import AiProviderToken from '@/Database/Models/AiProviderToken';
import User from '@/Database/Models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 'Authentication required', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    await Connection.getInstance().connect();

    // Get user with role to check if admin
    const user = await User.findOne({ email: session.user.email })
      .populate('role', 'name description')
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json(
        createErrorResponse('User not found', 'User not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Get AI provider token by ID
    const token = await withReadTransaction(async (dbSession) => {
      // If admin, allow access to any token, otherwise restrict to user's own tokens
      const query = (user as any).role?.name === 'admin' 
        ? { _id: id }
        : { _id: id, userId: (session.user as any).id };
      
      return await AiProviderToken.findOne(query)
        .session(dbSession)
        .lean();
    });

    if (!token) {
      return NextResponse.json(
        createErrorResponse('AI provider token not found', 'AI provider token not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const response = createSuccessResponse(token, 'AI provider token retrieved successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/ai-provider-tokens/[id] error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch AI provider token', error instanceof Error ? error.message : 'Unknown error'),
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
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 'Authentication required', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    await Connection.getInstance().connect();

    // Get user with role to check if admin
    const user = await User.findOne({ email: session.user.email })
      .populate('role', 'name description')
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json(
        createErrorResponse('User not found', 'User not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = aiProviderTokenUpdateSchema.parse(body);

    // Update AI provider token with transaction
    const token = await withWriteTransaction(async (dbSession) => {
      // If admin, allow updating any token, otherwise restrict to user's own tokens
      const query = (user as any).role?.name === 'admin'
        ? { _id: id }
        : { _id: id, userId: (session.user as any).id };

      const updatedToken = await AiProviderToken.findOneAndUpdate(
        query,
        { $set: validatedData },
        { new: true, runValidators: true, session: dbSession }
      )

      if (!updatedToken) {
        throw new Error('AI provider token not found');
      }

      return updatedToken;
    });

    const response = createSuccessResponse(token, 'AI provider token updated successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('PUT /api/ai-provider-tokens/[id] error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('Validation error', error.issues.map(e => e.message).join(', '), 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'AI provider token not found') {
      return NextResponse.json(
        createErrorResponse('AI provider token not found', 'AI provider token not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Failed to update AI provider token', error instanceof Error ? error.message : 'Unknown error'),
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
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 'Authentication required', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    await Connection.getInstance().connect();

    // Get user with role to check if admin
    const user = await User.findOne({ email: session.user.email })
      .populate('role', 'name description')
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json(
        createErrorResponse('User not found', 'User not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Revoke AI provider token with transaction (set isActive to false)
    const result = await withWriteTransaction(async (dbSession) => {
      try {
        // If admin, allow revoking any token, otherwise restrict to user's own tokens
        const query = (user as any).role?.name === 'admin'
          ? { _id: id }
          : { _id: id, userId: (session.user as any).id };

        const updatedToken = await AiProviderToken.findOneAndUpdate(
          query,
          { $set: { isActive: false } },
          { new: true, runValidators: true, session: dbSession }
        );

        if (!updatedToken) {
          throw new Error('AI provider token not found');
        }

        return updatedToken;
      } catch (dbError) {
        console.error('Database error in DELETE:', dbError);
        throw dbError;
      }
    });

    const response = createSuccessResponse(result, 'AI provider token revoked successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('DELETE /api/ai-provider-tokens/[id] error:', error);
    
    if (error instanceof Error && error.message === 'AI provider token not found') {
      return NextResponse.json(
        createErrorResponse('AI provider token not found', 'AI provider token not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Failed to revoke AI provider token', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
} 