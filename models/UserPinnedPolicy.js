const mongoose = require('mongoose');

const UserPinnedPolicySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  pinnedPolicies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
UserPinnedPolicySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.UserPinnedPolicy || mongoose.model('UserPinnedPolicy', UserPinnedPolicySchema); 