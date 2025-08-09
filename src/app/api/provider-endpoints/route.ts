import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ProviderEndpoint from '@/Database/Models/ProviderEndpoint';
import AiProviderParameter from '@/Database/Models/AiProviderModelParameters';
import { providerEndpointSchema } from '@/lib/dto/provider-endpoint';
import { withWriteTransaction } from '@/lib/database/transaction';
import { validateUrlParameters } from '@/lib/utils/url-parameter-detector';
import { validateAllDuplicateParameters } from '@/lib/utils/parameter-validation';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        { path_to_api: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await ProviderEndpoint.countDocuments(query);

    // Get endpoints with pagination
    const endpoints = await ProviderEndpoint.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      success: true,
      message: 'Provider endpoints retrieved successfully',
      data: {
        items: endpoints,
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
    console.error('Error fetching provider endpoints:', error);
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

    const body = await request.json();

    // Extract parameters from the request body
    const { paramter, ...endpointData } = body;

    
    // Validate endpoint data
    const validatedData = providerEndpointSchema.parse(endpointData);

    // Validate URL parameters for uniqueness
    const urlValidation = validateUrlParameters(validatedData.path_to_api);
    if (!urlValidation.isValid) {
      return NextResponse.json(
        { error: `URL parameter validation failed: ${urlValidation.errors.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate parameters for duplicates if provided
    if (paramter) {
      const paramValidation = validateAllDuplicateParameters(paramter);
      if (!paramValidation.isValid) {
        return NextResponse.json(
          { error: `Parameter validation failed: ${paramValidation.errors.join(', ')}` },
          { status: 400 }
        );
      }

      // Additional validation: Check for cross-type duplicates
      const allParamNames: string[] = [];
      
      // Collect all parameter names
      Object.keys(paramter.headers || {}).forEach(name => allParamNames.push(name));
      Object.keys(paramter.body?.data || {}).forEach(name => allParamNames.push(name));
      Object.keys(paramter.query || {}).forEach(name => allParamNames.push(name));
      Object.keys(paramter.parameters || {}).forEach(name => allParamNames.push(name));

      // Find duplicates
      const seen = new Set<string>();
      const duplicates: string[] = [];
      allParamNames.forEach(name => {
        if (seen.has(name)) {
          if (!duplicates.includes(name)) {
            duplicates.push(name);
          }
        } else {
          seen.add(name);
        }
      });

      if (duplicates.length > 0) {
        return NextResponse.json(
          { error: `Duplicate parameter names found: ${duplicates.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Check if endpoint with same slug already exists
    const existingEndpoint = await ProviderEndpoint.findOne({
      slug: validatedData.slug,
    });

    if (existingEndpoint) {
      return NextResponse.json(
        { error: 'Provider endpoint with this slug already exists' },
        { status: 400 }
      );
    }

    // Create endpoint and parameters in transaction
    const result = await withWriteTransaction(async (session) => {
      // 1. Create the provider endpoint
      const endpoint = await ProviderEndpoint.create(validatedData);

      // 2. Create parameters if provided
      if (paramter) {
        const parameters = new AiProviderParameter({
          provider_endpoint_id: endpoint._id, // Use endpoint ID as provider endpoint ID
          paramter: paramter,
        });
        await parameters.save({ session });
      }

      return endpoint;
    });

    return NextResponse.json({
      success: true,
      message: 'Provider endpoint created successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creating provider endpoint:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 