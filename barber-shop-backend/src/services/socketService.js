const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Franchise = require('../models/Franchise');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket
    this.franchiseRooms = new Map(); // franchiseId -> Set of socketIds
  }

  initialize(io) {
    this.io = io;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', async (data) => {
        try {
          const { token } = data;
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          const user = await User.findById(decoded.userId).populate('franchise_id', '_id name');

          if (!user || !user.is_active) {
            socket.emit('auth_error', { message: 'Invalid user' });
            return;
          }

          // Store user info in socket
          socket.userId = user._id;
          socket.franchiseId = user.franchise_id._id;
          socket.userRole = user.role;

          // Add to connected users
          this.connectedUsers.set(user._id.toString(), socket);

          // Join franchise room
          const franchiseRoom = `franchise_${user.franchise_id._id}`;
          socket.join(franchiseRoom);

          // Track franchise room members
          if (!this.franchiseRooms.has(user.franchise_id)) {
            this.franchiseRooms.set(user.franchise_id, new Set());
          }
          this.franchiseRooms.get(user.franchise_id).add(socket.id);

          socket.emit('authenticated', {
            message: 'Successfully authenticated',
            user: {
              id: user.id,
              name: user.getFullName(),
              role: user.role,
              franchise: user.Franchise.name
            }
          });

          console.log(`User ${user.username} authenticated and joined franchise room ${franchiseRoom}`);
        } catch (error) {
          console.error('Socket authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Handle queue updates subscription
      socket.on('subscribe_queue', (data) => {
        if (!socket.franchiseId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const queueRoom = `queue_${socket.franchiseId}`;
        socket.join(queueRoom);
        socket.emit('subscribed', { room: queueRoom });
      });

      // Handle staff status updates
      socket.on('update_staff_status', (data) => {
        if (!socket.franchiseId || !socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { status, currentCustomer } = data;
        
        // Broadcast to franchise room
        socket.to(`franchise_${socket.franchiseId}`).emit('staff_status_update', {
          staffId: socket.userId,
          status,
          currentCustomer,
          timestamp: new Date()
        });
      });

      // Handle customer notifications
      socket.on('notify_customer', (data) => {
        if (!socket.franchiseId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { customerId, message, type } = data;
        
        // Find customer's socket if they're connected
        const customerSocket = this.findCustomerSocket(customerId);
        if (customerSocket) {
          customerSocket.emit('notification', {
            type,
            message,
            timestamp: new Date()
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }

        if (socket.franchiseId) {
          const franchiseRoom = this.franchiseRooms.get(socket.franchiseId);
          if (franchiseRoom) {
            franchiseRoom.delete(socket.id);
            if (franchiseRoom.size === 0) {
              this.franchiseRooms.delete(socket.franchiseId);
            }
          }
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  // Broadcast queue updates to all connected clients in a franchise
  broadcastQueueUpdate(franchiseId, queueData) {
    if (!this.io) return;

    const room = `franchise_${franchiseId}`;
    this.io.to(room).emit('queue_update', {
      type: 'queue_update',
      data: queueData,
      timestamp: new Date()
    });
  }

  // Notify specific customer
  notifyCustomer(customerId, notification) {
    const socket = this.connectedUsers.get(customerId);
    if (socket) {
      socket.emit('customer_notification', {
        ...notification,
        timestamp: new Date()
      });
    }
  }

  // Notify all staff in a franchise
  notifyFranchiseStaff(franchiseId, notification) {
    if (!this.io) return;

    const room = `franchise_${franchiseId}`;
    this.io.to(room).emit('staff_notification', {
      ...notification,
      timestamp: new Date()
    });
  }

  // Broadcast customer status change
  broadcastCustomerStatusChange(franchiseId, customerData) {
    if (!this.io) return;

    const room = `franchise_${franchiseId}`;
    this.io.to(room).emit('customer_status_change', {
      type: 'customer_status_change',
      data: customerData,
      timestamp: new Date()
    });
  }

  // Send real-time analytics updates
  broadcastAnalyticsUpdate(franchiseId, analyticsData) {
    if (!this.io) return;

    const room = `franchise_${franchiseId}`;
    this.io.to(room).emit('analytics_update', {
      type: 'analytics_update',
      data: analyticsData,
      timestamp: new Date()
    });
  }

  // Get connected users count for a franchise
  getFranchiseConnectedCount(franchiseId) {
    const franchiseRoom = this.franchiseRooms.get(franchiseId);
    return franchiseRoom ? franchiseRoom.size : 0;
  }

  // Find customer socket (helper method)
  findCustomerSocket(customerId) {
    return this.connectedUsers.get(customerId);
  }

  // Send system-wide announcements
  broadcastSystemAnnouncement(announcement) {
    if (!this.io) return;

    this.io.emit('system_announcement', {
      ...announcement,
      timestamp: new Date()
    });
  }

  // Emergency broadcast (high priority)
  emergencyBroadcast(franchiseId, message) {
    if (!this.io) return;

    const room = `franchise_${franchiseId}`;
    this.io.to(room).emit('emergency_notification', {
      type: 'emergency',
      message,
      priority: 'high',
      timestamp: new Date()
    });
  }
}

// Create singleton instance
const socketService = new SocketService();

// Setup function to be called from server.js
const setupSocketHandlers = (io) => {
  socketService.initialize(io);
  return socketService;
};

module.exports = {
  socketService,
  setupSocketHandlers
};