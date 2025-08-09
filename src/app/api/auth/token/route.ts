import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    // Return session data for client-side use
    return NextResponse.json({
      user: session.user,
      expires: session.expires
    });
  } catch (error) {
    console.error('Error getting session token:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
} 