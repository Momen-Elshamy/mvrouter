import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ProviderAdapter from '@/Database/Models/ProviderAdapter';
import GlobalDefaultParameter from '@/Database/Models/GlobalDefaultParameter';
import ProviderEndpoint from '@/Database/Models/ProviderEndpoint';
import { UpdateProviderAdapterDto } from '@/lib/dto/provider-adapter';
import Connection from '@/Database/Connection';

// GET /api/provider-adapters/[id] - Get specific adapter (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.role ) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    await Connection.getInstance().connect();

    const adapter = await ProviderAdapter.findOne({
      _id: id,
      isActive: true
    })
    .populate('defaultParameterId', 'name parameters')
    .populate('providerEndpointId', 'name parameters');

    if (!adapter) {
      return NextResponse.json(
        { success: false, message: 'Adapter not found' },
        { status: 404 }
      );
    }

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
      defaultParameter: {
        _id: (adapter.defaultParameterId as any).toString(),
        name: (adapter.defaultParameterId as any).name
      },
      providerEndpoint: {
        _id: (adapter.providerEndpointId as any).toString(),
        name: (adapter.providerEndpointId as any).name
      }
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error fetching adapter:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/provider-adapters/[id] - Update adapter (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body: UpdateProviderAdapterDto = await request.json();

    await Connection.getInstance().connect();

    // Check if adapter exists
    const existingAdapter = await ProviderAdapter.findOne({
      _id: id,
      isActive: true
    });

    if (!existingAdapter) {
      return NextResponse.json(
        { success: false, message: 'Adapter not found' },
        { status: 404 }
      );
    }

    // If name is being updated, check for duplicates
    if (body.name && body.name !== existingAdapter.name) {
      const duplicateAdapter = await ProviderAdapter.findOne({
        name: body.name,
        isActive: true,
        _id: { $ne: id }
      });

      if (duplicateAdapter) {
        return NextResponse.json(
          { success: false, message: 'An adapter with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Validate that all required fields are mapped
    const providerEndpoint = await ProviderEndpoint.findById(body.providerEndpointId || existingAdapter.providerEndpointId);
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

    // Update adapter
    const updatedAdapter = await ProviderAdapter.findByIdAndUpdate(
      id,
      {
        ...body,
        updatedAt: new Date()
      },
      { new: true }
    )
    .populate('defaultParameterId', 'name parameters')
    .populate('providerEndpointId', 'name parameters');

    if (!updatedAdapter) {
      return NextResponse.json(
        { success: false, message: 'Adapter not found' },
        { status: 404 }
      );
    }

    const response = {
      _id: (updatedAdapter._id as any).toString(),
      name: updatedAdapter.name,
      description: updatedAdapter.description,
      userId: (updatedAdapter.userId as any).toString(),
      defaultParameterId: (updatedAdapter.defaultParameterId as any).toString(),
      providerEndpointId: (updatedAdapter.providerEndpointId as any).toString(),
      mappings: updatedAdapter.mappings,
      isActive: updatedAdapter.isActive,
      createdAt: updatedAdapter.createdAt.toISOString(),
      updatedAt: updatedAdapter.updatedAt.toISOString(),
      defaultParameter: updatedAdapter.defaultParameterId,
      providerEndpoint: updatedAdapter.providerEndpointId
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Adapter updated successfully'
    });

  } catch (error) {
    console.error('Error updating adapter:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/provider-adapters/[id] - Delete adapter (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    await Connection.getInstance().connect();

    // Check if adapter exists
    const adapter = await ProviderAdapter.findOne({
      _id: id,
      isActive: true
    });

    if (!adapter) {
      return NextResponse.json(
        { success: false, message: 'Adapter not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await ProviderAdapter.findByIdAndUpdate(id, {
      isActive: false,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Adapter deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting adapter:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 