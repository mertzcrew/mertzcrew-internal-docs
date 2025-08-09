import dotenv from 'dotenv';
import dbConnect from '../components/lib/mongodb.js';
import Policy from '../models/Policy.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testNotifications() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Find or create test users
    const testUsers = await User.find({ email: { $in: ['test123@gmail.com', 'janedoe@mertz.us'] } });
    if (testUsers.length < 2) {
      console.log('Need at least 2 test users to run notification tests');
      return;
    }

    const creator = testUsers[0];
    const assignedUser = testUsers[1];

    console.log(`Creator: ${creator.first_name} ${creator.last_name} (${creator.email})`);
    console.log(`Assigned User: ${assignedUser.first_name} ${assignedUser.last_name} (${assignedUser.email})`);

    // Test 1: Create a draft policy with assigned user
    console.log('\n--- Test 1: Creating draft policy with assigned user ---');
    const draftPolicy = new Policy({
      title: 'Test Draft Policy for Notifications',
      content: 'This is a test draft policy content.',
      description: 'Test description',
      category: 'HR',
      organization: 'mertzcrew',
      status: 'draft',
      assigned_users: [creator._id, assignedUser._id],
      created_by: creator._id,
      updated_by: creator._id
    });

    await draftPolicy.save();
    console.log(`Draft policy created: ${draftPolicy.title}`);

    // Create assignment notifications manually (simulating API logic)
    await Notification.createAssignmentNotifications(draftPolicy._id, [assignedUser._id], creator._id);

    // Test 2: Create an active (published) policy
    console.log('\n--- Test 2: Creating published policy ---');
    const publishedPolicy = new Policy({
      title: 'Test Published Policy for Notifications',
      content: 'This is a test published policy content.',
      description: 'Test description',
      category: 'Culture',
      organization: 'all',
      status: 'active',
      assigned_users: [creator._id, assignedUser._id],
      created_by: creator._id,
      updated_by: creator._id
    });

    await publishedPolicy.save();
    console.log(`Published policy created: ${publishedPolicy.title}`);

    // Create both assignment and policy creation notifications
    await Notification.createAssignmentNotifications(publishedPolicy._id, [assignedUser._id], creator._id);
    await Notification.createPolicyNotification(publishedPolicy._id, 'policy_created');

    // Check notifications created
    console.log('\n--- Checking created notifications ---');
    const allNotifications = await Notification.find({})
      .populate('user_id', 'first_name last_name email')
      .populate('policy_id', 'title status')
      .sort({ created_at: -1 });

    console.log(`Total notifications created: ${allNotifications.length}`);
    
    allNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.type} - "${notif.title}" for ${notif.user_id.first_name} ${notif.user_id.last_name}`);
      console.log(`   Policy: ${notif.policy_id.title} (${notif.policy_id.status})`);
      console.log(`   Message: ${notif.message}`);
      console.log(`   Read: ${notif.is_read}`);
      console.log('');
    });

    // Test unread count
    const unreadCount = await Notification.getUnreadCount(assignedUser._id);
    console.log(`Unread notifications for ${assignedUser.first_name}: ${unreadCount}`);

    // Test 3: Delete operations
    console.log('\n--- Test 3: Testing delete operations ---');
    if (allNotifications.length > 0) {
      const firstNotification = allNotifications[0];
      console.log(`Deleting notification: "${firstNotification.title}"`);
      
      const deletedNotification = await Notification.deleteNotification(firstNotification._id, firstNotification.user_id);
      if (deletedNotification) {
        console.log('✓ Single notification deleted successfully');
      } else {
        console.log('✗ Failed to delete notification');
      }

      // Check remaining notifications
      const remainingNotifications = await Notification.find({ user_id: assignedUser._id });
      console.log(`Remaining notifications for ${assignedUser.first_name}: ${remainingNotifications.length}`);

      if (remainingNotifications.length > 0) {
        console.log('Testing delete all notifications...');
        const deleteAllResult = await Notification.deleteAllNotifications(assignedUser._id);
        console.log(`✓ Deleted ${deleteAllResult.deletedCount} notifications`);
      }
    }

    console.log('\n--- Test completed successfully! ---');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testNotifications(); 