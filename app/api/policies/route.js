import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '../../../components/lib/mongodb';
import Policy from '../../../models/Policy';
import User from '../../../models/User';
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
    console.log('API - Body keys:', Object.keys(body));
    console.log('API - Title:', body.title);
    console.log('API - Category:', body.category);
    console.log('API - Organization:', body.organization);
    console.log('API - Content:', body.content);
    console.log('API - Description:', body.description);
    console.log('API - IsDraft:', body.isDraft);
    console.log('API - Assigned Users:', body.assigned_users);
    
    const { 
      title, 
      content, 
      description, 
      category, 
      tags, 
      organization = 'all',
      attachments = [],
      assigned_users = [],
      isDraft = true
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
    const hasCreatePermission = user.permissions?.includes('create_policy') || user.role === 'admin';
    if (!hasCreatePermission) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to create policies' },
        { status: 403 }
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

    // Determine initial status based on user role and isDraft flag
    let initialStatus = 'draft';
    
    if (user.role === 'admin') {
      // Admin can choose to publish immediately or save as draft
      initialStatus = isDraft ? 'draft' : 'active';
    } else {
      // Non-admin users can only create drafts
      initialStatus = 'draft';
      
      // For non-admin users, validate that at least one admin is assigned
      if (assigned_users && assigned_users.length > 0) {
        const assignedUserObjects = await User.find({ _id: { $in: assigned_users } });
        const hasAdminUser = assignedUserObjects.some(assignedUser => assignedUser.role === 'admin');
        
        if (!hasAdminUser) {
          return NextResponse.json(
            { success: false, message: 'Non-admin users must assign at least one admin user for policy review' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, message: 'Non-admin users must assign at least one admin user for policy review' },
          { status: 400 }
        );
      }
    }

    // Prepare assigned users array - include creator by default
    const assignedUsersArray = [user._id];
    if (assigned_users && assigned_users.length > 0) {
      // Add additional assigned users if provided, avoiding duplicates
      assigned_users.forEach(userId => {
        if (!assignedUsersArray.includes(userId)) {
          assignedUsersArray.push(userId);
        }
      });
    }

    // Create new policy
    const policyData = {
      title: title.trim(),
      content: content ? content.trim() : '',
      description: description ? description.trim() : '',
      category: category.trim(),
      tags: parsedTags,
      organization,
      attachments: processedAttachments,
      assigned_users: assignedUsersArray,
      status: initialStatus,
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
    const limit = parseInt(searchParams.get('limit')) || 0;
    const sort = searchParams.get('sort') || 'created_at:desc';
    
    console.log('API - Query params:', { status, limit, sort });
    
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
          .sort({ created_at: -1 })
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

    // If user is admin, they can see all policies (unless status filter is applied)
    if (user.role === 'admin' && !status) {
      console.log('Admin user - showing all policies');
      policiesQuery = Policy.find({});
      if (status) {
        policiesQuery = policiesQuery.where('status', status);
      }
    } else {
      console.log('Non-admin user - filtering policies');
      console.log('User ID:', user._id);
      // For non-admin users, show:
      // 1. All published (active) policies
      // 2. Draft policies where the user is assigned
      policiesQuery = Policy.find({
        $or: [
          { status: 'active' }, // Published policies visible to everyone
          { 
            status: 'draft',
            assigned_users: user._id // Draft policies only visible to assigned users
          }
        ]
      });
      
      // Apply status filter if provided (for non-admin users)
      if (status) {
        if (status === 'active') {
          policiesQuery = Policy.find({ status: 'active' });
        } else if (status === 'draft') {
          policiesQuery = Policy.find({ 
            status: 'draft',
            assigned_users: user._id 
          });
        }
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
      .populate('assigned_users', 'first_name last_name email');

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