import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import GlobalDefaultParameter from '@/Database/Models/GlobalDefaultParameter';
import { globalDefaultParameterSchema } from '@/lib/dto/global-default-parameter';
import { withWriteTransaction } from '@/lib/database/transaction';
import Connection from '@/Database/Connection';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await Connection.getInstance().connect();

    const parameter = await GlobalDefaultParameter.findById(resolvedParams.id).lean();
    
    if (!parameter) {
      return NextResponse.json(
        { error: 'Global default parameter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Global default parameter retrieved successfully',
      data: parameter
    });
  } catch (error) {
    console.error('Error fetching global default parameter:', error);
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
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await Connection.getInstance().connect();

    const body = await request.json();
    const validatedData = globalDefaultParameterSchema.parse(body);

    // Check if parameter exists
    const existingParameter = await GlobalDefaultParameter.findById(resolvedParams.id);
    if (!existingParameter) {
      return NextResponse.json(
        { error: 'Global default parameter not found' },
        { status: 404 }
      );
    }

    // Update parameter
    const result = await withWriteTransaction(async (session) => {
      const updatedParameter = await GlobalDefaultParameter.findByIdAndUpdate(
        resolvedParams.id,
        validatedData,
        { new: true, session }
      );
      return updatedParameter;
    });

    return NextResponse.json({
      success: true,
      message: 'Global default parameter updated successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error updating global default parameter:', error);
    
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
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await Connection.getInstance().connect();

    // Check if parameter exists
    const existingParameter = await GlobalDefaultParameter.findById(resolvedParams.id);
    if (!existingParameter) {
      return NextResponse.json(
        { error: 'Global default parameter not found' },
        { status: 404 }
      );
    }

    // Delete parameter
    await withWriteTransaction(async (session) => {
      await GlobalDefaultParameter.findByIdAndDelete(resolvedParams.id, { session });
    });

    return NextResponse.json({
      success: true,
      message: 'Global default parameter deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting global default parameter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 