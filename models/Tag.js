import mongoose from 'mongoose';

const TagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tag name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Tag name cannot be more than 50 characters']
  },
  color: {
    type: String,
    default: '#6c757d', // Default gray color
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Color must be a valid hex color code'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  usage_count: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient searching
TagSchema.index({ name: 'text' });

// Static method to find or create a tag
TagSchema.statics.findOrCreate = async function(tagName, userId) {
  const tag = await this.findOne({ name: tagName.toLowerCase().trim() });
  
  if (tag) {
    return tag;
  }
  
  // Create new tag
  const newTag = new this({
    name: tagName.toLowerCase().trim(),
    created_by: userId
  });
  
  return await newTag.save();
};

// Static method to increment usage count
TagSchema.statics.incrementUsage = async function(tagId) {
  return await this.findByIdAndUpdate(
    tagId,
    { $inc: { usage_count: 1 } },
    { new: true }
  );
};

// Static method to decrement usage count
TagSchema.statics.decrementUsage = async function(tagId) {
  return await this.findByIdAndUpdate(
    tagId,
    { $inc: { usage_count: -1 } },
    { new: true }
  );
};

// Static method to search tags
TagSchema.statics.searchTags = async function(query, limit = 20) {
  return await this.find({
    $and: [
      { is_active: true },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  })
  .sort({ usage_count: -1, name: 1 })
  .limit(limit);
};

// Prevent mongoose from creating the model multiple times
const Tag = mongoose.models.Tag || mongoose.model('Tag', TagSchema);

export default Tag; 