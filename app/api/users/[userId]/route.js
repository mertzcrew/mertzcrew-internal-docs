import { NextResponse } from 'next/server';
import dbConnect from '../../../../components/lib/mongodb';
import User from '../../../../models/User';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { userId } = params;
    const user = await User.findById(userId).select('-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires');
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const { userId } = params;
    const body = await request.json();

    const update = { ...body };
    if (!update.password) delete update.password;
    if (update.email) update.email = update.email.toLowerCase();

    const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true })
      .select('-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires');

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User updated successfully', data: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Email already in use' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
} 