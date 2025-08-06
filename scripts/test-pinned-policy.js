import mongoose from 'mongoose';
import UserPinnedPolicy from '../models/UserPinnedPolicy.js';
import User from '../models/User.js';
import dbConnect from '../components/lib/mongodb.js';

async function testPinnedPolicy() {
  try {
    console.log('Testing UserPinnedPolicy model...');
    
    // Connect to database
    await dbConnect();
    
    // Wait a bit for connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find a user
    const user = await User.findOne({});
    if (!user) {
      console.log('No users found in database');
      return;
    }
    
    console.log('Found user:', user.email, user._id);
    
    // Check if user has pinned policies
    const userPinnedPolicies = await UserPinnedPolicy.findOne({ userId: user._id });
    console.log('User pinned policies:', userPinnedPolicies);
    
    if (userPinnedPolicies) {
      console.log('Pinned policies count:', userPinnedPolicies.pinnedPolicies.length);
      console.log('Pinned policies structure:', userPinnedPolicies.pinnedPolicies);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testPinnedPolicy(); 