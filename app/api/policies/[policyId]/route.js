import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../components/lib/mongodb';
import Policy from '../../../../models/Policy';
import User from '../../../../models/User';
import UserPinnedPolicy from '../../../../models/UserPinnedPolicy.js';

// GET a single policy by ID
export async function GET(request, { params }) {
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
    
    // Check if this is a pin status check request
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'checkPin') {
      try {
        const userPinnedPolicies = await UserPinnedPolicy.findOne({ userId: user._id });
        const isPinned = userPinnedPolicies && userPinnedPolicies.pinnedPolicies ? 
          userPinnedPolicies.pinnedPolicies.some(item => item && item.policyId && item.policyId.toString() === policyId) : false;
        
        console.log('GET Check pin status - User ID:', user._id);
        console.log('GET Check pin status - Policy ID:', policyId);
        console.log('GET Check pin status - User pinned policies:', userPinnedPolicies?.pinnedPolicies?.map(p => p?.policyId?.toString()).filter(Boolean));
        console.log('GET Check pin status - Is pinned:', isPinned);
        
        return NextResponse.json({
          success: true,
          isPinned: isPinned
        });
      } catch (error) {
        console.error('Error checking pin status:', error);
        return NextResponse.json({ success: false, message: 'Failed to check pin status' }, { status: 500 });
      }
    }
    
    const policy = await Policy.findById(policyId)
      .populate('created_by', 'first_name last_name email')
      .populate('updated_by', 'first_name last_name email')
      .populate('assigned_users', 'first_name last_name email');

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
      policy.assigned_users.some(assignedUser => assignedUser._id.toString() === user._id.toString());

    console.log('Individual policy visibility check:');
    console.log('User role:', user.role);
    console.log('Policy status:', policy.status);
    console.log('User ID:', user._id);
    console.log('Assigned users:', policy.assigned_users?.map(u => u._id));
    console.log('Can view:', canView);

    if (!canView) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: true, data: policy },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching policy:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH (update) a policy
