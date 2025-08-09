import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { 
  userUpdateSchema,
  type UserUpdate
} from '@/lib/dto/user';
import { requireAdmin } from '@/lib/middleware/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/dto/base';
import { withWriteTransaction, withReadTransaction } from '@/lib/database/transaction';
import Connection from '@/Database/Connection';
import User from '@/Database/Models/User';

// API endpoint for user management
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

    // Get user by ID
    const userData = await withReadTransaction(async (session) => {
      return await User.findById(id)
        .populate('role', 'name description')
        .select('-password') // Exclude password from response
        .session(session)
        .lean();
    });

    if (!userData) {
      return NextResponse.json(
        createErrorResponse('User not found', 'User not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const response = createSuccessResponse(userData, 'User retrieved successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch user', error instanceof Error ? error.message : 'Unknown error'),
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
    const validatedData = userUpdateSchema.parse(body);

    // Update user with transaction
    const updatedUser = await withWriteTransaction(async (session) => {
      // If password is being updated, hash it
      if (validatedData.password) {
        validatedData.password = await bcrypt.hash(validatedData.password, 12);
      }

      const user = await User.findByIdAndUpdate(
        id,
        { $set: validatedData },
        { new: true, runValidators: true, session }
      )
      .populate('role', 'name description')
      .select('-password'); // Exclude password from response

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    });

    const response = createSuccessResponse(updatedUser, 'User updated successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('PUT /api/users/[id] error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('Validation error', error.issues.map((e) => e.message).join(', '), 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json(
        createErrorResponse('User not found', 'User not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Failed to update user', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
} 