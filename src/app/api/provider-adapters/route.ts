import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ProviderAdapter from '@/Database/Models/ProviderAdapter';
import ProviderEndpoint from '@/Database/Models/ProviderEndpoint';
import { CreateProviderAdapterDto } from '@/lib/dto/provider-adapter';
import Connection from '@/Database/Connection';

// GET /api/provider-adapters - List all adapters (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    await Connection.getInstance().connect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get all adapters with populated references (admin can see all)
    const adapters = await ProviderAdapter.find({ 
      isActive: true 
    })
    .populate('defaultParameterId', 'name parameters')
    .populate('providerEndpointId', 'name parameters')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await ProviderAdapter.countDocuments({ 
      isActive: true 
    });

    const formattedAdapters = adapters.map(adapter => ({
      _id: (adapter._id as any).toString(),
      name: adapter.name,
      description: adapter.description,
      userId: (adapter.userId as any).toString(),
      defaultParameterId: (adapter.defaultParameterId as any).toString(),
      providerEndpointId: (adapter.providerEndpointId as any).toString(),
      mappings: adapter.mappings,
      isActive: adapter.isActive,
      createdAt: adapter.createdAt.toISOString(),
      updatedAt: adapter.updatedAt.toISOString(),
      defaultParameter: adapter.defaultParameterId,
      providerEndpoint: adapter.providerEndpointId
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: formattedAdapters,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching adapters:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/provider-adapters - Create new adapter (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body: CreateProviderAdapterDto = await request.json();

    // Validate required fields
    if (!body.name || !body.defaultParameterId || !body.providerEndpointId) {
      return NextResponse.json(
        { success: false, message: 'Name, default parameter, and provider endpoint are required' },
        { status: 400 }
      );
    }

    await Connection.getInstance().connect();

    // Check if adapter with same name already exists
    const existingAdapter = await ProviderAdapter.findOne({
      name: body.name,
      isActive: true
    });

    if (existingAdapter) {
      return NextResponse.json(
        { success: false, message: 'An adapter with this name already exists' },
        { status: 409 }
      );
    }

    // Validate that all required fields are mapped
    const providerEndpoint = await ProviderEndpoint.findById(body.providerEndpointId);
    if (!providerEndpoint) {
      return NextResponse.json(
        { success: false, message: 'Provider endpoint not found' },
        { status: 404 }
      );
    }

    // Get all required fields from provider endpoint
    const getRequiredFields = (params: any) => {
      const requiredFields: string[] = [];
      
      if (params.body?.data) {
        Object.entries(params.body.data).forEach(([key, value]: [string, any]) => {
          if (value.required) {
            requiredFields.push(`body.data.${key}`);
          }
        });
      }
      
      if (params.headers) {
        Object.entries(params.headers).forEach(([key, value]: [string, any]) => {
          if (value.required) {
            requiredFields.push(`headers.${key}`);
          }
        });
      }
      
      if (params.parameters) {
        Object.entries(params.parameters).forEach(([key, value]: [string, any]) => {
          if (value.required) {
            requiredFields.push(`parameters.${key}`);
          }
        });
      }
      
      if (params.query) {
        Object.entries(params.query).forEach(([key, value]: [string, any]) => {
          if (value.required) {
            requiredFields.push(`query.${key}`);
          }
        });
      }
      
      return requiredFields;
    };

    const requiredFields = getRequiredFields(providerEndpoint.parameters || {});
    const mappedFields = body.mappings?.map(m => m.toField) || [];
    const unmappedRequiredFields = requiredFields.filter(field => !mappedFields.includes(field));

    if (unmappedRequiredFields.length > 0) {
      const fieldNames = unmappedRequiredFields.map(field => field.split('.').pop()).join(', ');
      return NextResponse.json(
        { success: false, message: `All required fields must be mapped. Missing mappings for: ${fieldNames}` },
        { status: 400 }
      );
    }

    // Create new adapter
    const adapter = new ProviderAdapter({
      name: body.name,
      description: body.description,
      userId: session.user.id, // Admin creating the adapter
      defaultParameterId: body.defaultParameterId,
      providerEndpointId: body.providerEndpointId,
      mappings: body.mappings || [],
      isActive: true
    });

    await adapter.save();

    // Populate references for response
    await adapter.populate('defaultParameterId', 'name parameters');
    await adapter.populate('providerEndpointId', 'name parameters');

    const response = {
      _id: (adapter._id as any).toString(),
      name: adapter.name,
      description: adapter.description,
      userId: (adapter.userId as any).toString(),
      defaultParameterId: (adapter.defaultParameterId as any).toString(),
      providerEndpointId: (adapter.providerEndpointId as any).toString(),
      mappings: adapter.mappings,
      isActive: adapter.isActive,
      createdAt: adapter.createdAt.toISOString(),
      updatedAt: adapter.updatedAt.toISOString(),
      defaultParameter: adapter.defaultParameterId,
      providerEndpoint: adapter.providerEndpointId
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Adapter created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating adapter:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 