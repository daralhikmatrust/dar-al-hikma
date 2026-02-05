import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Remove sensitive data
    const { password, refresh_token, ...userData } = user;
    req.user = { ...userData, id: user.id };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Optional authentication - sets req.user if token is valid, but doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (user) {
          // Remove sensitive data
          const { password, refresh_token, ...userData } = user;
          req.user = { ...userData, id: user.id };
          console.log(`[optionalAuth] User authenticated: ${user.id} (${user.email})`);
        } else {
          console.log(`[optionalAuth] Token valid but user not found: ${decoded.id}`);
        }
      } catch (error) {
        // Token invalid or expired - continue without user (guest mode)
        console.log(`[optionalAuth] Token invalid or expired: ${error.message}`);
        // Don't fail the request
      }
    } else {
      console.log(`[optionalAuth] No token provided - guest mode`);
    }
    
    next();
  } catch (error) {
    // Any error - continue without user (guest mode)
    console.error(`[optionalAuth] Error:`, error);
    next();
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

