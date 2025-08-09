import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import AiProvider from '@/Database/Models/AiProvider';
import AiProviderModels from '@/Database/Models/AiProviderModels';
import ProviderEndpoint from '@/Database/Models/ProviderEndpoint';
import { aiProviderSchema } from '@/lib/dto/ai-provider';
import { withWriteTransaction } from '@/lib/database/transaction';
import Connection from '@/Database/Connection';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/ai-providers - Starting request');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user);
    
    if (!session?.user?.role) {
      console.log('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    console.log('Connecting to database...');
    await Connection.getInstance().connect();
    console.log('Database connected successfully');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { provider: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    console.log('Query:', query);
    
    // Get total count
    const total = await AiProvider.countDocuments(query);
    console.log('Total providers:', total);

    // Get providers with pagination
    const providers = await AiProvider.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    console.log('Found providers:', providers.length);

    // Get models and endpoints for each provider
    const providersWithData = await Promise.all(
      providers.map(async (provider) => {
        // Get models for this provider
        const models = await AiProviderModels.find({ 
          ai_provider_id: (provider as any)._id.toString(),
          isActive: true 
        }).select('name slug description').lean();

        // Get endpoints for this provider
        const endpoints = await ProviderEndpoint.find({ 
          ai_provider_id: (provider as any)._id.toString(),
          isActive: true 
        }).select('name slug description').lean();

        return {
          ...provider,
          models: models || [],
          endpoints: endpoints || []
        };
      })
    );

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      success: true,
      message: 'AI providers retrieved successfully',
      data: {
        items: providersWithData,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching AI providers:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('buffering timed out')) {
      return NextResponse.json(
        { error: 'Database connection timeout. Please try again.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    console.log('Connecting to database for POST...');
    await Connection.getInstance().connect();
    console.log('Database connected successfully for POST');

    const body = await request.json();

    // Validate input
    const validatedData = aiProviderSchema.parse(body);

    // Check if provider with same name already exists
    const existingProvider = await AiProvider.findOne({
      name: validatedData.name,
    });

    if (existingProvider) {
      return NextResponse.json(
        { error: 'AI provider with this name already exists' },
        { status: 400 }
      );
    }

    // Create provider
    const provider = await withWriteTransaction(async () => {
      return await AiProvider.create(validatedData);
    });

    return NextResponse.json({
      success: true,
      message: 'AI provider created successfully',
      data: provider,
    });
  } catch (error: any) {
    console.error('Error creating AI provider:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('buffering timed out')) {
      return NextResponse.json(
        { error: 'Database connection timeout. Please try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 