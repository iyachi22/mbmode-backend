const express = require('express');
const router = express.Router();
const { User, Order, OrderItem, Product } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Apply auth middleware to all user routes
router.use(authenticateToken);

// GET /api/user/profile - Get user profile
router.get('/profile', async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      address: req.user.address,
      created_at: req.user.created_at,
      last_login_at: req.user.last_login_at
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// GET /api/user/orders - Get user orders
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const { Op } = require('sequelize');

    console.log('🔍 Fetching orders for user:', {
      user_id: req.user.id,
      user_phone: req.user.phone,
      user_email: req.user.email
    });

    // Build flexible where clause to find orders by user_id OR phone
    const whereConditions = [
      { user_id: req.user.id }
    ];

    // Add phone matching if user has phone
    if (req.user.phone) {
      whereConditions.push({ phone: req.user.phone });
    }

    const where = {
      [Op.or]: whereConditions
    };
    
    // Filter by status if provided
    if (status && ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      where.status = status;
    }

    console.log('🔍 Query where conditions:', JSON.stringify(where, null, 2));

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name_fr', 'name_ar', 'price']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    console.log('🔍 Found orders:', count);
    if (rows.length > 0) {
      console.log('🔍 First order:', {
        id: rows[0].id,
        order_number: rows[0].order_number,
        user_id: rows[0].user_id,
        phone: rows[0].phone
      });
    }

    res.json({
      orders: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// GET /api/user/orders/:id - Get specific order
router.get('/orders/:id', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    
    // Build flexible where clause
    const whereConditions = [
      { user_id: req.user.id }
    ];

    // Add phone matching if user has phone
    if (req.user.phone) {
      whereConditions.push({ phone: req.user.phone });
    }

    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        [Op.or]: whereConditions
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name_fr', 'name_ar', 'price', 'description_fr', 'description_ar']
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// GET /api/user/stats - Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const sequelize = require('../config/database');
    
    // Get order statistics
    const stats = await Order.findAll({
      where: { user_id: req.user.id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_spent'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'avg_order_value']
      ],
      raw: true
    });

    // Get orders by status
    const ordersByStatus = await Order.findAll({
      where: { user_id: req.user.id },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Get recent order
    const recentOrder = await Order.findOne({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      attributes: ['id', 'order_number', 'status', 'total_amount', 'created_at']
    });

    res.json({
      stats: {
        total_orders: parseInt(stats[0]?.total_orders) || 0,
        total_spent: parseFloat(stats[0]?.total_spent) || 0,
        avg_order_value: parseFloat(stats[0]?.avg_order_value) || 0
      },
      ordersByStatus,
      recentOrder
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;