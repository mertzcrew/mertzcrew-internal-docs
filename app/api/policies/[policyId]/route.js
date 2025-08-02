import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '../../../../components/lib/mongodb';
import Policy from '../../../../models/Policy';
import User from '../../../../models/User';

// GET a single policy by ID
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { policyId } = await params;
    
    const policy = await Policy.findById(policyId)
      .populate('created_by', 'first_name last_name email')
      .populate('updated_by', 'first_name last_name email');

    if (!policy) {
      return NextResponse.json(
        { success: false, message: 'Policy not found' },
        { status: 404 }
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
    const session = await getServerSession();
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
      action
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
    const policy = await Policy.findById(policyId);
    if (!policy) {
      return NextResponse.json(
        { success: false, message: 'Policy not found' },
        { status: 404 }
      );
    }

    // Handle publish action
    if (action === 'publish') {
      const updatedPolicy = await Policy.findByIdAndUpdate(
        policyId,
        { 
          status: 'active',
          updated_by: user._id
        },
        { new: true, runValidators: true }
      ).populate('created_by', 'first_name last_name email')
       .populate('updated_by', 'first_name last_name email');

      return NextResponse.json(
        { 
          success: true, 
          message: 'Policy published successfully',
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

    // Update the policy
    const updateData = {
      title: title.trim(),
      content: content ? content.trim() : '',
      description: description ? description.trim() : '',
      category: category.trim(),
      tags: parsedTags,
      organization,
      attachments: processedAttachments,
      updated_by: user._id
    };

    // Include status if provided
    if (status) {
      updateData.status = status;
    }

    console.log('Edit API - Update data:', updateData);
    console.log('Edit API - Processed attachments:', processedAttachments);

    const updatedPolicy = await Policy.findByIdAndUpdate(
      policyId,
      updateData,
      { new: true, runValidators: true }
    ).populate('created_by', 'first_name last_name email')
     .populate('updated_by', 'first_name last_name email');
     
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