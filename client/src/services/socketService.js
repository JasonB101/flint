import io from 'socket.io-client'

/**
 * WebSocket Service for real-time eBay sync progress
 */
class SocketService {
  constructor() {
    this.socket = null
    this.connected = false
    this.listeners = new Map()
  }

  /**
   * Initialize socket connection
   */
  connect(userId) {
    if (this.socket) {
      this.disconnect()
    }

    // Connect to server - force HTTP for development since backend doesn't support HTTPS
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:3825'  // Force HTTP for development
    
    this.socket = io(serverUrl, {
      transports: ['polling', 'websocket'],
      forceNew: true,
      reconnection: true,
      timeout: 5000,
      autoConnect: true
    })

    // Handle connection events
    this.socket.on('connect', () => {
      this.connected = true
      
      // Join user-specific room for targeted messages
      if (userId) {
        this.socket.emit('join-user-room', userId)
      }
    })

    this.socket.on('disconnect', () => {
      this.connected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message)
    })

    // Handle sync progress events
    this.socket.on('sync-progress', (data) => {
      // Emit custom event for compatibility with existing code
      window.dispatchEvent(new CustomEvent('ebay-sync-progress', { 
        detail: data 
      }))

      // Call registered listeners
      this.listeners.forEach((callback, eventName) => {
        if (eventName === 'sync-progress') {
          callback(data)
        }
      })
    })

    // Also listen for broadcast events (fallback)
    this.socket.on('sync-progress-broadcast', (data) => {
      // Emit custom event for compatibility with existing code
      window.dispatchEvent(new CustomEvent('ebay-sync-progress', { 
        detail: data 
      }))
    })

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error)
    })

    return this.socket
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  /**
   * Add event listener
   */
  on(eventName, callback) {
    this.listeners.set(eventName, callback)
    // Also add to socket if available
    if (this.socket) {
      this.socket.on(eventName, callback)
    }
  }

  /**
   * Remove event listener
   */
  off(eventName) {
    const callback = this.listeners.get(eventName)
    this.listeners.delete(eventName)
    // Also remove from socket if available
    if (this.socket && callback) {
      this.socket.off(eventName, callback)
    }
  }

  /**
   * Emit event to server
   */
  emit(eventName, data) {
    if (this.socket && this.connected) {
      this.socket.emit(eventName, data)
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.connected && this.socket?.connected
  }
}

// Create singleton instance
const socketService = new SocketService()

export default socketService 