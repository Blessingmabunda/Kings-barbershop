const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Franchise = require('../models/Franchise');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database to ensure they still exist and are active
    const user = await User.findById(decoded.userId).populate('franchise_id', '_id name is_active');

    if (!user) {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'User not found' 
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'User account is deactivated' 
      });
    }

    if (!user.franchise_id || !user.franchise_id.is_active) {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'Franchise is not active' 
      });
    }

    // Add user info to request object
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      franchise_id: user.franchise_id._id,
      first_name: user.first_name,
      last_name: user.last_name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'Token expired' 
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Authentication failed' 
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

const authorizeFranchise = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Access denied',
      message: 'Authentication required' 
    });
  }

  // Extract franchise_id from request params or body
  const requestedFranchiseId = req.params.franchise_id || req.body.franchise_id;
  
  // Admin can access any franchise
  if (req.user.role === 'admin') {
    return next();
  }

  // Other users can only access their own franchise
  if (requestedFranchiseId && requestedFranchiseId !== req.user.franchise_id) {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Access denied to this franchise' 
    });
  }

  next();
};

const generateToken = (user) => {
  const payload = {
    userId: user._id,
    username: user.username,
    role: user.role,
    franchise_id: user.franchise_id
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

const refreshToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'No token provided' 
      });
    }

    // Verify token even if expired to get user info
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    
    // Check if token is actually expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp > now) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Token is still valid' 
      });
    }

    // Fetch user to generate new token
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'User not found or inactive' 
      });
    }

    // Generate new token
    const newToken = generateToken(user);
    
    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        franchise_id: user.franchise_id,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Token refresh failed' 
    });
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireRole: authorizeRoles,
  authorizeFranchise,
  requireFranchiseAccess: authorizeFranchise,
  generateToken,
  refreshToken
};