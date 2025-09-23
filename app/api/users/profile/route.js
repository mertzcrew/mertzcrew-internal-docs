import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import dbConnect from '../../../../components/lib/mongodb';
import User from '../../../../models/User';

// GET user profile
export async function GET(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: session.user.email })
      .select('first_name last_name email department position organization');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: user },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update user profile
export async function PUT(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { first_name, last_name, department, position } = body;

    // Validation
    if (!first_name || !first_name.trim()) {
      return NextResponse.json(
        { success: false, message: 'First name is required' },
        { status: 400 }
      );
    }

    if (!last_name || !last_name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Last name is required' },
        { status: 400 }
      );
    }

    if (first_name.length > 50) {
      return NextResponse.json(
        { success: false, message: 'First name cannot be more than 50 characters' },
        { status: 400 }
      );
    }

    if (last_name.length > 50) {
      return NextResponse.json(
        { success: false, message: 'Last name cannot be more than 50 characters' },
        { status: 400 }
      );
    }

    if (position && position.length > 100) {
      return NextResponse.json(
        { success: false, message: 'Position cannot be more than 100 characters' },
        { status: 400 }
      );
    }

    // Validate department if provided
    if (department && !['tech_team', 'customer_support', 'misc'].includes(department)) {
      return NextResponse.json(
        { success: false, message: 'Invalid department' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update user profile
    user.first_name = first_name.trim();
    user.last_name = last_name.trim();
    user.department = department || undefined;
    user.position = position?.trim() || undefined;

    await user.save();

    // Return updated user (without sensitive fields)
    const updatedUser = await User.findById(user._id)
      .select('first_name last_name email department position organization');

    return NextResponse.json(
      { success: true, data: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 