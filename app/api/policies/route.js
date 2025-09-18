import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import dbConnect from '../../../components/lib/mongodb';
import Policy from '../../../models/Policy';
import User from '../../../models/User';
import Tag from '../../../models/Tag';
import Notification from '../../../models/Notification';

export async function POST(request) {
  try {
    // Connect to database
    await dbConnect();

    // Get session to identify the user
    const session = await getServerSession(authOptions);
    console.log('API - Session check:', !!session);
    console.log('API - Session user:', session?.user);
    
    if (!session) {
      console.log('API - No session found, returning 401');
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log('API - Received request body:', body);
    
    const { 
      title, 
      content, 
      description,
      department,
      category, 
      tags, 
      organization = 'all',
      attachments = [],
      assigned_users = [],
      isDraft = true,
      require_signature = false
    } = body;
    
    console.log('API - Extracted attachments:', attachments);

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

    // Find the user by email
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to create policies
    // All authenticated users can create draft policies, only admins can publish directly
    const canPublishDirectly = user.permissions?.includes('create_policy') || user.role === 'admin';
    
    // If user is trying to publish directly but doesn't have permission, block it
    if (!isDraft && !canPublishDirectly) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to publish policies directly. You can create a draft policy for admin review.' },
        { status: 403 }
      );
    }

    // Process tags if provided
    let processedTags = [];
    if (tags && tags.trim()) {
      const tagNames = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      for (const tagName of tagNames) {
        const tagDoc = await Tag.findOrCreate(tagName, user._id);
        processedTags.push(tagDoc._id);
        // Increment usage count for new tags
        if (tagDoc.usage_count === 0) {
          await Tag.incrementUsage(tagDoc._id);
        }
      }
    }

    // Process attachments to add uploadedBy field and ensure proper date format
    const processedAttachments = attachments.map(attachment => ({
      ...attachment,
      uploadedBy: user._id,
      uploadedAt: new Date(attachment.uploadedAt || Date.now())
    }));

    // Determine initial status based on user role and isDraft flag
    let initialStatus = 'draft';
    
    if (user.role === 'admin') {
      // Admin can choose to publish immediately or save as draft
      initialStatus = isDraft ? 'draft' : 'active';
    } else {
      // Non-admin users can only create drafts
      initialStatus = 'draft';
      
      // User assignment is optional for all users (no validation required)
    }

    // Prepare assigned users array based on user role
    let assignedUsersArray = [];
    
    if (user.role === 'admin') {
      // Admin is automatically assigned to their own policy
      assignedUsersArray = [user._id];
      
      // Add any additional assigned users if provided
      if (assigned_users && assigned_users.length > 0) {
        assigned_users.forEach(userId => {
          if (!assignedUsersArray.includes(userId)) {
            assignedUsersArray.push(userId);
          }
        });
      }
    } else {
      // Non-admin users must include themselves and at least one admin
      assignedUsersArray = [user._id];
      
      // Add any additional assigned users if provided
      if (assigned_users && assigned_users.length > 0) {
        assigned_users.forEach(userId => {
          if (!assignedUsersArray.includes(userId)) {
            assignedUsersArray.push(userId);
          }
        });
      }
    }

    // Create new policy
    const policyData = {
      title: title.trim(),
      content: content ? content.trim() : '',
      description: description ? description.trim() : '',
      category: category.trim(),
      tags: processedTags,
      organization,
      department,
      attachments: processedAttachments,
      assigned_users: assignedUsersArray,
      effective_date: body.effective_date || new Date(),
      require_signature: !!require_signature,
      status: initialStatus,
      publish_date: initialStatus === 'active' ? new Date() : null,
      created_by: user._id,
      updated_by: user._id
    };

    console.log('API - Policy data to save:', policyData);
    console.log('API - Attachments in policy data:', policyData.attachments);
    console.log('API - Assigned users:', assignedUsersArray);

    const policy = new Policy(policyData);
    
    try {
      await policy.save();
      console.log('API - Saved policy:', policy);
      console.log('API - Saved policy attachments:', policy.attachments);
      
      // Create notifications for published policies
      if (policy.status === 'active') {
        try {
          await Notification.createPolicyNotification(policy._id, 'policy_created');
        } catch (notificationError) {
          console.error('Error creating notifications:', notificationError);
          // Don't fail the policy creation if notifications fail
        }
      }
      
      // Create notifications for draft policies
      if (policy.status === 'draft') {
        try {
          await Notification.createDraftPolicyNotification(policy._id);
        } catch (notificationError) {
          console.error('Error creating draft policy notifications:', notificationError);
          // Don't fail the policy creation if notifications fail
        }
      }
      
      // Create assignment notifications for assigned users (excluding the creator)
      if (assigned_users && assigned_users.length > 0) {
        try {
          console.log('API - Creating assignment notifications for:', assigned_users);
          console.log('API - Creator ID:', user._id);
          await Notification.createAssignmentNotifications(policy._id, assigned_users, user._id);
        } catch (notificationError) {
          console.error('Error creating assignment notifications:', notificationError);
          // Don't fail the policy creation if notifications fail
        }
      }
      
    } catch (saveError) {
      console.error('API - Error saving policy:', saveError);
      if (saveError.name === 'ValidationError') {
        console.error('API - Validation errors:', saveError.errors);
        const validationErrors = Object.values(saveError.errors).map(err => err.message);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Validation failed',
            errors: validationErrors,
            details: saveError.errors
          },
          { status: 400 }
        );
      }
      throw saveError;
    }

    // Return success response
    const successMessage = initialStatus === 'active' 
      ? 'Policy created and published successfully' 
      : 'Policy created as draft successfully';
    
    return NextResponse.json(
      { 
        success: true, 
        message: successMessage,
        data: {
          _id: policy._id,
          title: policy.title,
          category: policy.category,
          organization: policy.organization,
          department: policy.department,
          status: policy.status,
          created_at: policy.created_at
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating policy:', error);
    
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

// GET route to fetch all policies (optional)
export async function GET(request) {
  try {
    await dbConnect();
    
    // Debug environment variables
    console.log('API - NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
    console.log('API - NEXTAUTH_SECRET length:', process.env.NEXTAUTH_SECRET?.length);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit')) || 0;
    const sort = searchParams.get('sort') || 'created_at:desc';
    
    console.log('API - Query params:', { status, category, limit, sort });
    
    // Temporary test endpoint to check database without auth
    const test = searchParams.get('test');
    if (test === 'true') {
      try {
        const allPolicies = await Policy.find({});
        const activePolicies = await Policy.find({ status: 'active' });
        console.log('API - Test: All policies count:', allPolicies.length);
        console.log('API - Test: Active policies count:', activePolicies.length);
        return NextResponse.json({
          success: true,
          allCount: allPolicies.length,
          activeCount: activePolicies.length,
          activePolicies: activePolicies.map(p => ({ id: p._id, title: p.title, status: p.status }))
        });
      } catch (dbError) {
        console.error('API - Database error in test:', dbError);
        return NextResponse.json({
          success: false,
          message: 'Database connection error',
          error: dbError.message
        });
      }
    }
    
    // Temporary bypass for dashboard recent documents (unauthenticated)
    const dashboard = searchParams.get('dashboard');
    if (dashboard === 'true') {
      try {
        const activePolicies = await Policy.find({ status: 'active' })
          .populate('created_by', 'first_name last_name email')
          .populate('tags', 'name color')
          .sort({ updatedAt: -1, created_at: -1 }) // Sort by most recent update, then by creation date
          .limit(5);
        
        console.log('API - Dashboard: Active policies count:', activePolicies.length);
        return NextResponse.json({
          success: true,
          data: activePolicies
        });
      } catch (dbError) {
        console.error('API - Dashboard error:', dbError);
        return NextResponse.json({
          success: false,
          message: 'Database connection error',
          error: dbError.message
        });
      }
    }

    // Handle assigned policies request
    const assigned = searchParams.get('assigned');
    if (assigned === 'true') {
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

      try {
        // Find policies where the user is assigned
        const assignedPolicies = await Policy.find({ 
          assigned_users: user._id 
        })
        .populate('created_by', 'first_name last_name email')
        .populate('assigned_users', 'first_name last_name email')
        .populate('tags', 'name color')
        .sort({ updatedAt: -1, created_at: -1 });

        console.log('API - Assigned policies count:', assignedPolicies.length);
        return NextResponse.json({
          success: true,
          policies: assignedPolicies
        });
      } catch (dbError) {
        console.error('API - Assigned policies error:', dbError);
        return NextResponse.json({
          success: false,
          message: 'Database connection error',
          error: dbError.message
        });
      }
    }
    
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

    let policiesQuery = Policy.find({});

    // Apply status filter if provided
    if (status) {
      policiesQuery = policiesQuery.where('status', status);
    }

    // Apply category filter if provided
    if (category) {
      policiesQuery = policiesQuery.where('category', category);
    }

    // If user is admin, they can see all policies
    if (user.role === 'admin') {
      console.log('Admin user - showing all policies');
      // Base query already set above with filters applied
    } else {
      console.log('Non-admin user - filtering policies');
      console.log('User ID:', user._id);

      // Build base visibility conditions
      const activeVisibility = { status: 'active', organization: { $in: ['all', user.organization] } };
      const draftVisibility = { status: 'draft', assigned_users: user._id };

      // Add category filter to visibility conditions if provided
      if (category) {
        activeVisibility.category = category;
        draftVisibility.category = category;
      }

      // Apply visibility rules for non-admins
      if (status) {
        if (status === 'active') {
          policiesQuery = Policy.find(activeVisibility);
        } else if (status === 'draft') {
          policiesQuery = Policy.find(draftVisibility);
        } else {
          policiesQuery = Policy.find({ $or: [activeVisibility, draftVisibility] });
        }
      } else {
        policiesQuery = Policy.find({ $or: [activeVisibility, draftVisibility] });
      }
    }

    // Apply sorting
    const [sortField, sortOrder] = sort.split(':');
    const sortObject = {};
    sortObject[sortField] = sortOrder === 'desc' ? -1 : 1;
    policiesQuery = policiesQuery.sort(sortObject);

    // Apply limit if provided
    if (limit > 0) {
      policiesQuery = policiesQuery.limit(limit);
    }

    const policies = await policiesQuery
      .populate('created_by', 'first_name last_name email')
      .populate('updated_by', 'first_name last_name email')
      .populate('assigned_users', 'first_name last_name email')
      .populate('tags', 'name color');

    console.log('Policies found:', policies.length);
    console.log('API - All policies in database:', await Policy.countDocuments());
    console.log('API - Active policies in database:', await Policy.countDocuments({ status: 'active' }));
    console.log('API - Draft policies in database:', await Policy.countDocuments({ status: 'draft' }));
    
    policies.forEach(policy => {
      console.log(`Policy: ${policy.title}, Status: ${policy.status}, Created: ${policy.created_at}`);
    });

    return NextResponse.json(
      { 
        success: true, 
        data: policies 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching policies:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 