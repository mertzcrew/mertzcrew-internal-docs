import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../components/lib/mongodb';
import Policy from '../../../../models/Policy';
import User from '../../../../models/User';
import UserPinnedPolicy from '../../../../models/UserPinnedPolicy.js';

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get session to identify the user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    // Find the user by email first
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 0;
    
    // Get user's pinned policies
    const userPinnedPolicies = await UserPinnedPolicy.findOne({ userId: user._id })
      .populate('userId');
      console.log('userPinnedPolicies', userPinnedPolicies)
    console.log('userPinnedPolicies.pinnedPolicies', userPinnedPolicies?.pinnedPolicies)
    if (userPinnedPolicies?.pinnedPolicies?.length > 0) {
      console.log('First pinned policy item:', userPinnedPolicies.pinnedPolicies[0])
      console.log('First pinned policy keys:', Object.keys(userPinnedPolicies.pinnedPolicies[0]))
    }

    if (!userPinnedPolicies) {
      return NextResponse.json({
        success: true,
        data: [],
        totalCount: 0
      });
    }

    // Sort by most recently pinned (newest first)
    let pinnedPolicies = userPinnedPolicies.pinnedPolicies || [];
    
    // Filter out any null or undefined items and handle both old and new data formats
    pinnedPolicies = pinnedPolicies.filter(item => item && (item.policyId || item._id));
    
    pinnedPolicies.sort((a, b) => new Date(b.pinnedAt) - new Date(a.pinnedAt));
    
    // Apply limit if specified
    if (limit > 0) {
      pinnedPolicies = pinnedPolicies.slice(0, limit);
    }
console.log('pinnedPolicies', pinnedPolicies)
    
    // Extract the policy IDs from the pinnedPolicies array, handling both formats
    const policyIds = pinnedPolicies.map(item => {
      const id = item.policyId || item._id;
      // Convert ObjectId to string if needed
      return id ? id.toString() : null;
    }).filter(Boolean);
    
    console.log('Policy IDs to fetch:', policyIds);
    console.log('Policy IDs types:', policyIds.map(id => typeof id));
    
    // Fetch the actual policy documents
    const policies = await Policy.find({ _id: { $in: policyIds } })
      .populate('created_by', 'first_name last_name email');
    
    console.log('Found policies:', policies.length);
    console.log('Policies:', policies);

    return NextResponse.json({
      success: true,
      data: policies,
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