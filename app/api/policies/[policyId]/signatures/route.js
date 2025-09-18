import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import dbConnect from '../../../../../components/lib/mongodb';
import Policy from '../../../../../models/Policy';
import mongoose from 'mongoose';

const SignatureSchema = new mongoose.Schema({
  policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy', index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String, required: true, trim: true },
  signedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Signature = mongoose.models.Signature || mongoose.model('Signature', SignatureSchema);

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    // Only allow admin users to view signatures
    if (!session) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
    }

    const { policyId } = await params;
    
    // Verify policy exists
    const policy = await Policy.findById(policyId);
    if (!policy) {
      return NextResponse.json({ success: false, message: 'Policy not found' }, { status: 404 });
    }

    // Get all signatures for this policy with user details
    const signatures = await Signature.find({ policyId: policy._id })
      .populate('userId', 'first_name last_name email department position')
      .sort({ signedAt: -1 }); // Most recent first

    // Format the response
    const formattedSignatures = signatures.map(signature => ({
      _id: signature._id,
      name: signature.name,
      signedAt: signature.signedAt,
      user: {
        _id: signature.userId._id,
        first_name: signature.userId.first_name,
        last_name: signature.userId.last_name,
        email: signature.userId.email,
        department: signature.userId.department,
        position: signature.userId.position
      }
    }));

    return NextResponse.json({ 
      success: true, 
      signatures: formattedSignatures,
      count: formattedSignatures.length,
      policy: {
        title: policy.title,
        require_signature: policy.require_signature
      }
    });

  } catch (error) {
    console.error('Error fetching signatures:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 