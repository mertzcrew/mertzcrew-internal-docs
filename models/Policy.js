import mongoose from 'mongoose';

const PolicySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Policy title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: function() {
      // Content is required only if there are no attachments
      return !this.attachments || this.attachments.length === 0;
    },
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft'
  },
  category: {
    type: String,
    required: [true, 'Policy category is required'],
    trim: true,
    enum: [
      "HR",
      "Culture",
      "Documentation",
      "Process",
      "Safety",
      "Quality",
      "Other"
    ]
  },
  pending_changes: { type: Object, default: {} },

  // New: whether this policy requires an electronic signature when published
  require_signature: { type: Boolean, default: false },

  // New: when a policy is published (or republished), capture the timestamp
  publish_date: { type: Date, default: null },

  version: {
    type: Number,
    default: 1
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  effective_date: {
    type: Date,
    default: Date.now
  },
  expiry_date: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  organization: { // This is the organization that the policy is for,  all is generic for all organizations
    type: String,
    required: [true, 'Organization is required'],
    trim: true,
    maxlength: [100, 'Organization cannot be more than 100 characters'],
    enum: [
      "all",
      'mertzcrew',
      'mertz_production'
    ]
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department cannot be more than 100 characters'],
    required: false
  },
  assigned_users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  attachments: [{
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    }
  }],
  views: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
PolicySchema.index({ title: 'text', content: 'text' });
PolicySchema.index({ category: 1, status: 1 });
PolicySchema.index({ created_by: 1 });

// Virtual for policy age
PolicySchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual to check if policy has pending changes
PolicySchema.virtual('hasPendingChanges').get(function() {
  return this.pending_changes && Object.keys(this.pending_changes).length > 0;
});

// Pre-save middleware to increment version
PolicySchema.pre('save', function(next) {
  if (this.isModified('content') || this.isModified('title')) {
    this.version += 1;
  }
  next();
});

// Static method to find active policies
PolicySchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find policies with pending changes
PolicySchema.statics.findWithPendingChanges = function() {
  return this.find({
    'pending_changes': { $exists: true, $ne: null },
    $expr: { $gt: [{ $size: { $objectToArray: '$pending_changes' } }, 0] }
  });
};

// Instance method to check if policy is expired
PolicySchema.methods.isExpired = function() {
  if (!this.expiry_date) return false;
  return new Date() > this.expiry_date;
};

// Instance method to save pending changes
PolicySchema.methods.savePendingChanges = function(changes) {
  this.pending_changes = changes;
  return this.save();
};

// Instance method to publish pending changes
PolicySchema.methods.publishPendingChanges = async function() {
  if (!this.pending_changes) {
    throw new Error('No pending changes to publish');
  }

  // Apply pending changes to the main policy fields
  if (this.pending_changes.title) {
    this.title = this.pending_changes.title;
  }
  if (this.pending_changes.content) {
    this.content = this.pending_changes.content;
  }
  if (this.pending_changes.description !== undefined) {
    this.description = this.pending_changes.description;
  }
  if (this.pending_changes.category) {
    this.category = this.pending_changes.category;
  }
  if (this.pending_changes.organization) {
    this.organization = this.pending_changes.organization;
  }
  if (this.pending_changes.effective_date) {
    this.effective_date = this.pending_changes.effective_date;
  }
  if (this.pending_changes.expiry_date !== undefined) {
    this.expiry_date = this.pending_changes.expiry_date;
  }
  if (this.pending_changes.tags) {
    this.tags = this.pending_changes.tags;
  }
  if (typeof this.pending_changes.require_signature === 'boolean') {
    this.require_signature = this.pending_changes.require_signature;
  }
  if (this.pending_changes.attachments) {
    this.attachments = [...this.pending_changes.attachments];
  }

  // Clear pending changes
  this.pending_changes = null;
  
  // Increment version since we're publishing changes
  this.version += 1;

  return this.save();
};

// Instance method to discard pending changes
PolicySchema.methods.discardPendingChanges = function() {
  this.pending_changes = null;
  return this.save();
};

// Prevent mongoose from creating the model multiple times
const Policy = mongoose.models.Policy || mongoose.model('Policy', PolicySchema);

export default Policy; 