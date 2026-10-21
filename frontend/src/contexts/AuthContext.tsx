import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import apiService from '../services/api';



interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User> | FormData) => Promise<{ success: boolean; error?: string; user?: User }>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    // If there is a token but no saved user loaded yet, stay in loading state
    return Boolean(token && !savedUser);
  });

  useEffect(() => {
    const token = apiService.getToken();
    if (token) {
      apiService.getCurrentUser()
        .then((response) => {
          if (response?.data?.user) {
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
        })
        .catch((error: any) => {
          console.warn('Session verification notice:', error?.message);
          // Only clear session if the server definitively rejected the token with 401
          if (error?.status === 401 || error?.message?.includes('401') || error?.message?.toLowerCase().includes('not authorized')) {
            apiService.clearToken();
            localStorage.removeItem('user');
            setUser(null);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const response = await apiService.login({ email, password });
      const { user, token } = response.data;
      
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      apiService.setToken(token);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);
      setIsLoading(false);
      return {
        success: false,
        error: error.message || 'Login failed. Please check your credentials.'
      };
    }
  };

  const register = async (userData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const response = await apiService.register(userData);
      const { user, token } = response.data;
      
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      apiService.setToken(token);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error('Registration failed:', error);
      setIsLoading(false);
      return {
        success: false,
        error: error.message || 'Registration failed. Please check your information.'
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    apiService.clearToken();
  };

  const updateProfile = async (data: Partial<User> | FormData): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const response = await apiService.updateProfile(data);
      if (response.success && response.data?.user) {
        const u = response.data.user;
        const mappedUser: User = {
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
          joinedAt: new Date(u.joinedAt || u.createdAt || Date.now()),
          rating: u.rating || 0,
          reviewCount: u.reviewCount || 0,
        };
        setUser(mappedUser);
        localStorage.setItem('user', JSON.stringify(mappedUser));
        return { success: true, user: mappedUser };
      }
      return { success: false, error: response.message || 'Failed to update profile' };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message || 'Failed to update profile' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      updateProfile,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};