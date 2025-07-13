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
    required: [true, 'Policy content is required'],
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
    trim: true
  },
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
  attachments: [{
    filename: String,
    url: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }]
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

// Instance method to check if policy is expired
PolicySchema.methods.isExpired = function() {
  if (!this.expiry_date) return false;
  return new Date() > this.expiry_date;
};

// Prevent mongoose from creating the model multiple times
const Policy = mongoose.models.Policy || mongoose.model('Policy', PolicySchema);

export default Policy; 