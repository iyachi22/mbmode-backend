const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// GET /api/auth/test - Test route
router.get('/test', async (req, res) => {
  try {
    console.log('🔍 Auth test route called');
    console.log('🔍 JWT_SECRET:', process.env.JWT_SECRET ? 'EXISTS' : 'MISSING');
    
    // Test database connection
    const userCount = await User.count();
    console.log('🔍 Users in database:', userCount);
    
    res.json({ 
      status: 'Auth system working',
      jwt_secret: !!process.env.JWT_SECRET,
      users_count: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🔍 Auth test error:', error);
    res.status(500).json({ 
      error: 'Auth test failed', 
      details: error.message 
    });
  }
});

// POST /api/auth/create-test-user - Create test user (REMOVE AFTER TESTING)
router.post('/create-test-user', async (req, res) => {
  try {
    const testEmail = 'test@mbmode.com';
    const testPassword = 'password123';
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: testEmail } });
    if (existingUser) {
      return res.json({ message: 'Test user already exists', email: testEmail });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: testEmail,
      password: hashedPassword,
      role: 'user'
    });
    
    res.json({ 
      message: 'Test user created successfully',
      email: testEmail,
      password: testPassword,
      user_id: user.id
    });
  } catch (error) {
    console.error('🔍 Create test user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login - Admin login
router.post('/login', async (req, res) => {
  try {
    console.log('🔍 Login attempt:', { email: req.body.email });
    console.log('🔍 JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    const { email, password } = req.body;

    // Find user
    console.log('🔍 Searching for user...');
    const user = await User.findOne({ where: { email } });
    console.log('🔍 User found:', !!user);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is blocked (skip if column doesn't exist)
    if (user.is_blocked === true) {
      return res.status(403).json({ error: 'Account has been blocked. Please contact support.' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login time
    await user.update({ last_login_at: new Date() });

    // Track login activity (skip if UserActivity doesn't exist)
    try {
      const { UserActivity } = require('../models');
      await UserActivity.create({
        user_id: user.id,
        action: 'login',
        description: `User logged in successfully`,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      });
      console.log('🔍 Activity logged successfully');
    } catch (activityError) {
      console.log('🔍 Activity logging failed (non-critical):', activityError.message);
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        last_login_at: user.last_login_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      phone: phone || null,
      address: address || null,
      is_blocked: false
    });

    // Track registration activity
    const { UserActivity } = require('../models');
    await UserActivity.create({
      user_id: user.id,
      action: 'registration',
      description: `User registered successfully`,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent')
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/forgot-password - Send password reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send email
    const { sendPasswordResetEmail } = require('../utils/emailService');
    await sendPasswordResetEmail(user, resetToken);

    // Track activity
    const { UserActivity } = require('../models');
    await UserActivity.create({
      user_id: user.id,
      action: 'password_reset_requested',
      description: `Password reset requested`,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent')
    });

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await user.update({ password: hashedPassword });

    // Track activity
    const { UserActivity } = require('../models');
    await UserActivity.create({
      user_id: user.id,
      action: 'password_reset_completed',
      description: `Password reset completed successfully`,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent')
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Update user
    await req.user.update({
      name,
      phone: phone || null,
      address: address || null
    });

    // Track activity
    const { UserActivity } = require('../models');
    await UserActivity.create({
      user_id: req.user.id,
      action: 'profile_updated',
      description: `Profile information updated`,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent')
    });

    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        address: req.user.address
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/auth/change-password - Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, req.user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await req.user.update({ password: hashedPassword });

    // Track activity
    const { UserActivity } = require('../models');
    await UserActivity.create({
      user_id: req.user.id,
      action: 'password_changed',
      description: `Password changed successfully`,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent')
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
