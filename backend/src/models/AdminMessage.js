import mongoose from 'mongoose';

const adminMessageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'announcement', 'maintenance'],
    default: 'info'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  expiresAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
adminMessageSchema.index({ isActive: 1, isGlobal: 1 });
adminMessageSchema.index({ type: 1, createdAt: -1 });
adminMessageSchema.index({ expiresAt: 1 });

// Virtual for checking if message is expired
adminMessageSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for checking if message should be shown
adminMessageSchema.virtual('shouldShow').get(function() {
  return this.isActive && !this.isExpired;
});

// Method to deactivate message
adminMessageSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Method to activate message
adminMessageSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

// Method to extend expiration
adminMessageSchema.methods.extendExpiration = function(days) {
  if (this.expiresAt) {
    this.expiresAt = new Date(this.expiresAt.getTime() + (days * 24 * 60 * 60 * 1000));
  } else {
    this.expiresAt = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
  }
  return this.save();
};

// Static method to create global announcement
adminMessageSchema.statics.createGlobalAnnouncement = function(creatorId, title, message, type = 'announcement') {
  return this.create({
    title,
    message,
    type,
    isGlobal: true,
    createdBy: creatorId
  });
};

// Static method to create targeted message
adminMessageSchema.statics.createTargetedMessage = function(creatorId, title, message, targetUsers, type = 'info') {
  return this.create({
    title,
    message,
    type,
    isGlobal: false,
    targetUsers,
    createdBy: creatorId
  });
};

// Static method to get active global messages
adminMessageSchema.statics.getActiveGlobalMessages = function() {
  return this.find({
    isActive: true,
    isGlobal: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  }).sort({ createdAt: -1 });
};

// Static method to get active messages for user
adminMessageSchema.statics.getActiveMessagesForUser = function(userId) {
  return this.find({
    isActive: true,
    $or: [
      { isGlobal: true },
      { targetUsers: userId }
    ],
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  }).sort({ createdAt: -1 });
};

// Static method to get message statistics
adminMessageSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        activeCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$isActive', true] }, { $or: [{ $eq: ['$expiresAt', null] }, { $gt: ['$expiresAt', new Date()] }] }] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

// Static method to cleanup expired messages
adminMessageSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    {
      expiresAt: { $lt: new Date() },
      isActive: true
    },
    {
      isActive: false
    }
  );
};

const AdminMessage = mongoose.model('AdminMessage', adminMessageSchema);

export default AdminMessage; 