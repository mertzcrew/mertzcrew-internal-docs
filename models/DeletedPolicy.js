import mongoose from 'mongoose';

const DeletedPolicySchema = new mongoose.Schema({
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
	pending_changes: {
		title: {
		type: String,
		trim: true,
		maxlength: [200, 'Title cannot be more than 200 characters']
		},
		content: {
		type: String,
		trim: true
		},
		description: {
		type: String,
		trim: true,
		maxlength: [500, 'Description cannot be more than 500 characters']
		},
		category: {
		type: String,
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
		organization: {
		type: String,
		trim: true,
		maxlength: [100, 'Organization cannot be more than 100 characters'],
		enum: [
			"all",
			'mertzcrew',
			'mertz_production'
		]
		},
		effective_date: {
		type: Date
		},
		expiry_date: {
		type: Date
		},
		tags: [{
		type: String,
		trim: true
		}]
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
	},
	// Deletion tracking fields
	deleted_by: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Deleted by user is required']
	},
	deleted_at: {
		type: Date,
		default: Date.now
	},
	original_policy_id: {
		type: mongoose.Schema.Types.ObjectId,
		required: [true, 'Original policy ID is required']
	}
}, {
  timestamps: true, // Adds createdAt and updatedAt fields automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});




// Prevent mongoose from creating the model multiple times
const DeletedPolicy = mongoose.models.DeletedPolicy || mongoose.model('DeletedPolicy', DeletedPolicySchema);

export default DeletedPolicy; 