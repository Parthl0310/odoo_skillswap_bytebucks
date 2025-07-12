import { User, SwapRequest, Feedback, Notification, AdminMessage } from './types';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'demo@skillswap.com',
    name: 'Marc Demo',
    location: 'San Francisco, CA',
    photo: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
    skillsOffered: ['JavaScript', 'Python'],
    skillsWanted: ['Photoshop', 'Graphic Design'],
    availability: 'evenings',
    isPublic: true,
    isAdmin: false,
    isBanned: false,
    joinedAt: new Date('2024-01-15'),
    rating: 3.9,
    reviewCount: 12
  },
  {
    id: '2',
    email: 'admin@skillswap.com',
    name: 'Sarah Admin',
    location: 'New York, NY',
    photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
    skillsOffered: ['Project Management', 'Leadership'],
    skillsWanted: ['Digital Marketing', 'SEO'],
    availability: 'flexible',
    isPublic: true,
    isAdmin: true,
    isBanned: false,
    joinedAt: new Date('2023-12-01'),
    rating: 4.9,
    reviewCount: 25
  },
  {
    id: '3',
    email: 'michell@example.com',
    name: 'Michell',
    location: 'Austin, TX',
    photo: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150',
    skillsOffered: ['JavaScript', 'Python'],
    skillsWanted: ['Photoshop', 'Graphic Design'],
    availability: 'weekends',
    isPublic: true,
    isAdmin: false,
    isBanned: false,
    joinedAt: new Date('2024-02-10'),
    rating: 2.5,
    reviewCount: 8
  },
  {
    id: '4',
    email: 'joe@example.com',
    name: 'Joe Wills',
    location: 'Seattle, WA',
    photo: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    skillsOffered: ['JavaScript', 'Python'],
    skillsWanted: ['Photoshop', 'Graphic Design'],
    availability: 'weekdays',
    isPublic: true,
    isAdmin: false,
    isBanned: false,
    joinedAt: new Date('2024-01-20'),
    rating: 4.0,
    reviewCount: 15
  }
];

export const mockSwapRequests: SwapRequest[] = [
  {
    id: '1',
    fromUserId: '1',
    toUserId: '3',
    skillOffered: 'JavaScript',
    skillWanted: 'Python',
    message: 'Hi! I\'d love to learn Python from you. I can teach you modern JavaScript in return.',
    status: 'pending',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01')
  }
];

export const mockFeedback: Feedback[] = [];
export const mockNotifications: Notification[] = [];
export const mockAdminMessages: AdminMessage[] = [];