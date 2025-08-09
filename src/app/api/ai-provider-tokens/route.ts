import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { 
  aiProviderTokenSchema, 
  aiProviderTokenUpdateSchema,
  type AiProviderTokenCreate,
  type AiProviderTokenUpdate,
  type AiProviderTokenPaginatedResponse
} from '@/lib/dto/ai-provider-token';
import { createPaginatedResponse, createSuccessResponse, createErrorResponse } from '@/lib/dto/base';
import { withWriteTransaction, withReadTransaction } from '@/lib/database/transaction';
import { handleZodError } from '@/lib/utils/error-handler';
import Connection from '@/Database/Connection';
import AiProviderToken from '@/Database/Models/AiProviderToken';
import AiProvider from '@/Database/Models/AiProvider';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';


export async function GET(request: NextRequest) {
  try {
    // Check authentication
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

    // Build query (only show tokens for the authenticated user)
    const query: Record<string, unknown> = {};

    if(session.user.role === 'user'){
      query.userId = new ObjectId(session.user.id);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const result = await withReadTransaction(async (dbSession) => {
      const skip = (page - 1) * limit;
      
      const [tokens, total] = await Promise.all([
        AiProviderToken.find(query)
          .select('-hashToken') // Don't return hashed token
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('userId')
          .session(dbSession)
          .lean(),
        AiProviderToken.countDocuments(query).session(dbSession),
      ]);

      return { tokens, total };
    });

    const response = createPaginatedResponse(
      result.tokens,
      page,
      limit,
      result.total
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/ai-provider-tokens error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch AI provider tokens', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 'Authentication required', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    await Connection.getInstance().connect();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = aiProviderTokenSchema.parse(body);

    // Generate a secure JWT-like token with user info and token ID encoded
    const generateSecureToken = (userId: string, userName: string, tokenId: string) => {
      // Create payload with user info and token ID
      const payload = {
        uid: userId,
        name: userName,
        tid: tokenId, // Token ID in database for revocation checks
        iat: Date.now(),
        type: 'api_token'
      };
      
      // Encode payload to base64
      const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
      
      // Generate random signature
      const signature = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
      
      // Create token format: hr.{payload}.{signature}
      return `hr.${payloadEncoded}.${signature}`;
    };

    // Create AI provider token with transaction
    const result = await withWriteTransaction(async (dbSession) => {
      // First create the token record to get the ID
      const newToken = new AiProviderToken({
        name: validatedData.name,
        userId: (session.user as any).id,
        hashToken: '', // Will be updated after token generation
        token: undefined, // Don't store plain text token
      });
      
      const savedToken = await newToken.save({ session: dbSession });
      
      // Generate secure token with the database ID
      const plainToken = generateSecureToken((session.user as any).id, (session.user as any).name, savedToken._id.toString());
      
      // Hash the token for storage
      const hashedToken = await bcrypt.hash(plainToken, 12);
      
      // Update the token with the hashed value
      savedToken.hashToken = hashedToken;
      await savedToken.save({ session: dbSession });
      
      // Return the token with plain text for first-time display only
      return {
        ...savedToken.toObject(),
        token: plainToken, // Include plain text token for response (only time it's shown)
      };
    });

    const response = createSuccessResponse(result, 'API token created successfully');
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST /api/ai-provider-tokens error:', error);
    
    // Handle MongoDB duplicate key error
    if (error instanceof Error && error.message.includes('duplicate key error')) {
      return NextResponse.json(
        createErrorResponse(
          'A token with this name already exists', 
          'A token with this name already exists. Please choose a different name.',
          'DUPLICATE_KEY_ERROR'
        ),
        { status: 409 }
      );
    }
    
    return handleZodError(error);
  }
} 