import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ProviderEndpoint from '@/Database/Models/ProviderEndpoint';
import AiProviderParameter from '@/Database/Models/AiProviderModelParameters';
import { providerEndpointSchema } from '@/lib/dto/provider-endpoint';
import { withWriteTransaction, withReadTransaction } from '@/lib/database/transaction';
import { validateUrlParameters } from '@/lib/utils/url-parameter-detector';
import { validateAllDuplicateParameters } from '@/lib/utils/parameter-validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const endpoint = await ProviderEndpoint.findById(id).lean() as any;
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Provider endpoint not found' },
        { status: 404 }
      );
    }

    // Get associated parameters
    const parameters = await AiProviderParameter.findOne({
      provider_endpoint_id: endpoint._id
    }).lean() as any;

    const result = {
      ...endpoint,
      parameters: parameters?.paramter || null
    };

    return NextResponse.json({
      success: true,
      message: 'Provider endpoint retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error fetching provider endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
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

    // Check if endpoint exists
    const existingEndpoint = await ProviderEndpoint.findById(id);
    if (!existingEndpoint) {
      return NextResponse.json(
        { error: 'Provider endpoint not found' },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if it conflicts with another endpoint
    if (validatedData.slug !== existingEndpoint.slug) {
      const slugConflict = await ProviderEndpoint.findOne({
        slug: validatedData.slug,
        _id: { $ne: id }
      });
      
      if (slugConflict) {
        return NextResponse.json(
          { error: 'Provider endpoint with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update endpoint and parameters in transaction
    const result = await withWriteTransaction(async (session) => {
      // 1. Update the provider endpoint
      const updatedEndpoint = await ProviderEndpoint.findByIdAndUpdate(
        id,
        validatedData,
        { new: true, session }
      );

      // 2. Update parameters if provided
      if (paramter) {
        await AiProviderParameter.findOneAndUpdate(
          { provider_endpoint_id: id },
          { paramter: paramter },
          { upsert: true, session }
        );
      }

      return updatedEndpoint;
    });

    return NextResponse.json({
      success: true,
      message: 'Provider endpoint updated successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error updating provider endpoint:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if endpoint exists
    const existingEndpoint = await ProviderEndpoint.findById(id);
    if (!existingEndpoint) {
      return NextResponse.json(
        { error: 'Provider endpoint not found' },
        { status: 404 }
      );
    }

    // Delete endpoint and parameters in transaction
    await withWriteTransaction(async (session) => {
      // 1. Delete the provider endpoint
      await ProviderEndpoint.findByIdAndDelete(id, { session });

      // 2. Delete associated parameters
      await AiProviderParameter.findOneAndDelete(
        { provider_endpoint_id: id },
        { session }
      );
    });

    return NextResponse.json({
      success: true,
      message: 'Provider endpoint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting provider endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 