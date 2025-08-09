import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { 
  type UserPaginatedResponse
} from '@/lib/dto/user';
import { createPaginatedResponse, createErrorResponse } from '@/lib/dto/base';
import { withReadTransaction } from '@/lib/database/transaction';
import Connection from '@/Database/Connection';
import User from '@/Database/Models/User';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 'Authentication required', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    
    // Check if user is admin from session
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json(
        createErrorResponse('Admin access required', 'Admin access required', 'FORBIDDEN'),
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';

    // Build query
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const result = await withReadTransaction(async (session) => {
      const skip = (page - 1) * limit;
      
      const [users, total] = await Promise.all([
        User.find(query)
          .populate('role', 'name description')
          .select('-password') // Exclude password from response
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .session(session)
          .lean(),
        User.countDocuments(query).session(session),
      ]);

      return { users, total };
    });

    const response = createPaginatedResponse(
      result.users,
      page,
      limit,
      result.total
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch users', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
} 