import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '../../../../../components/lib/mongodb';
import Policy from '../../../../../models/Policy';
import User from '../../../../../models/User';
import Notification from '../../../../../models/Notification.js';

// POST route to assign admins for policy review and publishing
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

    const { policyId } = await params;
    const body = await request.json();
    const { adminIds } = body;

    // Validate input
    if (!adminIds || !Array.isArray(adminIds) || adminIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Admin IDs array is required' },
        { status: 400 }
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

    // Find the policy
    const policy = await Policy.findById(policyId)
      .populate('created_by', 'first_name last_name email')
      .populate('assigned_users', 'first_name last_name email');
    
    if (!policy) {
      return NextResponse.json(
        { success: false, message: 'Policy not found' },
        { status: 404 }
      );
    }

    // Check if user can assign this policy for review
    // User must be assigned to the policy and not be an admin
    const canAssign = user.role !== 'admin' && 
      policy.assigned_users.some(assignedUser => assignedUser._id.toString() === user._id.toString());

    if (!canAssign) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to assign this policy for review' },
        { status: 403 }
      );
    }

    // Verify that the policy is in draft status
    if (policy.status !== 'draft') {
      return NextResponse.json(
        { success: false, message: 'Only draft policies can be assigned for review' },
        { status: 400 }
      );
    }

    // Verify that all provided IDs are admin users
    const adminUsers = await User.find({ 
      _id: { $in: adminIds },
      role: 'admin'
    });

    if (adminUsers.length !== adminIds.length) {
      return NextResponse.json(
        { success: false, message: 'One or more users are not admin users' },
        { status: 400 }
      );
    }

    // Add the admin users to the policy's assigned_users (if not already assigned)
    const currentAssignedUserIds = policy.assigned_users.map(u => u._id.toString());
    const newAdminIds = adminIds.filter(adminId => !currentAssignedUserIds.includes(adminId.toString()));
    
    if (newAdminIds.length > 0) {
      policy.assigned_users = [...policy.assigned_users, ...newAdminIds];
      policy.updated_by = user._id;
      await policy.save();
    }

    // Send email notifications to the assigned admins
    try {
      const { sendPolicyReadyForReviewEmail } = await import('../../../../../lib/emailService.ts');
      
      for (const adminUser of adminUsers) {
        const fromUserName = `${user.first_name} ${user.last_name}`;
        const adminUserName = `${adminUser.first_name} ${adminUser.last_name}`;
        
        await sendPolicyReadyForReviewEmail(
          adminUser.email,
          adminUserName,
          policy.title,
          fromUserName,
          policy._id.toString()
        );
        
        console.log(`Sent policy ready for review email to admin: ${adminUser.email}`);
      }
    } catch (emailError) {
      console.error('Error sending policy ready for review emails:', emailError);
      // Don't fail the assignment if emails fail
    }

    // Create in-app notifications for the assigned admins
    try {
      // Debug: Check if the method exists
      console.log('Available Notification methods:', Object.getOwnPropertyNames(Notification));
      console.log('createPolicyReadyForReviewNotifications exists:', typeof Notification.createPolicyReadyForReviewNotifications);
      
      if (typeof Notification.createPolicyReadyForReviewNotifications === 'function') {
        await Notification.createPolicyReadyForReviewNotifications(policy._id, adminIds, user._id);
      } else {
        console.warn('createPolicyReadyForReviewNotifications method not available, skipping in-app notifications');
      }
    } catch (notificationError) {
      console.error('Error creating policy ready for review notifications:', notificationError);
      // Don't fail the assignment if notifications fail
    }

    const updatedPolicy = await Policy.findById(policyId)
      .populate('created_by', 'first_name last_name email')
      .populate('updated_by', 'first_name last_name email')
      .populate('assigned_users', 'first_name last_name email');

    return NextResponse.json(
      { 
        success: true, 
        message: `Successfully assigned ${adminUsers.length} admin${adminUsers.length !== 1 ? 's' : ''} for policy review`,
        data: updatedPolicy
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error assigning policy for review:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 