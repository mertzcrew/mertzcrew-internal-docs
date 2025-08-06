import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '../../../../../components/lib/mongodb';
import Policy from '../../../../../models/Policy';
import User from '../../../../../models/User';

// POST endpoint to track a view for a policy
export async function POST(request, { params }) {
  try {
    await dbConnect();
    
    // Get session to identify the user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find the user by email
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const { policyId } = await params;
    
    // Find the policy
    const policy = await Policy.findById(policyId);
    if (!policy) {
      return NextResponse.json(
        { success: false, message: 'Policy not found' },
        { status: 404 }
      );
    }

    // Check visibility permissions
    const canView = 
      user.role === 'admin' || 
      policy.status === 'active' || 
      policy.assigned_users.some(assignedUser => assignedUser.toString() === user._id.toString());

    if (!canView) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Increment view count for published policies only
    if (policy.status === 'active') {
      try {
        await Policy.findByIdAndUpdate(policyId, { $inc: { views: 1 } });
        console.log(`View count incremented for policy ${policyId}`);
        return NextResponse.json(
          { success: true, message: 'View tracked successfully' },
          { status: 200 }
        );
      } catch (error) {
        console.error('Error incrementing view count:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to track view' },
          { status: 500 }
        );
      }
    } else {
      // For non-active policies, don't count views but return success
      return NextResponse.json(
        { success: true, message: 'View not tracked for non-active policy' },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 