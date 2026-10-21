import { io, Socket } from 'socket.io-client';

class RealtimeService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join user's personal room
      this.socket?.emit('join-user', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected to WebSocket server after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Rejoin user's personal room
      this.socket?.emit('join-user', userId);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`WebSocket reconnection attempt ${attemptNumber}`);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      this.isConnected = false;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Swap Request notifications
  onNewSwapRequest(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('new-swap-request', callback);
  }

  onSwapRequestUpdated(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('swap-request-updated', callback);
  }

  // Live user profile & skill updates
  onUserUpdated(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('user-updated', callback);
  }

  // Chat Room Management
  joinChat(swapId: string, userId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-chat', { swapId, userId });
    }
  }

  leaveChat(swapId: string, userId?: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave-chat', { swapId, userId });
    }
  }

  // Listen to chat presence events (who is currently inside the chat modal)
  onChatPresence(callback: (data: { swapId: string; onlineUsers: string[] }) => void) {
    if (!this.socket) return;
    this.socket.on('chat-presence', callback);
  }

  // Send real-time chat message via WebSocket
  sendChatMessage(
    swapId: string,
    senderId: string,
    receiverId: string,
    text: string,
    callback?: (response: any) => void
  ) {
    if (this.socket?.connected) {
      this.socket.emit('send-message', { swapId, senderId, receiverId, text }, callback);
    }
  }

  // Send typing indicator
  sendTyping(swapId: string, userId: string, isTyping: boolean, userName?: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing', { swapId, userId, isTyping, userName });
    }
  }

  // Mark messages as read in real-time
  markRead(swapId: string, userId: string) {
    if (this.socket?.connected) {
      this.socket.emit('mark-read', { swapId, userId });
    }
  }

  // Listen to incoming chat message
  onReceiveMessage(callback: (data: { message: any }) => void) {
    if (!this.socket) return;
    this.socket.on('receive-message', callback);
  }

  // Listen to typing events
  onUserTyping(callback: (data: { swapId: string; userId: string; isTyping: boolean; userName?: string }) => void) {
    if (!this.socket) return;
    this.socket.on('user-typing', callback);
  }

  // Listen to unread message notifications
  onNewMessageNotification(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('new-message-notification', callback);
  }

  // Listen to messages read event
  onMessagesRead(callback: (data: { swapId: string }) => void) {
    if (!this.socket) return;
    this.socket.on('messages-read', callback);
  }

  // Unsubscribe from an event
  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  isSocketConnected(): boolean {
    return Boolean(this.socket?.connected);
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
}

// Create a singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;