export async function PATCH(request, { params }) {
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
    console.log('Edit API - Received request body:', body);
    
    const { 
      title, 
      content, 
      description, 
      category, 
      tags, 
      organization,
      status,
      attachments = [],
      action,
      assigned_users = []
    } = body;
    
    console.log('Edit API - Extracted attachments:', attachments);

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
      .populate('assigned_users', 'first_name last_name email');
    
    if (!policy) {
      return NextResponse.json(
        { success: false, message: 'Policy not found' },
        { status: 404 }
      );
    }

    // Check if user can edit this policy
    const canEdit = 
      user.role === 'admin' || 
      policy.assigned_users.some(assignedUser => assignedUser._id.toString() === user._id.toString());

    if (!canEdit) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to edit this policy' },
        { status: 403 }
      );
    }

    // Handle publish action (only admins can publish)
    if (action === 'publish') {
      console.log('Publish action triggered');
      console.log('User role:', user.role);
      console.log('Current policy status:', policy.status);
      console.log('Has pending changes:', policy.pending_changes && Object.keys(policy.pending_changes).length > 0);
      
      if (user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Only admins can publish policies' },
          { status: 403 }
        );
      }

      // If policy has pending changes, publish them
      if (policy.pending_changes && Object.keys(policy.pending_changes).length > 0) {
        console.log('Publishing pending changes');
        await policy.publishPendingChanges();
      }
      
      // Always set status to active when publishing
      console.log('Setting status to active');
      policy.status = 'active';
      policy.updated_by = user._id;
      await policy.save();
      console.log('Policy saved with status:', policy.status);

      const updatedPolicy = await Policy.findById(policyId)
        .populate('created_by', 'first_name last_name email')
        .populate('updated_by', 'first_name last_name email')
        .populate('assigned_users', 'first_name last_name email');

      console.log('Updated policy status:', updatedPolicy.status);

      return NextResponse.json(
        { 
          success: true, 
          message: 'Policy published successfully',
          data: updatedPolicy
        },
        { status: 200 }
      );
    }

    // Handle pin/unpin action
    if (action === 'togglePin') {
      if (!session) {
        return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
      }

      try {
        const policy = await Policy.findById(policyId);
        if (!policy) {
          return NextResponse.json({ success: false, message: 'Policy not found' }, { status: 404 });
        }

        // Get or create user's pinned policies
        let userPinnedPolicies = await UserPinnedPolicy.findOne({ userId: user._id });
        
        if (!userPinnedPolicies) {
          userPinnedPolicies = new UserPinnedPolicy({
            userId: user._id,
            pinnedPolicies: []
          });
        }

        const isPinned = userPinnedPolicies.pinnedPolicies.some(item => item && item.policyId && item.policyId.toString() === policyId);
        
        console.log('Toggle pin - User ID:', user._id);
        console.log('Toggle pin - Policy ID:', policyId);
        console.log('Toggle pin - Current pinned policies:', userPinnedPolicies.pinnedPolicies.map(p => p?.policyId?.toString() || p?.toString()).filter(Boolean));
        console.log('Toggle pin - Is currently pinned:', isPinned);
        
        if (isPinned) {
          // Unpin the policy
          userPinnedPolicies.pinnedPolicies = userPinnedPolicies.pinnedPolicies.filter(
            item => item && (item.policyId ? item.policyId.toString() : item.toString()) !== policyId
          );
          console.log('Toggle pin - Unpinning policy');
        } else {
          // Pin the policy
          userPinnedPolicies.pinnedPolicies.push({
            policyId: policyId,
            pinnedAt: new Date()
          });
          console.log('Toggle pin - Pinning policy');
        }

        await userPinnedPolicies.save();
        console.log('Toggle pin - Updated pinned policies:', userPinnedPolicies.pinnedPolicies.map(p => p?.policyId?.toString() || p?.toString()).filter(Boolean));

        return NextResponse.json({
          success: true,
          message: isPinned ? 'Policy unpinned successfully' : 'Policy pinned successfully',
          isPinned: !isPinned
        });
      } catch (error) {
        console.error('Error toggling pin:', error);
        return NextResponse.json({ success: false, message: 'Failed to toggle pin' }, { status: 500 });
      }
    }



    // Handle remove assigned user action
    if (action === 'removeAssignedUser') {
      const { userIdToRemove } = body;
      
      if (!userIdToRemove) {
        return NextResponse.json(
          { success: false, message: 'User ID to remove is required' },
          { status: 400 }
        );
      }

      // Check if user can modify this policy
      const canModify = 
        user.role === 'admin' || 
        policy.assigned_users.some(assignedUser => assignedUser._id.toString() === user._id.toString());

      if (!canModify) {
        return NextResponse.json(
          { success: false, message: 'Insufficient permissions to modify this policy' },
          { status: 403 }
        );
      }

      // Remove the user from assigned_users
      policy.assigned_users = policy.assigned_users.filter(
        assignedUser => assignedUser._id.toString() !== userIdToRemove
      );
      
      policy.updated_by = user._id;
      await policy.save();

      const updatedPolicy = await Policy.findById(policyId)
        .populate('created_by', 'first_name last_name email')
        .populate('updated_by', 'first_name last_name email')
        .populate('assigned_users', 'first_name last_name email');

      return NextResponse.json(
        { 
          success: true, 
          message: 'User removed from policy successfully',
          data: updatedPolicy
        },
        { status: 200 }
      );
    }

    // Handle regular update
    // Validate required fields
    if (!title || !category || !organization) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: title, category, and organization are required' 
        },
        { status: 400 }
      );
    }

    // Content is required only if there are no attachments
    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Either content or attachments are required' 
        },
        { status: 400 }
      );
    }

    // Parse tags if provided
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    // Process attachments to add uploadedBy field and ensure proper date format
    const processedAttachments = attachments.map(attachment => ({
      ...attachment,
      uploadedBy: user._id,
      uploadedAt: new Date(attachment.uploadedAt || Date.now())
    }));

    // Prepare assigned users array
    const assignedUsersArray = assigned_users && assigned_users.length > 0 
      ? assigned_users 
      : policy.assigned_users.map(user => user._id);
    
    // Ensure no duplicates in assigned users
    const uniqueAssignedUsers = [...new Set(assignedUsersArray)];

    // If policy is published (active), save changes as pending_changes
    if (policy.status === 'active') {
      const pendingChanges = {
        title: title.trim(),
        content: content ? content.trim() : '',
        description: description ? description.trim() : '',
        category: category.trim(),
        tags: parsedTags,
        organization,
        attachments: processedAttachments,
        effective_date: new Date()
      };

      policy.pending_changes = pendingChanges;
      policy.updated_by = user._id;
      policy.assigned_users = uniqueAssignedUsers;

      await policy.save();

      const updatedPolicy = await Policy.findById(policyId)
        .populate('created_by', 'first_name last_name email')
        .populate('updated_by', 'first_name last_name email')
        .populate('assigned_users', 'first_name last_name email');

      return NextResponse.json(
        { 
          success: true, 
          message: 'Changes saved as pending. An admin must approve and publish these changes.',
          data: updatedPolicy
        },
        { status: 200 }
      );
    } else {
      // For draft policies, update directly
      const updateData = {
        title: title.trim(),
        content: content ? content.trim() : '',
        description: description ? description.trim() : '',
        category: category.trim(),
        tags: parsedTags,
        organization,
        attachments: processedAttachments,
        assigned_users: uniqueAssignedUsers,
        updated_by: user._id
      };

      // Include status if provided (only admins can change status)
      if (status && user.role === 'admin') {
        updateData.status = status;
      }

      console.log('Edit API - Update data:', updateData);
      console.log('Edit API - Processed attachments:', processedAttachments);

      const updatedPolicy = await Policy.findByIdAndUpdate(
        policyId,
        updateData,
        { new: true, runValidators: true }
      ).populate('created_by', 'first_name last_name email')
       .populate('updated_by', 'first_name last_name email')
       .populate('assigned_users', 'first_name last_name email');
       
      console.log('Edit API - Updated policy:', updatedPolicy);
      console.log('Edit API - Updated policy attachments:', updatedPolicy.attachments);

      return NextResponse.json(
        { 
          success: true, 
          message: 'Policy updated successfully',
          data: updatedPolicy
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Error updating policy:', error);
    
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

    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 

// DELETE a policy
export async function DELETE(request, { params }) {
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

    // Find the user by email
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has delete permission
    const hasDeletePermission = user.permissions?.includes('delete_policy') || user.role === 'admin';
    if (!hasDeletePermission) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to delete policy' },
        { status: 403 }
      );
    }

    // Find the policy
    const policy = await Policy.findById(policyId);
    if (!policy) {
      return NextResponse.json(
        { success: false, message: 'Policy not found' },
        { status: 404 }
      );
    }

    // Delete the policy
    await Policy.findByIdAndDelete(policyId);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Policy deleted successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting policy:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 