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

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
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

  onNewSwapRequest(callback: (data: any) => void) {
    if (!this.socket) return;
    
    this.socket.on('new-swap-request', (data) => {
      console.log('New swap request received:', data);
      callback(data);
    });
  }

  onSwapRequestUpdated(callback: (data: any) => void) {
    if (!this.socket) return;
    
    this.socket.on('swap-request-updated', (data) => {
      console.log('Swap request updated:', data);
      callback(data);
    });
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Method to manually emit events (for testing)
  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
}

// Create a singleton instance
const realtimeService = new RealtimeService();

export default realtimeService; 