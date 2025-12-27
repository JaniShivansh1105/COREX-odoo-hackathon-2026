/**
 * Role-Based Authorization Middleware
 * Restricts access based on user roles
 */

/**
 * Check if user has one of the allowed roles
 * @param  {...string} roles - Allowed roles (Admin, Manager, Technician, User)
 */
const roleAuth = (...roles) => {
  return (req, res, next) => {
    // Ensure user is authenticated (req.user should be set by auth middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

/**
 * Permission helpers for common role combinations
 */
const permissions = {
  // Admin only
  adminOnly: roleAuth('Admin'),
  
  // Admin and Manager
  adminAndManager: roleAuth('Admin', 'Manager'),
  
  // Admin, Manager, and Technician
  adminManagerTechnician: roleAuth('Admin', 'Manager', 'Technician'),
  
  // All authenticated users
  allAuthenticated: roleAuth('Admin', 'Manager', 'Technician', 'User'),
};

module.exports = { roleAuth, permissions };
