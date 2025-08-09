import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Role enum
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

// Auth middleware options
export interface AuthOptions {
  required?: boolean;
  roles?: UserRole[];
}

// Session user schema
const sessionUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
});

export type AuthenticatedUser = z.infer<typeof sessionUserSchema>;

// Authentication middleware
export async function authenticate(
  request: NextRequest,
  options: AuthOptions = { required: true, roles: [UserRole.USER, UserRole.ADMIN] }
): Promise<{ user?: AuthenticatedUser; error?: string }> {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      if (options.required) {
        return { error: 'Authentication required' };
      }
      return {};
    }

    // Validate session user structure
    const validatedUser = sessionUserSchema.parse(session.user);
    
    // Check role permissions
    if (options.roles && !options.roles.includes(validatedUser.role as UserRole)) {
      return { error: 'Insufficient permissions' };
    }

    return { user: validatedUser };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Invalid authentication session' };
  }
}

// Role-based middleware
export function requireRole(roles: UserRole[]) {
  return async (request: NextRequest) => {
    const auth = await authenticate(request, { required: true, roles });
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error, code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    return auth.user;
  };
}

// Admin-only middleware
export const requireAdmin = requireRole([UserRole.ADMIN]);

// User or Admin middleware
export const requireUser = requireRole([UserRole.USER, UserRole.ADMIN]);

// Optional authentication middleware
export async function optionalAuth(request: NextRequest) {
  return await authenticate(request, { required: false });
}

// Helper function to get user from request
export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  const auth = await authenticate(request, { required: false });
  return auth.user || null;
}

// Decode API token with token ID for revocation checks
export function decodeApiToken(token: string): { 
  uid: string; 
  name: string; 
  tid: string; // Token ID in database
  iat: number; 
  exp?: number; 
  type: string 
} | null {
  try {
    if (!token.startsWith('hr.')) {
      return null;
    }
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payloadEncoded = parts[1];
    const payload = JSON.parse(Buffer.from(payloadEncoded, 'base64url').toString());
    
    // Check expiration if present
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Error decoding API token:', error);
    return null;
  }
}

// Validate API token by checking if it's still active in database
export async function validateApiToken(token: string): Promise<{ 
  valid: boolean; 
  user?: { uid: string; name: string }; 
  error?: string 
}> {
  try {
    const decoded = decodeApiToken(token);
    if (!decoded) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Import database models
    const { default: Connection } = await import('@/Database/Connection');
    const { default: AiProviderToken } = await import('@/Database/Models/AiProviderToken');
    
    await Connection.getInstance().connect();
    
    // Check if token exists and is active in database
    const tokenRecord = await AiProviderToken.findById(decoded.tid);
    if (!tokenRecord) {
      return { valid: false, error: 'Token not found' };
    }
    
    if (!tokenRecord.isActive) {
      return { valid: false, error: 'Token has been revoked' };
    }
    
    return { 
      valid: true, 
      user: { uid: decoded.uid, name: decoded.name } 
    };
  } catch (error) {
    console.error('Error validating API token:', error);
    return { valid: false, error: 'Token validation failed' };
  }
} 