import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: ['swap_request', 'swap_accepted', 'swap_rejected', 'swap_completed', 'admin_message', 'feedback_received'],
    required: [true, 'Notification type is required']
  },
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
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel',
    default: null
  },
  relatedModel: {
    type: String,
    enum: ['SwapRequest', 'User', 'AdminMessage'],
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  return this.save();
};

// Static method to create swap request notification
notificationSchema.statics.createSwapRequestNotification = function(toUserId, fromUserId, swapRequestId) {
  return this.create({
    userId: toUserId,
    type: 'swap_request',
    title: 'New Swap Request',
    message: 'You have received a new skill swap request',
    relatedId: swapRequestId,
    relatedModel: 'SwapRequest',
    metadata: { fromUserId }
  });
};

// Static method to create swap accepted notification
notificationSchema.statics.createSwapAcceptedNotification = function(userId, swapRequestId) {
  return this.create({
    userId,
    type: 'swap_accepted',
    title: 'Swap Request Accepted',
    message: 'Your swap request has been accepted',
    relatedId: swapRequestId,
    relatedModel: 'SwapRequest'
  });
};

// Static method to create swap rejected notification
notificationSchema.statics.createSwapRejectedNotification = function(userId, swapRequestId) {
  return this.create({
    userId,
    type: 'swap_rejected',
    title: 'Swap Request Rejected',
    message: 'Your swap request has been rejected',
    relatedId: swapRequestId,
    relatedModel: 'SwapRequest'
  });
};

// Static method to create swap completed notification
notificationSchema.statics.createSwapCompletedNotification = function(userId, swapRequestId) {
  return this.create({
    userId,
    type: 'swap_completed',
    title: 'Swap Completed',
    message: 'Your skill swap has been completed',
    relatedId: swapRequestId,
    relatedModel: 'SwapRequest'
  });
};

// Static method to create admin message notification
notificationSchema.statics.createAdminMessageNotification = function(userId, messageId) {
  return this.create({
    userId,
    type: 'admin_message',
    title: 'Admin Message',
    message: 'You have received a message from the admin',
    relatedId: messageId,
    relatedModel: 'AdminMessage'
  });
};

// Static method to create feedback received notification
notificationSchema.statics.createFeedbackReceivedNotification = function(userId, swapRequestId) {
  return this.create({
    userId,
    type: 'feedback_received',
    title: 'Feedback Received',
    message: 'You have received feedback for a completed swap',
    relatedId: swapRequestId,
    relatedModel: 'SwapRequest'
  });
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, isRead: false });
};

// Static method to mark all notifications as read for user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );
};

// Static method to get notifications for user with pagination
notificationSchema.statics.getForUser = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('relatedId');
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 