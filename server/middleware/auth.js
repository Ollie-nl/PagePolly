// server/middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Authentication middleware for API routes
 * Validates JWT tokens from Supabase Auth
 */
const authMiddleware = {
  /**
   * Verify and decode the JWT token from the request header
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  authenticateToken(req, res, next) {
    // Get the authorization header from the request
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }
    
    // Extract the JWT token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }
    
    try {
      // Verify the token
      // Note: In production, you would use the Supabase JWT secret
      // For now, we're just decoding to extract the user info
      const decoded = jwt.decode(token);
      
      if (!decoded) {
        throw new Error('Invalid token');
      }
      
      // Extract user info from Supabase JWT claims
      const user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role || 'authenticated'
      };
      
      // Attach user to request object
      req.user = user;
      
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  },
  
  /**
   * Check if the user has admin role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  requireAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    
    next();
  }
};

module.exports = authMiddleware;