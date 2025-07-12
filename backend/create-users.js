import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const users = [
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
    rating: 4.5,
    reviewCount: 11
  }
];

async function createUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillswap');
    console.log('Connected to MongoDB');

    // Clear existing users (optional - remove this if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    // Create users
    for (const userData of users) {
      try {
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`User ${userData.email} already exists, skipping...`);
          continue;
        }

        const user = new User(userData);
        await user.save();
        console.log(`✅ Created user: ${userData.name} (${userData.email})`);
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log('\n🎉 User creation completed!');
    
    // Display all users
    const allUsers = await User.find({}).select('name email location skillsOffered skillsWanted rating reviewCount');
    console.log('\n📋 All users in database:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Location: ${user.location || 'Not specified'}`);
      console.log(`   Skills Offered: ${user.skillsOffered.join(', ') || 'None'}`);
      console.log(`   Skills Wanted: ${user.skillsWanted.join(', ') || 'None'}`);
      console.log(`   Rating: ${user.rating}/5 (${user.reviewCount} reviews)`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createUsers(); 