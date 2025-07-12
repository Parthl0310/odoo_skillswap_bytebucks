import mongoose from 'mongoose';

const swapRequestSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'From user is required']
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'To user is required']
  },
  skillOffered: {
    type: String,
    required: [true, 'Skill offered is required'],
    trim: true,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  },
  skillWanted: {
    type: String,
    required: [true, 'Skill wanted is required'],
    trim: true,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  completedAt: {
    type: Date,
    default: null
  },
  feedback: {
    fromUserRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: null
    },
    fromUserComment: {
      type: String,
      trim: true,
      maxlength: [200, 'Comment cannot exceed 200 characters'],
      default: null
    },
    toUserRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: null
    },
    toUserComment: {
      type: String,
      trim: true,
      maxlength: [200, 'Comment cannot exceed 200 characters'],
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
swapRequestSchema.index({ fromUserId: 1, status: 1 });
swapRequestSchema.index({ toUserId: 1, status: 1 });
swapRequestSchema.index({ status: 1, createdAt: -1 });

// Virtual for checking if both users have provided feedback
swapRequestSchema.virtual('isFeedbackComplete').get(function() {
  return this.feedback.fromUserRating && this.feedback.toUserRating;
});

// Virtual for checking if swap is ready for completion
swapRequestSchema.virtual('isReadyForCompletion').get(function() {
  return this.status === 'accepted' && this.isFeedbackComplete;
});

// Method to accept swap request
swapRequestSchema.methods.accept = function() {
  this.status = 'accepted';
  return this.save();
};

// Method to reject swap request
swapRequestSchema.methods.reject = function() {
  this.status = 'rejected';
  return this.save();
};

// Method to complete swap request
swapRequestSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Method to cancel swap request
swapRequestSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Method to add feedback
swapRequestSchema.methods.addFeedback = function(userId, rating, comment) {
  if (this.fromUserId.toString() === userId.toString()) {
    this.feedback.fromUserRating = rating;
    this.feedback.fromUserComment = comment;
  } else if (this.toUserId.toString() === userId.toString()) {
    this.feedback.toUserRating = rating;
    this.feedback.toUserComment = comment;
  }
  return this.save();
};

// Static method to find pending requests for a user
swapRequestSchema.statics.findPendingForUser = function(userId) {
  return this.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
    status: 'pending'
  }).populate('fromUserId', 'name email photo').populate('toUserId', 'name email photo');
};

// Static method to find accepted swaps for a user
swapRequestSchema.statics.findAcceptedForUser = function(userId) {
  return this.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
    status: 'accepted'
  }).populate('fromUserId', 'name email photo').populate('toUserId', 'name email photo');
};

// Static method to find completed swaps for a user
swapRequestSchema.statics.findCompletedForUser = function(userId) {
  return this.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
    status: 'completed'
  }).populate('fromUserId', 'name email photo').populate('toUserId', 'name email photo');
};

// Static method to get swap statistics
swapRequestSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

const SwapRequest = mongoose.model('SwapRequest', swapRequestSchema);

export default SwapRequest; 