export interface User {
  id: string;
  email: string;
  name: string;
  location?: string;
  photo?: string;
  skillsOffered: string[];
  skillsWanted: string[];
  availability: 'weekdays' | 'weekends' | 'evenings' | 'flexible';
  isPublic: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  joinedAt: Date;
  rating: number;
  reviewCount: number;
}

export interface SwapRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  skillOffered: string;
  skillWanted: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  feedback?: {
    fromUserRating?: number;
    fromUserComment?: string;
    toUserRating?: number;
    toUserComment?: string;
  };
}

export interface Feedback {
  id: string;
  swapRequestId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'swap_request' | 'swap_accepted' | 'swap_rejected' | 'swap_completed' | 'admin_message';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  relatedId?: string;
}

export interface AdminMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'announcement';
  createdAt: Date;
  isActive: boolean;
}