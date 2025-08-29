import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '../../../components/lib/mongodb';
import User from '../../../models/User';

export async function POST(request) {
  try {
    // Connect to database
    await dbConnect();

    // Parse request body
    const body = await request.json();
    const { email, password, first_name, last_name, role, department, position, phone, permissions, organization } = body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name || !organization) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: email, password, first_name, last_name, and organization are required' 
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User with this email already exists' 
        },
        { status: 409 }
      );
    }

    // Create new user
    const userData = {
      email: email.toLowerCase(),
      password,
      first_name,
      last_name,
      role: role || 'associate',
      department: department || null,
      position: position || null,
      phone: phone || null,
      permissions: permissions || [],
      organization
    };

    const user = new User(userData);
    await user.save();

    // Return user data without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      fullName: user.fullName,
      role: user.role,
      permissions: user.permissions,
      organization: user.organization,
      department: user.department,
      position: user.position,
      phone: user.phone,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json(
      { 
        success: true, 
        message: 'User created successfully',
        data: userResponse
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed',
          errors: validationErrors
        },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User with this email already exists' 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET users with optional search query
export async function GET(request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameter for filtering
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    let searchQuery = {};

    // Add text search if query is provided
    if (query.trim()) {
      searchQuery = {
        $or: [
          { first_name: { $regex: query, $options: 'i' } },
          { last_name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(searchQuery)
      .select('first_name last_name email role')
      .sort({ first_name: 1, last_name: 1 })
      .limit(20);

    return NextResponse.json({
      success: true,
      users
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 