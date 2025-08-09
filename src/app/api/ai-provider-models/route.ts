import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createPaginatedResponse, createErrorResponse } from '@/lib/dto/base';
import { withReadTransaction, withWriteTransaction } from '@/lib/database/transaction';
import Connection from '@/Database/Connection';
import AiProviderModels from '@/Database/Models/AiProviderModels';
import { authOptions } from '@/lib/auth';
import { aiProviderModelsSchema } from '@/lib/dto/ai-provider-models';

// API endpoint for AI provider models
export async function GET(request: NextRequest) {
  try {
    // Check authentication (users and admins can view)
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

    // Build query
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get total count
    const total = await withReadTransaction(async (dbSession) => {
      return await AiProviderModels.countDocuments(query).session(dbSession);
    });

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Get models with pagination
    const models = await withReadTransaction(async (dbSession) => {
      return await AiProviderModels.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .session(dbSession)
        .lean();
    });

    const response = createPaginatedResponse(
      models,
      page,
      limit,
      total
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/ai-provider-models error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch AI provider models', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
}

// Create new AI provider model
export async function POST(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 'Authentication required', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    await Connection.getInstance().connect();

    const body = await request.json();
    
    // Validate input data
    const validatedData = aiProviderModelsSchema.parse(body);

    // Check if model with same name already exists
    const existingModel = await withReadTransaction(async (dbSession) => {
      return await AiProviderModels.findOne({ 
        name: validatedData.name,
        ai_provider_id: validatedData.ai_provider_id 
      }).session(dbSession);
    });

    if (existingModel) {
      return NextResponse.json(
        createErrorResponse('Model already exists', 'A model with this name already exists for this provider', 'CONFLICT'),
        { status: 409 }
      );
    }

    // Create the model
    const result = await withWriteTransaction(async (dbSession) => {
      const model = new AiProviderModels({
        ...validatedData,
        slug: validatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        isActive: validatedData.isActive,
      });
      return await model.save({ session: dbSession });
    });

    return NextResponse.json({
      success: true,
      message: 'AI provider model created successfully',
      data: result
    });
  } catch (error) {
    console.error('POST /api/ai-provider-models error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to create AI provider model', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
}