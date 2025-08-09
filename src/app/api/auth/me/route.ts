import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createSuccessResponse, createErrorResponse } from '@/lib/dto/base';
import Connection from '@/Database/Connection';
import User from '@/Database/Models/User';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        createErrorResponse('Unauthorized', 'Not authenticated', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    await Connection.getInstance().connect();

    // Get user with role populated
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

    const response = createSuccessResponse(user, 'User retrieved successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/auth/me error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch user', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
} 