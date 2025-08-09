import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Connection from '@/Database/Connection';
import User from '@/Database/Models/User';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Initialize database
    await Connection.getInstance().connect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user - middleware will automatically assign default role
    console.log('Creating new user...');
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });
    
    console.log('User object before save:', {
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    await user.save();
    
    console.log('User saved successfully with role:', user.role);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject();

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: userWithoutPassword 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 