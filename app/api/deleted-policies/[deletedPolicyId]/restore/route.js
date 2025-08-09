import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '../../../../components/lib/mongodb';
import DeletedPolicy from '../../../../models/DeletedPolicy';
import Policy from '../../../../models/Policy';
import User from '../../../../models/User';

// POST /api/deleted-policies/[deletedPolicyId]/restore - Restore a deleted policy
export async function POST(request, { params }) {
  try {
    await dbConnect();

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

    // Only admins can restore deleted policies
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to restore policies' },
        { status: 403 }
      );
    }

    const { deletedPolicyId } = await params;

    // Find the deleted policy
    const deletedPolicy = await DeletedPolicy.findById(deletedPolicyId)
      .populate('created_by', 'first_name last_name email')
      .populate('updated_by', 'first_name last_name email')
      .populate('assigned_users', 'first_name last_name email');

    if (!deletedPolicy) {
      return NextResponse.json(
        { success: false, message: 'Deleted policy not found' },
        { status: 404 }
      );
    }

    // Check if a policy with the same original ID already exists
    const existingPolicy = await Policy.findById(deletedPolicy.original_policy_id);
    if (existingPolicy) {
      return NextResponse.json(
        { success: false, message: 'A policy with this ID already exists' },
        { status: 400 }
      );
    }

    // Create the restored policy data
    const restoredPolicyData = {
      _id: deletedPolicy.original_policy_id, // Use the original ID
      title: deletedPolicy.title,
      content: deletedPolicy.content,
      description: deletedPolicy.description,
      status: deletedPolicy.status,
      category: deletedPolicy.category,
      pending_changes: deletedPolicy.pending_changes,
      version: deletedPolicy.version,
      created_by: deletedPolicy.created_by._id,
      updated_by: deletedPolicy.updated_by?._id,
      effective_date: deletedPolicy.effective_date,
      expiry_date: deletedPolicy.expiry_date,
      tags: deletedPolicy.tags,
      organization: deletedPolicy.organization,
      assigned_users: deletedPolicy.assigned_users.map(user => user._id),
      attachments: deletedPolicy.attachments,
      views: deletedPolicy.views
    };

    // Create the restored policy
    const restoredPolicy = new Policy(restoredPolicyData);
    await restoredPolicy.save();

    // Delete the deleted policy record
    await DeletedPolicy.findByIdAndDelete(deletedPolicyId);

    // Populate the restored policy for response
    const populatedPolicy = await Policy.findById(restoredPolicy._id)
      .populate('created_by', 'first_name last_name email')
      .populate('updated_by', 'first_name last_name email')
      .populate('assigned_users', 'first_name last_name email');

    return NextResponse.json({
      success: true,
      message: 'Policy restored successfully',
      data: populatedPolicy
    }, { status: 200 });

  } catch (error) {
    console.error('Error restoring policy:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 