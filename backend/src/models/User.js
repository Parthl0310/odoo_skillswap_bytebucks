import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
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
    minlength: [6, 'Password must be at least 6 characters long']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  photo: {
    type: String,
    default: null
  },
  skillsOffered: [{
    type: String,
    trim: true,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  }],
  skillsWanted: [{
    type: String,
    trim: true,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  }],
  availability: {
    type: String,
    enum: ['weekdays', 'weekends', 'evenings', 'flexible'],
    default: 'flexible'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: [0, 'Review count cannot be negative']
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for average rating
userSchema.virtual('averageRating').get(function() {
  return this.reviewCount > 0 ? this.rating : 0;
});

// Index for search functionality
userSchema.index({ 
  name: 'text', 
  skillsOffered: 'text', 
  skillsWanted: 'text',
  location: 'text' 
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Method to update rating
userSchema.methods.updateRating = function(newRating) {
  const totalRating = this.rating * this.reviewCount + newRating;
  this.reviewCount += 1;
  this.rating = totalRating / this.reviewCount;
  return this.save();
};

// Static method to find users by skill
userSchema.statics.findBySkill = function(skill, type = 'offered') {
  const field = type === 'wanted' ? 'skillsWanted' : 'skillsOffered';
  return this.find({
    [field]: { $regex: skill, $options: 'i' },
    isPublic: true,
    isBanned: false
  });
};

// Static method to find users for skill matching
userSchema.statics.findSkillMatches = function(userId) {
  return this.findById(userId).then(user => {
    if (!user) return [];
    
    return this.find({
      _id: { $ne: userId },
      isPublic: true,
      isBanned: false,
      $or: [
        { skillsOffered: { $in: user.skillsWanted } },
        { skillsWanted: { $in: user.skillsOffered } }
      ]
    });
  });
};

const User = mongoose.model('User', userSchema);

export default User; 