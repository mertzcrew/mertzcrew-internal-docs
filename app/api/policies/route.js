import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '../../../components/lib/mongodb';
import Policy from '../../../models/Policy';
import User from '../../../models/User';

export async function POST(request) {
  try {
    // Connect to database
    await dbConnect();

    // Get session to identify the user
    const session = await getServerSession();
    if (!session) {
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
      category, 
      tags, 
      organization = 'all',
      attachments = []
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

    // Parse tags if provided
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    // Process attachments to add uploadedBy field and ensure proper date format
    const processedAttachments = attachments.map(attachment => ({
      ...attachment,
      uploadedBy: user._id,
      uploadedAt: new Date(attachment.uploadedAt || Date.now())
    }));

    // Create new policy
    const policyData = {
      title: title.trim(),
      content: content ? content.trim() : '',
      description: description ? description.trim() : '',
      category: category.trim(),
      tags: parsedTags,
      organization,
      attachments: processedAttachments,
      created_by: user._id,
      updated_by: user._id
    };

    console.log('API - Policy data to save:', policyData);
    console.log('API - Attachments in policy data:', policyData.attachments);

    const policy = new Policy(policyData);
    
    try {
      await policy.save();
      console.log('API - Saved policy:', policy);
      console.log('API - Saved policy attachments:', policy.attachments);
    } catch (saveError) {
      console.error('API - Error saving policy:', saveError);
      if (saveError.name === 'ValidationError') {
        console.error('API - Validation errors:', saveError.errors);
      }
      throw saveError;
    }

    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'Policy created successfully',
        data: {
          _id: policy._id,
          title: policy.title,
          category: policy.category,
          organization: policy.organization,
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
export async function GET() {
  try {
    await dbConnect();
    
    const policies = await Policy.find({})
      .populate('created_by', 'first_name last_name email')
      .sort({ created_at: -1 });

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