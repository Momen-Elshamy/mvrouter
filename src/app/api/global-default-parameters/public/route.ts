import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createPaginatedResponse, createErrorResponse, createSuccessResponse } from '@/lib/dto/base';
import { withReadTransaction } from '@/lib/database/transaction';
import Connection from '@/Database/Connection';
import GlobalDefaultParameter from '@/Database/Models/GlobalDefaultParameter';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication (any authenticated user)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 'Authentication required', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    await Connection.getInstance().connect();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    
    // Build query
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Filter by active status if specified
    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const result = await withReadTransaction(async (dbSession) => {
      const skip = (page - 1) * limit;
      
      const [parameters, total] = await Promise.all([
        GlobalDefaultParameter.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .session(dbSession)
          .lean(),
        GlobalDefaultParameter.countDocuments(query).session(dbSession),
      ]);

      return { parameters, total };
    });

    const response = createPaginatedResponse(
      result.parameters,
      page,
      limit,
      result.total
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/global-default-parameters/public error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch global default parameters', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
} 