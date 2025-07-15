import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Document content is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  is_draft: {
    type: Boolean,
    default: true
  },
  is_published: {
    type: Boolean,
    default: false
  },
  is_archived: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  views: {
    type: Number,
    default: 0
  },
  attachments: [{
    filename: String,
    url: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  version: {
    type: Number,
    default: 1
  },
  published_at: {
    type: Date
  },
  is_featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for search and performance
DocumentSchema.index({ title: 'text', content: 'text', description: 'text', tags: 1 });
DocumentSchema.index({ category: 1 });
DocumentSchema.index({ author: 1 });

// Pre-save middleware to increment version on content/title change
DocumentSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isModified('title')) {
    this.version += 1;
  }
  next();
});

// Static method to find published documents
DocumentSchema.statics.findPublished = function() {
  return this.find({ is_published: true });
};

// Instance method to check if document is featured
DocumentSchema.methods.isFeatured = function() {
  return this.is_featured;
};

const Document = mongoose.models.Document || mongoose.model('Document', DocumentSchema);

export default Document; 