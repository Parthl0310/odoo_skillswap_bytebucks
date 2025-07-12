import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SwapRequest, Feedback, Notification, AdminMessage } from '../types';
import { mockUsers, mockSwapRequests, mockFeedback, mockNotifications, mockAdminMessages } from '../data';
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
  addFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt'>) => void;
  createAdminMessage: (message: Omit<AdminMessage, 'id' | 'createdAt'>) => void;
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(mockSwapRequests);
  const [feedback, setFeedback] = useState<Feedback[]>(mockFeedback);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>(mockAdminMessages);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize real-time connection when user is available
  useEffect(() => {
    if (user?.id) {
      realtimeService.connect(user.id);
      setIsRealtimeConnected(realtimeService.getConnectionStatus());

      // Set up real-time event listeners
      realtimeService.onNewSwapRequest((data) => {
        const newSwapRequest: SwapRequest = {
          id: data.swapRequest._id,
          fromUserId: data.swapRequest.fromUserId._id,
          toUserId: data.swapRequest.toUserId._id,
          skillOffered: data.swapRequest.skillOffered,
          skillWanted: data.swapRequest.skillWanted,
          message: data.swapRequest.message,
          status: data.swapRequest.status,
          createdAt: new Date(data.swapRequest.createdAt),
          updatedAt: new Date(data.swapRequest.updatedAt),
          completedAt: data.swapRequest.completedAt ? new Date(data.swapRequest.completedAt) : undefined,
          feedback: data.swapRequest.feedback
        };

        setSwapRequests(prev => [newSwapRequest, ...prev]);
      });

      realtimeService.onSwapRequestUpdated((data) => {
        setSwapRequests(prev => prev.map(req => {
          if (req.id === data.swapRequest._id) {
            return {
              ...req,
              status: data.swapRequest.status,
              updatedAt: new Date(data.swapRequest.updatedAt),
              completedAt: data.swapRequest.completedAt ? new Date(data.swapRequest.completedAt) : req.completedAt,
              feedback: data.swapRequest.feedback
            };
          }
          return req;
        }));
      });

      // Cleanup on unmount
      return () => {
        realtimeService.disconnect();
        setIsRealtimeConnected(false);
      };
    }
  }, [user?.id]);

  const createSwapRequest = async (request: Omit<SwapRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      const response = await apiService.createSwapRequest({
        toUserId: request.toUserId,
        skillOffered: request.skillOffered,
        skillWanted: request.skillWanted,
        message: request.message
      }) as any;

      if (response.success) {
        const newRequest: SwapRequest = {
          ...request,
          id: response.data.swapRequest._id,
          createdAt: new Date(response.data.swapRequest.createdAt),
          updatedAt: new Date(response.data.swapRequest.updatedAt),
          status: response.data.swapRequest.status,
          completedAt: response.data.swapRequest.completedAt ? new Date(response.data.swapRequest.completedAt) : undefined,
          feedback: response.data.swapRequest.feedback
        };
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
        setSwapRequests(prev => prev.map(req => {
          if (req.id === id) {
            return {
              ...req,
              status: 'accepted',
              updatedAt: new Date()
            };
          }
          return req;
        }));
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
        setSwapRequests(prev => prev.map(req => {
          if (req.id === id) {
            return {
              ...req,
              status: 'rejected',
              updatedAt: new Date()
            };
          }
          return req;
        }));
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
        setSwapRequests(prev => prev.map(req => {
          if (req.id === id) {
            return {
              ...req,
              status: 'completed',
              updatedAt: new Date(),
              completedAt: new Date()
            };
          }
          return req;
        }));
      }
    } catch (error) {
      console.error('Error completing swap request:', error);
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

  const createAdminMessage = (message: Omit<AdminMessage, 'id' | 'createdAt'>) => {
    const newMessage: AdminMessage = {
      ...message,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setAdminMessages(prev => [...prev, newMessage]);
  };

  const banUser = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, isBanned: true } : user
    ));
  };

  const unbanUser = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, isBanned: false } : user
    ));
  };

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
      addFeedback,
      createAdminMessage,
      banUser,
      unbanUser,
      isRealtimeConnected,
      isLoading
    }}>
      {children}
    </DataContext.Provider>
  );
};