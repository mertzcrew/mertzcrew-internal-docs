import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '../../../../../components/lib/mongodb';
import Policy from '../../../../../models/Policy';
import User from '../../../../../models/User';
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
    if (!session) return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });

    const { policyId } = params;
    const policy = await Policy.findById(policyId);
    if (!policy) return NextResponse.json({ success: false, message: 'Policy not found' }, { status: 404 });
    if (policy.status !== 'active' || !policy.require_signature) {
      return NextResponse.json({ hasSigned: false });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    // Check if user has already signed this policy
    const signature = await Signature.findOne({ policyId: policy._id, userId: user._id });
    return NextResponse.json({ hasSigned: !!signature, signature: signature });
  } catch (e) {
    console.error('Error checking signature:', e);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });

    const { policyId } = params;
    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const policy = await Policy.findById(policyId);
    if (!policy) return NextResponse.json({ success: false, message: 'Policy not found' }, { status: 404 });
    if (policy.status !== 'active' || !policy.require_signature) {
      return NextResponse.json({ success: false, message: 'Signature not required for this policy' }, { status: 400 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    // Upsert signature for this user and policy
    await Signature.findOneAndUpdate(
      { policyId: policy._id, userId: user._id },
      { name: name.trim(), signedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, message: 'Signature recorded' });
  } catch (e) {
    console.error('Error recording signature:', e);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
} 