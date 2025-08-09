import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  policy_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy',
    required: [true, 'Policy ID is required']
  },
  type: {
    type: String,
    enum: ['policy_created', 'policy_updated', 'policy_assigned'],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  is_read: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
NotificationSchema.index({ user_id: 1, created_at: -1 });
NotificationSchema.index({ user_id: 1, is_read: 1 });

// Static method to create notification for policy creation
NotificationSchema.statics.createPolicyNotification = async function(policyId, type = 'policy_created') {
  const Policy = mongoose.model('Policy');
  const User = mongoose.model('User');
  
  const policy = await Policy.findById(policyId)
    .populate('created_by', 'first_name last_name organization')
    .populate('assigned_users', '_id organization');
  
  if (!policy) return;
  
  // Only create notifications for active (published) policies
  if (policy.status !== 'active') return;
  
  const notifications = [];
  
  // Find all users who should receive notifications
  let eligibleUsers = [];
  
  if (policy.organization === 'all') {
    // If policy is for all organizations, notify all active users except the creator
    eligibleUsers = await User.find({ 
      isActive: true,
      _id: { $ne: policy.created_by._id }
    });
  } else {
    // If policy is for specific organization, notify users in that organization except the creator
    eligibleUsers = await User.find({ 
      organization: policy.organization,
      isActive: true,
      _id: { $ne: policy.created_by._id }
    });
  }
  
  const notificationTitle = `New Policy: ${policy.title}`;
  const notificationMessage = type === 'policy_created' 
    ? `A new policy "${policy.title}" has been published by ${policy.created_by.first_name} ${policy.created_by.last_name}.`
    : `Policy "${policy.title}" has been updated by ${policy.created_by.first_name} ${policy.created_by.last_name}.`;
  
  // Create notifications for eligible users
  for (const user of eligibleUsers) {
    notifications.push({
      user_id: user._id,
      policy_id: policy._id,
      type: type,
      title: notificationTitle,
      message: notificationMessage,
      is_read: false
    });
  }
  
  if (notifications.length > 0) {
    await this.insertMany(notifications);
    console.log(`Created ${notifications.length} notifications for policy: ${policy.title}`);
  }
};

// Static method to mark notification as read
NotificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return await this.findOneAndUpdate(
    { _id: notificationId, user_id: userId },
    { is_read: true },
    { new: true }
  );
};

// Static method to mark all notifications as read for a user
NotificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { user_id: userId, is_read: false },
    { is_read: true }
  );
};

// Static method to get unread count for user
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ user_id: userId, is_read: false });
};

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
export default Notification; 