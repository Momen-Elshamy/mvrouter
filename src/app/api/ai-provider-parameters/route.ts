import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createPaginatedResponse, createErrorResponse } from '@/lib/dto/base';
import { withReadTransaction } from '@/lib/database/transaction';
import Connection from '@/Database/Connection';
import AiProviderParameters from '@/Database/Models/AiProviderModelParameters';
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

    await Connection.getInstance().connect();

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
        { 'provider.name': { $regex: search, $options: 'i' } },
        { 'model.name': { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const result = await withReadTransaction(async (dbSession) => {
      const skip = (page - 1) * limit;
      
      const [parameters, total] = await Promise.all([
        AiProviderParameters.find(query)
          .populate({
            path: 'provider_endpoint_id',
            select: 'name description ai_provider_id',
            populate: {
              path: 'ai_provider_id',
              select: 'name provider description'
            }
          })
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .session(dbSession)
          .lean(),
        AiProviderParameters.countDocuments(query).session(dbSession),
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
    console.error('GET /api/ai-provider-parameters error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch AI provider parameters', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
}

 