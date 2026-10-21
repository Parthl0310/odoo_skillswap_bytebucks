import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, SwapRequest, Feedback, Notification, AdminMessage } from '../types';
import realtimeService from '../services/realtime';
import apiService from '../services/api';
import { useAuth } from './AuthContext';

interface DataContextType {
  users: User[];
  swapRequests: SwapRequest[];
  feedback: Feedback[];
  notifications: Notification[];
  adminMessages: AdminMessage[];
  createSwapRequest: (request: Omit<SwapRequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSwapRequest: (id: string, updates: Partial<SwapRequest>) => Promise<void>;
  acceptSwapRequest: (id: string) => Promise<void>;
  rejectSwapRequest: (id: string) => Promise<void>;
  completeSwapRequest: (id: string) => Promise<void>;
  deleteSwapRequest: (id: string) => Promise<void>;
  addFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt'>) => void;
  submitFeedback: (swapId: string, rating: number, comment?: string) => Promise<void>;
  createAdminMessage: (message: Omit<AdminMessage, 'id' | 'createdAt'>) => Promise<void>;
  banUser: (userId: string) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  moderateUserSkills: (userId: string, data: { skillsOffered?: string[]; skillsWanted?: string[]; reason?: string }) => Promise<void>;
  exportReport: () => Promise<any>;
  exportReportCSV: (type?: 'users' | 'swaps' | 'feedback') => Promise<string>;
  refreshData: () => Promise<void>;
  updateProfile: (data: Partial<User> | FormData) => Promise<{ success: boolean; error?: string; user?: User }>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  unreadNotificationsCount: number;
  isRealtimeConnected: boolean;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const mapUser = (u: any): User => ({
  id: u._id || u.id,
  email: u.email,
  name: u.name,
  location: u.location || '',
  photo: u.photo || null,
  skillsOffered: u.skillsOffered || [],
  skillsWanted: u.skillsWanted || [],
  availability: u.availability || 'flexible',
  isPublic: u.isPublic ?? true,
  isAdmin: !!u.isAdmin,
  isBanned: !!u.isBanned,
  joinedAt: new Date(u.createdAt || u.joinedAt || Date.now()),
  rating: u.rating || 0,
  reviewCount: u.reviewCount || 0,
});

const mapSwapRequest = (s: any): SwapRequest => ({
  id: s._id || s.id,
  fromUserId: typeof s.fromUserId === 'object' && s.fromUserId ? (s.fromUserId._id || s.fromUserId.id) : s.fromUserId,
  toUserId: typeof s.toUserId === 'object' && s.toUserId ? (s.toUserId._id || s.toUserId.id) : s.toUserId,
  rawFromUser: typeof s.fromUserId === 'object' ? s.fromUserId : undefined,
  rawToUser: typeof s.toUserId === 'object' ? s.toUserId : undefined,
  skillOffered: s.skillOffered,
  skillWanted: s.skillWanted,
  message: s.message,
  status: s.status,
  createdAt: new Date(s.createdAt),
  updatedAt: new Date(s.updatedAt || s.createdAt),
  completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
  feedback: s.feedback,
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refresh live data from the backend
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1. Always fetch public users list from live backend (no token required)
      try {
        const usersRes = await apiService.getUsers({ limit: 100 }) as any;
        if (usersRes?.success && Array.isArray(usersRes.data?.users)) {
          const fetchedUsers = usersRes.data.users.map(mapUser);
          setUsers(fetchedUsers);
        }
      } catch (err) {
        console.error('Error fetching live users:', err);
      }

      // 2. If authenticated, fetch user-specific data
      if (apiService.getToken()) {
        try {
          const swapsRes = await apiService.getSwapRequests({ limit: 100 }) as any;
          if (swapsRes?.success && Array.isArray(swapsRes.data?.swapRequests)) {
            const fetchedSwaps = swapsRes.data.swapRequests.map(mapSwapRequest);
            setSwapRequests(fetchedSwaps);

            // Also add any populated users from the swaps to users list if not already there
            const populatedUsers: User[] = [];
            swapsRes.data.swapRequests.forEach((s: any) => {
              if (s.fromUserId && typeof s.fromUserId === 'object' && (s.fromUserId._id || s.fromUserId.id)) {
                populatedUsers.push(mapUser(s.fromUserId));
              }
              if (s.toUserId && typeof s.toUserId === 'object' && (s.toUserId._id || s.toUserId.id)) {
                populatedUsers.push(mapUser(s.toUserId));
              }
            });

            if (populatedUsers.length > 0) {
              setUsers(prev => {
                const existingIds = new Set(prev.map(u => u.id));
                const newUsers = populatedUsers.filter(u => !existingIds.has(u.id));
                return [...prev, ...newUsers];
              });
            }
          }
        } catch (err) {
          console.error('Error fetching swaps:', err);
        }

        // Fetch admin messages if available
        try {
          const msgRes = await apiService.getAdminMessages({ limit: 50 }) as any;
          if (msgRes?.success && msgRes.data?.messages) {
            setAdminMessages(msgRes.data.messages.map((m: any) => ({
              id: m._id,
              title: m.title,
              message: m.message,
              type: m.type,
              createdAt: new Date(m.createdAt),
              isActive: m.isActive ?? true,
            })));
          }
        } catch {
          // Non-admin or messages not available
        }

        // Fetch live notifications
        try {
          const notifRes = await apiService.getNotifications() as any;
          if (notifRes?.success && notifRes.data?.notifications) {
            setNotifications(notifRes.data.notifications.map((n: any) => ({
              id: n._id || n.id,
              userId: n.userId,
              type: n.type,
              title: n.title,
              message: n.message,
              isRead: n.isRead,
              createdAt: new Date(n.createdAt),
              relatedId: n.relatedId,
            })));
          }
        } catch {
          // Notifications endpoint optional
        }
      }
    } catch (error) {
      console.error('Error refreshing data from API:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch live public data on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Initialize real-time connection and load live data when user logs in
  useEffect(() => {
    if (user?.id) {
      refreshData();
      realtimeService.connect(user.id);
      setIsRealtimeConnected(realtimeService.getConnectionStatus());

      // Set up real-time event listeners
      realtimeService.onNewSwapRequest((data) => {
        const newSwapRequest = mapSwapRequest(data.swapRequest);
        setSwapRequests(prev => [newSwapRequest, ...prev.filter(r => r.id !== newSwapRequest.id)]);
        setNotifications(prev => [{
          id: `swap-req-${Date.now()}`,
          userId: user.id,
          type: 'swap_request',
          title: 'New Swap Request!',
          message: `${data.fromUser?.name || 'Someone'} requested to swap skills with you.`,
          isRead: false,
          createdAt: new Date(),
          relatedId: data.swapRequest?._id
        }, ...prev]);
      });

      realtimeService.onSwapRequestUpdated((data) => {
        const updated = mapSwapRequest(data.swapRequest);
        setSwapRequests(prev => prev.map(req => (req.id === updated.id ? updated : req)));
        setNotifications(prev => [{
          id: `swap-upd-${Date.now()}`,
          userId: user.id,
          type: 'swap_accepted',
          title: `Swap Request ${data.action || 'Updated'}`,
          message: `Your swap with ${data.updatedBy?.name || 'a partner'} was ${data.action || 'updated'}.`,
          isRead: false,
          createdAt: new Date(),
          relatedId: data.swapRequest?._id
        }, ...prev]);
      });

      realtimeService.onNewMessageNotification((data: any) => {
        setNotifications(prev => [{
          id: `msg-${Date.now()}`,
          userId: user.id,
          type: 'swap_request',
          title: `New Message from ${data.fromUser?.name || 'Partner'}`,
          message: data.message?.text || 'Sent you a chat message',
          isRead: false,
          createdAt: new Date(),
          relatedId: data.swapId,
        }, ...prev]);
      });

      realtimeService.onUserUpdated((data: any) => {
        if (data?.user) {
          const updatedUser = mapUser(data.user);
          setUsers(prev => {
            const index = prev.findIndex(u => u.id === updatedUser.id);
            if (index !== -1) {
              const next = [...prev];
              next[index] = updatedUser;
              return next;
            } else if (updatedUser.isPublic && !updatedUser.isBanned) {
              return [updatedUser, ...prev];
            }
            return prev;
          });
        }
      });

      // Cleanup on unmount
      return () => {
        realtimeService.disconnect();
        setIsRealtimeConnected(false);
      };
    }
  }, [user?.id, refreshData]);

  const createSwapRequest = async (request: Omit<SwapRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      const response = await apiService.createSwapRequest({
        toUserId: request.toUserId,
        skillOffered: request.skillOffered,
        skillWanted: request.skillWanted,
        message: request.message
      }) as any;

      if (response.success && response.data?.swapRequest) {
        const newRequest = mapSwapRequest(response.data.swapRequest);
        setSwapRequests(prev => [newRequest, ...prev]);
      }
    } catch (error) {
      console.error('Error creating swap request:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSwapRequest = async (id: string, updates: Partial<SwapRequest>) => {
    setSwapRequests(prev => prev.map(req => 
      req.id === id ? { ...req, ...updates, updatedAt: new Date() } : req
    ));
  };

  const acceptSwapRequest = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.acceptSwapRequest(id) as any;
      if (response.success) {
        setSwapRequests(prev => prev.map(req => 
          req.id === id ? { ...req, status: 'accepted', updatedAt: new Date() } : req
        ));
      }
    } catch (error) {
      console.error('Error accepting swap request:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectSwapRequest = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.rejectSwapRequest(id) as any;
      if (response.success) {
        setSwapRequests(prev => prev.map(req => 
          req.id === id ? { ...req, status: 'rejected', updatedAt: new Date() } : req
        ));
      }
    } catch (error) {
      console.error('Error rejecting swap request:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeSwapRequest = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.completeSwapRequest(id) as any;
      if (response.success) {
        setSwapRequests(prev => prev.map(req => 
          req.id === id ? { ...req, status: 'completed', completedAt: new Date(), updatedAt: new Date() } : req
        ));
      }
    } catch (error) {
      console.error('Error completing swap request:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSwapRequest = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.cancelSwapRequest(id) as any;
      if (response.success) {
        setSwapRequests(prev => prev.filter(req => req.id !== id));
      }
    } catch (error) {
      console.error('Error deleting swap request:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addFeedback = (feedbackData: Omit<Feedback, 'id' | 'createdAt'>) => {
    const newFeedback: Feedback = {
      ...feedbackData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setFeedback(prev => [...prev, newFeedback]);
  };

  const submitFeedback = async (swapId: string, rating: number, comment?: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.addFeedback(swapId, { rating, comment }) as any;
      if (response.success) {
        if (response.data?.swapRequest) {
          const updated = mapSwapRequest(response.data.swapRequest);
          setSwapRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
        }
        await refreshData();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createAdminMessage = async (message: Omit<AdminMessage, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      const res = await apiService.createAdminMessage({
        title: message.title,
        message: message.message,
        type: message.type,
        isGlobal: true,
      }) as any;
      if (res.success && res.data?.adminMessage) {
        const msg = res.data.adminMessage;
        setAdminMessages(prev => [{
          id: msg._id,
          title: msg.title,
          message: msg.message,
          type: msg.type,
          createdAt: new Date(msg.createdAt),
          isActive: msg.isActive ?? true
        }, ...prev]);
      }
    } catch (err) {
      console.error('Error creating admin message:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const banUser = async (userId: string) => {
    try {
      await apiService.banUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: true } : u));
    } catch (err) {
      console.error('Error banning user:', err);
      throw err;
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      await apiService.unbanUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: false } : u));
    } catch (err) {
      console.error('Error unbanning user:', err);
      throw err;
    }
  };

  const moderateUserSkills = async (userId: string, data: { skillsOffered?: string[]; skillsWanted?: string[]; reason?: string }) => {
    try {
      setIsLoading(true);
      const res = await apiService.moderateUserSkills(userId, data) as any;
      if (res.success && res.data?.user) {
        const updated = mapUser(res.data.user);
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      }
    } catch (err) {
      console.error('Error moderating skills:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      return await apiService.exportAdminReport();
    } catch (err) {
      console.error('Error exporting report:', err);
      throw err;
    }
  };

  const exportReportCSV = async (type: 'users' | 'swaps' | 'feedback' = 'users') => {
    try {
      return await apiService.exportAdminReportCSV(type);
    } catch (err) {
      console.error('Error exporting CSV report:', err);
      throw err;
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  return (
    <DataContext.Provider value={{
      users,
      swapRequests,
      feedback,
      notifications,
      adminMessages,
      createSwapRequest,
      updateSwapRequest,
      acceptSwapRequest,
      rejectSwapRequest,
      completeSwapRequest,
      deleteSwapRequest,
      addFeedback,
      submitFeedback,
      createAdminMessage,
      banUser,
      unbanUser,
      moderateUserSkills,
      exportReport,
      exportReportCSV,
      refreshData,
      updateProfile,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      unreadNotificationsCount,
      isRealtimeConnected,
      isLoading
    }}>
      {children}
    </DataContext.Provider>
  );
};