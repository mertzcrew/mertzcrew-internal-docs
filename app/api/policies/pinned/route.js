import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '../../../../components/lib/mongodb';
import Policy from '../../../../models/Policy';
import UserPinnedPolicy from '../../../../models/UserPinnedPolicy';

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get session to identify the user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 0;
    
    // Get user's pinned policies
    const userPinnedPolicies = await UserPinnedPolicy.findOne({ userId: session.user.id })
      .populate({
        path: 'pinnedPolicies',
        populate: {
          path: 'created_by',
          select: 'first_name last_name email'
        }
      });

    if (!userPinnedPolicies) {
      return NextResponse.json({
        success: true,
        data: [],
        totalCount: 0
      });
    }

    // Sort by most recently pinned (assuming we want to show newest first)
    let pinnedPolicies = userPinnedPolicies.pinnedPolicies || [];
    
    // Apply limit if specified
    if (limit > 0) {
      pinnedPolicies = pinnedPolicies.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      data: pinnedPolicies,
      totalCount: userPinnedPolicies.pinnedPolicies.length
    });

  } catch (error) {
    console.error('Error fetching pinned policies:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 