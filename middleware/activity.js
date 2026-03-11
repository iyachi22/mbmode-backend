const { UserActivity } = require('../models');

// Track user activity
const trackActivity = (action, description = null) => {
  return async (req, res, next) => {
    try {
      // Only track if user is authenticated
      if (req.user) {
        await UserActivity.create({
          user_id: req.user.id,
          action,
          description: description || `${action} - ${req.method} ${req.originalUrl}`,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          created_at: new Date()
        });
      }
      next();
    } catch (error) {
      console.error('Activity tracking error:', error);
      // Don't fail the request if activity tracking fails
      next();
    }
  };
};

module.exports = { trackActivity };