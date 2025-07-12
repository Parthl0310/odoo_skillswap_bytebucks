const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData: any): Promise<{ success: boolean; message: string; data: { user: any; token: string } }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }): Promise<{ success: boolean; message: string; data: { user: any; token: string } }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser(): Promise<{ success: boolean; message: string; data: { user: any } }> {
    return this.request('/auth/me');
  }

  async updateProfile(profileData: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  // User endpoints
  async getUsers(params?: {
    search?: string;
    skill?: string;
    availability?: string;
    location?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    return this.request(`/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
  }

  async getSkillMatches(userId: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    return this.request(`/users/${userId}/skill-matches${queryString ? `?${queryString}` : ''}`);
  }

  async searchUsersBySkill(skill: string, type?: 'offered' | 'wanted', params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams({ skill });
    if (type) queryParams.append('type', type);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/users/search/skills?${queryParams.toString()}`);
  }

  async getPopularSkills() {
    return this.request('/users/stats/popular-skills');
  }

  // Swap endpoints
  async createSwapRequest(swapData: {
    toUserId: string;
    skillOffered: string;
    skillWanted: string;
    message: string;
  }) {
    return this.request('/swaps', {
      method: 'POST',
      body: JSON.stringify(swapData),
    });
  }

  async getSwapRequests(params?: {
    status?: string;
    type?: 'sent' | 'received';
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    return this.request(`/swaps${queryString ? `?${queryString}` : ''}`);
  }

  async getSwapRequest(id: string) {
    return this.request(`/swaps/${id}`);
  }

  async acceptSwapRequest(id: string) {
    return this.request(`/swaps/${id}/accept`, {
      method: 'PUT',
    });
  }

  async rejectSwapRequest(id: string) {
    return this.request(`/swaps/${id}/reject`, {
      method: 'PUT',
    });
  }

  async completeSwapRequest(id: string) {
    return this.request(`/swaps/${id}/complete`, {
      method: 'PUT',
    });
  }

  async cancelSwapRequest(id: string) {
    return this.request(`/swaps/${id}`, {
      method: 'DELETE',
    });
  }

  async getSwapStats() {
    return this.request('/swaps/stats/overview');
  }

  // Feedback endpoints
  async addFeedback(swapId: string, feedbackData: { rating: number; comment?: string }) {
    return this.request(`/feedback/${swapId}`, {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  }

  async getFeedback(swapId: string) {
    return this.request(`/feedback/${swapId}`);
  }

  async getUserFeedback(userId: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    return this.request(`/feedback/user/${userId}${queryString ? `?${queryString}` : ''}`);
  }

  async getFeedbackStats() {
    return this.request('/feedback/stats/overview');
  }

  // Admin endpoints
  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async getAdminUsers(params?: {
    search?: string;
    status?: 'active' | 'banned';
    role?: 'user' | 'admin';
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    return this.request(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  async banUser(userId: string, reason?: string) {
    return this.request(`/admin/users/${userId}/ban`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async unbanUser(userId: string) {
    return this.request(`/admin/users/${userId}/unban`, {
      method: 'PUT',
    });
  }

  async changeUserRole(userId: string, isAdmin: boolean) {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ isAdmin }),
    });
  }

  async getAdminSwaps(params?: { status?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    return this.request(`/admin/swaps${queryString ? `?${queryString}` : ''}`);
  }

  async createAdminMessage(messageData: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'announcement' | 'maintenance';
    isGlobal?: boolean;
    targetUsers?: string[];
    expiresAt?: string;
  }) {
    return this.request('/admin/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getAdminMessages(params?: {
    type?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    return this.request(`/admin/messages${queryString ? `?${queryString}` : ''}`);
  }

  async updateAdminMessage(messageId: string, updateData: any) {
    return this.request(`/admin/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteAdminMessage(messageId: string) {
    return this.request(`/admin/messages/${messageId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export default apiService; 