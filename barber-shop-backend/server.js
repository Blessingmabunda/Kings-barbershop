const http = require('http');
const socketIo = require('socket.io');
const app = require('./src/app');
const { initializeDatabase } = require('./src/config/database');
const { initializeDatabase: initializeDatabaseData } = require('./src/utils/initDatabase');
const { socketService, setupSocketHandlers } = require('./src/services/socketService');

const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Socket Service
socketService.initialize(io);

// Make socket service accessible to routes
app.set('socketService', socketService);

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔄 Starting Barber Shop Queue Management System...');
    
    // Connect to MongoDB
    await initializeDatabase();
    console.log('✅ MongoDB connected successfully');
    
    // Initialize database with sample data if requested
    if (process.env.INIT_DATABASE === 'true') {
      await initializeDatabaseData();
    }
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`💻 Health Check: http://localhost:${PORT}/health`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📋 Development Info:');
        console.log('- Database will be initialized with sample data if INIT_DATABASE=true');
        console.log('- WebSocket server is running for real-time updates');
        console.log('- API documentation available at /api/docs');
        console.log('\n🔐 Sample Login Credentials (after database init):');
        console.log('- Admin: username=admin, password=admin123');
        console.log('- Manager: username=manager_downtown, password=manager123');
        console.log('- Barber: username=barber_mike, password=barber123');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  
  server.close(async () => {
    console.log('🔌 HTTP server closed');
    
    try {
      await sequelize.close();
      console.log('🗄️ Database connection closed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  
  server.close(async () => {
    console.log('🔌 HTTP server closed');
    
    try {
      await sequelize.close();
      console.log('🗄️ Database connection closed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();