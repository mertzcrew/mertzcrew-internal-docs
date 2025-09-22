import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  // Authentication fields
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  
  // Profile information
  first_name: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  last_name: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  
  // Role and permissions
  role: {
    type: String,
    enum: ['admin', 'manager', 'associate'],
    default: 'associate'
  },
  permissions: [{
    type: String,
    enum: [
      'create_policy',
      'edit_policy', 
      'delete_policy',
      'view_policy',
      'manage_users',
      'view_analytics',
      'export_data'
    ]
  }],
  organization: {
    type: String,
    required: [true, 'Organization is required'],
    trim: true,
    maxlength: [100, 'Organization cannot be more than 100 characters'],
    enum: [
      'mertzcrew',
      'mertz_production'
    ]
  },

  // Contact information
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  department: {
    type: String,
    trim: true,
    enum: ['tech_team', 'customer_support', 'misc'],
    maxlength: [100, 'Department cannot be more than 100 characters']
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Position cannot be more than 100 characters']
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Profile image
  avatar: {
    type: String,
    default: null
  },
  
  // Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // Last activity tracking
  lastLogin: {
    type: Date,
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ 'preferences.language': 1 });

  // Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if user has permission
UserSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission) || this.role === 'admin';
};

// Instance method to check if user is admin
UserSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Instance method to update last activity
UserSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Static method to find active users
UserSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find users by role
UserSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Static method to find users by department
UserSchema.statics.findByDepartment = function(department) {
  return this.find({ department, isActive: true });
};

// Prevent mongoose from creating the model multiple times
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;


