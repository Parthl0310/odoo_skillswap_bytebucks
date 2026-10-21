import mongoose from 'mongoose';
import User from './src/models/User.js';
import SwapRequest from './src/models/SwapRequest.js';
import Message from './src/models/Message.js';
import AdminMessage from './src/models/AdminMessage.js';
import Notification from './src/models/Notification.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const usersData = [
  {
    email: 'admin@skillswap.com',
    password: 'password123',
    name: 'Platform Administrator',
    location: 'San Francisco, CA',
    photo: 'https://picsum.photos/200/200?random=10',
    skillsOffered: ['System Administration', 'Platform Moderation', 'Quality Assurance'],
    skillsWanted: ['User Feedback', 'Community Management'],
    availability: 'weekdays',
    isPublic: true,
    isAdmin: true,
    rating: 5.0,
    reviewCount: 30
  },
  {
    email: 'sarah.johnson@skillswap.com',
    password: 'password123',
    name: 'Sarah Johnson',
    location: 'New York, NY',
    photo: 'https://picsum.photos/200/200?random=1',
    skillsOffered: ['JavaScript', 'React', 'Web Development', 'UI/UX Design'],
    skillsWanted: ['Python', 'Data Science', 'Machine Learning'],
    availability: 'weekends',
    isPublic: true,
    isAdmin: false,
    rating: 4.8,
    reviewCount: 12
  },
  {
    email: 'mike.chen@skillswap.com',
    password: 'password123',
    name: 'Mike Chen',
    location: 'San Francisco, CA',
    photo: 'https://picsum.photos/200/200?random=2',
    skillsOffered: ['Python', 'Data Science', 'Machine Learning', 'SQL'],
    skillsWanted: ['JavaScript', 'React', 'Mobile Development'],
    availability: 'weekdays',
    isPublic: true,
    isAdmin: false,
    rating: 4.9,
    reviewCount: 18
  },
  {
    email: 'emma.rodriguez@skillswap.com',
    password: 'password123',
    name: 'Emma Rodriguez',
    location: 'Austin, TX',
    photo: 'https://picsum.photos/200/200?random=3',
    skillsOffered: ['Graphic Design', 'Illustration', 'Branding', 'Adobe Creative Suite'],
    skillsWanted: ['Photography', 'Video Editing', 'Social Media Marketing'],
    availability: 'flexible',
    isPublic: true,
    isAdmin: false,
    rating: 4.7,
    reviewCount: 9
  },
  {
    email: 'david.kim@skillswap.com',
    password: 'password123',
    name: 'David Kim',
    location: 'Seattle, WA',
    photo: 'https://picsum.photos/200/200?random=4',
    skillsOffered: ['Mobile Development', 'iOS', 'Android', 'Swift', 'Kotlin'],
    skillsWanted: ['Web Development', 'JavaScript', 'React Native'],
    availability: 'evenings',
    isPublic: true,
    isAdmin: false,
    rating: 4.6,
    reviewCount: 15
  },
  {
    email: 'lisa.thompson@skillswap.com',
    password: 'password123',
    name: 'Lisa Thompson',
    location: 'Chicago, IL',
    photo: 'https://picsum.photos/200/200?random=5',
    skillsOffered: ['Photography', 'Video Editing', 'Content Creation', 'Social Media Marketing'],
    skillsWanted: ['Graphic Design', 'Illustration', 'Digital Marketing'],
    availability: 'weekends',
    isPublic: true,
    isAdmin: false,
    rating: 4.5,
    reviewCount: 11
  }
];

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillswap';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Upsert or create users
    const userMap = {};
    for (const userData of usersData) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = new User(userData);
        await user.save();
        console.log(`👤 Created user: ${user.name} (${user.email}) [Admin: ${user.isAdmin}]`);
      } else {
        user.name = userData.name;
        user.location = userData.location;
        user.skillsOffered = userData.skillsOffered;
        user.skillsWanted = userData.skillsWanted;
        user.availability = userData.availability;
        user.isPublic = userData.isPublic;
        user.isAdmin = userData.isAdmin;
        user.rating = userData.rating;
        user.reviewCount = userData.reviewCount;
        if (userData.photo && !user.photo) user.photo = userData.photo;
        user.password = userData.password;
        await user.save();
        console.log(`🔄 Updated user: ${user.name} (${user.email}) [Admin: ${user.isAdmin}]`);
      }
      userMap[userData.email] = user;
    }

    const admin = userMap['admin@skillswap.com'];
    const sarah = userMap['sarah.johnson@skillswap.com'];
    const mike = userMap['mike.chen@skillswap.com'];
    const emma = userMap['emma.rodriguez@skillswap.com'];
    const david = userMap['david.kim@skillswap.com'];
    const lisa = userMap['lisa.thompson@skillswap.com'];

    // Seed Admin Global Announcement
    const existingMsg = await AdminMessage.findOne({ title: 'Welcome to Skill Swap 2026!' });
    if (!existingMsg && admin) {
      await AdminMessage.create({
        title: 'Welcome to Skill Swap 2026!',
        message: 'Explore our reciprocal skill matching, connect with partners via real-time chat, and leave feedback after completing your swap sessions.',
        type: 'announcement',
        isActive: true,
        isGlobal: true,
        createdBy: admin._id
      });
      console.log('📢 Created admin announcement broadcast');
    }

    // Seed Sample Swap Requests
    // 1. Pending Swap: Sarah -> Mike
    let pendingSwap = await SwapRequest.findOne({ fromUserId: sarah._id, toUserId: mike._id, status: 'pending' });
    if (!pendingSwap) {
      pendingSwap = await SwapRequest.create({
        fromUserId: sarah._id,
        toUserId: mike._id,
        skillOffered: 'React',
        skillWanted: 'Python',
        message: 'Hi Mike! Would love to trade React frontend tutoring for Python data science tips.',
        status: 'pending'
      });
      console.log('⏳ Created sample Pending swap: Sarah -> Mike (React for Python)');
    }

    // 2. Accepted Swap: Emma -> Lisa
    let acceptedSwap = await SwapRequest.findOne({ fromUserId: emma._id, toUserId: lisa._id, status: 'accepted' });
    if (!acceptedSwap) {
      acceptedSwap = await SwapRequest.create({
        fromUserId: emma._id,
        toUserId: lisa._id,
        skillOffered: 'Graphic Design',
        skillWanted: 'Photography',
        message: 'Hey Lisa! Excited to swap branding guidelines for Lightroom editing tricks.',
        status: 'accepted'
      });
      console.log('🤝 Created sample Accepted swap: Emma -> Lisa (Graphic Design for Photography)');
    }

    // Seed Chat Messages for Accepted Swap
    if (acceptedSwap) {
      const existingChatCount = await Message.countDocuments({ swapId: acceptedSwap._id });
      if (existingChatCount === 0) {
        await Message.create([
          {
            swapId: acceptedSwap._id,
            senderId: emma._id,
            receiverId: lisa._id,
            text: 'Hi Lisa! Thanks for accepting the swap request! When are you free this week?',
            read: true,
            createdAt: new Date(Date.now() - 3600000 * 3)
          },
          {
            swapId: acceptedSwap._id,
            senderId: lisa._id,
            receiverId: emma._id,
            text: 'Hey Emma! I am free on Thursday evening after 6pm. Does Google Meet or Zoom work for you?',
            read: true,
            createdAt: new Date(Date.now() - 3600000 * 2)
          },
          {
            swapId: acceptedSwap._id,
            senderId: emma._id,
            receiverId: lisa._id,
            text: 'Thursday at 6pm works perfectly! I will prepare our branding review packet.',
            read: false,
            createdAt: new Date(Date.now() - 3600000 * 1)
          }
        ]);
        console.log('💬 Seeded sample real-time chat messages between Emma and Lisa');
      }
    }

    // 3. Completed Swap with Feedback: David -> Sarah
    let completedSwap = await SwapRequest.findOne({ fromUserId: david._id, toUserId: sarah._id, status: 'completed' });
    if (!completedSwap) {
      completedSwap = await SwapRequest.create({
        fromUserId: david._id,
        toUserId: sarah._id,
        skillOffered: 'Mobile Development',
        skillWanted: 'Web Development',
        message: 'Hey Sarah, let us swap iOS development for modern React patterns.',
        status: 'completed',
        completedAt: new Date(Date.now() - 86400000 * 2),
        feedback: {
          fromUserRating: 5,
          fromUserComment: 'Sarah was fantastic at explaining React state and component architecture!',
          toUserRating: 5,
          toUserComment: 'David taught me Swift fundamentals in two sessions. Super patient and clear!'
        }
      });
      console.log('🌟 Created sample Completed swap with 5-star ratings: David -> Sarah');
    }

    // Seed Sample Notifications
    const notifCount = await Notification.countDocuments();
    if (notifCount === 0) {
      await Notification.create([
        {
          userId: mike._id,
          type: 'swap_request',
          title: 'New Swap Proposal',
          message: 'Sarah Johnson proposed a swap: React for Python.',
          relatedId: pendingSwap._id,
          relatedModel: 'SwapRequest'
        },
        {
          userId: emma._id,
          type: 'swap_accepted',
          title: 'Swap Accepted!',
          message: 'Lisa Thompson accepted your Graphic Design for Photography swap request!',
          relatedId: acceptedSwap._id,
          relatedModel: 'SwapRequest'
        },
        {
          userId: sarah._id,
          type: 'admin_message',
          title: 'Welcome to Skill Swap',
          message: 'Welcome to the platform! Explore skills and match with members.',
          relatedId: admin._id,
          relatedModel: 'User'
        }
      ]);
      console.log('🔔 Seeded sample system notifications');
    }

    console.log('\n========================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('========================================');
    console.log('Admin Account: admin@skillswap.com / password123');
    console.log('User Accounts (password123 for all):');
    console.log('  - sarah.johnson@skillswap.com');
    console.log('  - mike.chen@skillswap.com');
    console.log('  - emma.rodriguez@skillswap.com');
    console.log('  - david.kim@skillswap.com');
    console.log('  - lisa.thompson@skillswap.com');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Database seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedDatabase();