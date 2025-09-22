const express = require('express');

// Import route modules
const authRoutes = require('./auth');
const queueRoutes = require('./queue');
const customerRoutes = require('./customers');
const serviceRoutes = require('./services');
const franchiseRoutes = require('./franchises');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Barber Shop Queue Management API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Barber Shop Queue Management API Documentation',
    version: '1.0.0',
    endpoints: {
      authentication: {
        base_path: '/api/auth',
        endpoints: [
          'POST /login - User login',
          'POST /register - Create new user (admin/manager only)',
          'POST /refresh - Refresh JWT token',
          'GET /profile - Get current user profile',
          'PUT /profile - Update user profile',
          'PUT /change-password - Change user password',
          'POST /logout - User logout'
        ]
      },
      queue_management: {
        base_path: '/api/queue',
        endpoints: [
          'GET /:franchiseId - Get current queue for franchise',
          'POST /:franchiseId/add - Add customer to queue',
          'POST /:franchiseId/call-next - Call next customer',
          'PUT /:franchiseId/entry/:entryId - Update queue entry status',
          'DELETE /:franchiseId/entry/:entryId - Remove customer from queue',
          'GET /:franchiseId/stats - Get queue statistics',
          'PUT /:franchiseId/settings - Update queue settings'
        ]
      },
      customer_management: {
        base_path: '/api/customers',
        endpoints: [
          'GET / - Get all customers with pagination and search',
          'GET /:customerId - Get customer by ID',
          'POST / - Create new customer',
          'PUT /:customerId - Update customer',
          'DELETE /:customerId - Delete customer (soft delete)',
          'GET /:customerId/history - Get customer visit history',
          'PUT /:customerId/loyalty - Update customer loyalty points',
          'GET /:customerId/stats - Get customer statistics'
        ]
      },
      service_management: {
        base_path: '/api/services',
        endpoints: [
          'GET /:franchiseId - Get all services for franchise',
          'GET /:franchiseId/service/:serviceId - Get service by ID',
          'POST /:franchiseId - Create new service',
          'PUT /:franchiseId/service/:serviceId - Update service',
          'DELETE /:franchiseId/service/:serviceId - Delete service',
          'GET /:franchiseId/service/:serviceId/analytics - Get service analytics',
          'PUT /:franchiseId/service/:serviceId/pricing - Update service pricing',
          'POST /:franchiseId/service/:serviceId/popularity - Increment service popularity'
        ]
      },
      franchise_management: {
        base_path: '/api/franchises',
        endpoints: [
          'GET / - Get all franchises (admin only)',
          'GET /:franchiseId - Get franchise by ID',
          'POST / - Create new franchise (admin only)',
          'PUT /:franchiseId - Update franchise',
          'DELETE /:franchiseId - Delete franchise (admin only)',
          'GET /:franchiseId/stats - Get franchise statistics',
          'GET /:franchiseId/dashboard - Get franchise dashboard data',
          'PUT /:franchiseId/settings - Update franchise settings'
        ]
      }
    },
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
      note: 'Include JWT token in Authorization header for protected routes'
    },
    response_format: {
      success: {
        success: true,
        message: 'Success message',
        data: 'Response data'
      },
      error: {
        success: false,
        error: 'Error type',
        message: 'Error message',
        details: 'Additional error details (optional)'
      }
    },
    status_codes: {
      200: 'Success',
      201: 'Created',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Too Many Requests',
      500: 'Internal Server Error'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/queue', queueRoutes);
router.use('/customers', customerRoutes);
router.use('/services', serviceRoutes);
router.use('/franchises', franchiseRoutes);

// 404 handler for API routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `API endpoint ${req.method} ${req.originalUrl} not found`,
    available_endpoints: '/api/docs'
  });
});

module.exports = router;