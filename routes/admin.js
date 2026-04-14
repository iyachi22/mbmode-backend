const express = require('express');
const router = express.Router();
const { Product, Category, Order, OrderItem, User, Banner, ProductImage, ProductVariant, ShippingRate, UserActivity, ProductReview } = require('../models');
const { authenticateToken, isAdmin, isSuperAdmin } = require('../middleware/auth');
const sequelize = require('../config/database');
const { Op, QueryTypes } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Apply auth middleware to all admin routes
router.use(authenticateToken, isAdmin);

// Configure multer for product uploads
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.env.UPLOAD_DIR || './uploads', 'products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: productStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB for products
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Configure multer for category uploads
const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.env.UPLOAD_DIR || './uploads', 'categories');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const categoryUpload = multer({
  storage: categoryStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB for categories
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Configure multer for banner uploads
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.env.UPLOAD_DIR || './uploads', 'banners');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const bannerUpload = multer({
  storage: bannerStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for banners
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ============================================
// DASHBOARD
// ============================================

router.get('/dashboard/stats', async (req, res) => {
  try {
    const [totalOrders, totalProducts, totalCustomers, pendingOrders] = await Promise.all([
      Order.count(),
      Product.count({ where: { is_active: true } }),
      User.count({ where: { role: 'customer' } }),
      Order.count({ where: { status: 'pending' } })
    ]);

    // Recent orders
    const recentOrders = await Order.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'order_number', 'full_name', 'total_amount', 'status', 'created_at']
    });

    // Sales data (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const salesData = await Order.findAll({
      where: {
        created_at: { [require('sequelize').Op.gte]: sevenDaysAgo }
      },
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'date'],
        [require('sequelize').fn('SUM', require('sequelize').col('total_amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: [require('sequelize').fn('DATE', require('sequelize').col('created_at'))]
    });

    res.json({
      stats: {
        totalOrders,
        totalProducts,
        totalCustomers,
        pendingOrders
      },
      recentOrders,
      salesData
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// ============================================
// PRODUCTS
// ============================================

router.get('/products', async (req, res) => {
  try {
    // Prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { page = 1, limit = 20, search, category, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[require('sequelize').Op.or] = [
        { name_fr: { [require('sequelize').Op.like]: `%${search}%` } },
        { name_ar: { [require('sequelize').Op.like]: `%${search}%` } }
      ];
    }
    if (category) {
      where.category_id = category;
    }
    if (status && status !== 'all') {
      where.is_active = status === 'active';
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category' },
        { model: ProductImage, as: 'images' }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      products: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: ProductImage, as: 'images' },
        { model: ProductVariant, as: 'variants' }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/products', upload.array('images', 5), async (req, res) => {
  try {
    const {
      name_fr, name_ar, description_fr, description_ar,
      price, compare_price, category_id, sku,
      stock_quantity, is_featured, free_delivery, is_active
    } = req.body;

    // Generate SKU if not provided
    const productSku = sku || `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const product = await Product.create({
      name_fr, name_ar, description_fr, description_ar,
      price, compare_price, category_id, 
      sku: productSku,
      stock_quantity, 
      is_featured: is_featured === 'true' || is_featured === true,
      free_delivery: free_delivery === 'true' || free_delivery === true,
      is_active: is_active === 'true' || is_active === true || is_active !== 'false'
    });

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map((file, index) =>
        ProductImage.create({
          product_id: product.id,
          image_path: `/uploads/products/${file.filename}`,
          is_primary: index === 0
        })
      );
      await Promise.all(imagePromises);
    }

    const createdProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: ProductImage, as: 'images' }
      ]
    });

    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Create product error:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create product',
      details: error.message 
    });
  }
});

router.put('/products/:id', upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const {
      name_fr, name_ar, description_fr, description_ar,
      price, compare_price, category_id, sku,
      stock_quantity, is_featured, free_delivery, is_active
    } = req.body;

    await product.update({
      name_fr, name_ar, description_fr, description_ar,
      price, compare_price, category_id, sku,
      stock_quantity,
      is_featured: is_featured === 'true',
      free_delivery: free_delivery === 'true',
      is_active: is_active !== 'false'
    });

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map((file, index) =>
        ProductImage.create({
          product_id: product.id,
          image_path: `/uploads/products/${file.filename}`,
          is_primary: false
        })
      );
      await Promise.all(imagePromises);
    }

    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: ProductImage, as: 'images' }
      ]
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: ProductImage, as: 'images' }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete image files
    if (product.images) {
      product.images.forEach(image => {
        const imagePath = path.join(__dirname, '..', image.image_path);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Delete product image
router.delete('/products/:productId/images/:imageId', async (req, res) => {
  try {
    const image = await ProductImage.findOne({
      where: {
        id: req.params.imageId,
        product_id: req.params.productId
      }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Don't allow deleting the only image
    const imageCount = await ProductImage.count({
      where: { product_id: req.params.productId }
    });

    if (imageCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the only image' });
    }

    // Delete file
    const imagePath = path.join(__dirname, '..', image.image_path);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await image.destroy();
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Set primary product image
router.post('/products/:productId/images/:imageId/primary', async (req, res) => {
  try {
    const image = await ProductImage.findOne({
      where: {
        id: req.params.imageId,
        product_id: req.params.productId
      }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Set all images to non-primary
    await ProductImage.update(
      { is_primary: false },
      { where: { product_id: req.params.productId } }
    );

    // Set this image as primary
    await image.update({ is_primary: true });

    res.json({ message: 'Primary image updated successfully' });
  } catch (error) {
    console.error('Set primary image error:', error);
    res.status(500).json({ error: 'Failed to set primary image' });
  }
});

// ============================================
// ORDERS
// ============================================

router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    // Search by order number, customer name, or phone
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { order_number: { [Op.like]: `%${search}%` } },
        { full_name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      orders: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product, 
              as: 'product',
              include: [
                { model: ProductImage, as: 'images' },
                { model: ProductVariant, as: 'variants' }
              ]
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Debug: Log the order data structure
    console.log('Order data for ID', req.params.id, ':', JSON.stringify({
      id: order.id,
      items: order.items?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.price,
        product: item.product ? {
          id: item.product.id,
          name_fr: item.product.name_fr,
          name_ar: item.product.name_ar,
          sku: item.product.sku,
          images: item.product.images?.length || 0,
          variants: item.product.variants?.length || 0
        } : null
      }))
    }, null, 2));

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.update({ status });

    // Update timestamps based on status
    if (status === 'shipped' && !order.shipped_at) {
      await order.update({ shipped_at: new Date() });
    } else if (status === 'delivered' && !order.delivered_at) {
      await order.update({ delivered_at: new Date() });
    } else if (status === 'cancelled' && !order.cancelled_at) {
      await order.update({ cancelled_at: new Date() });
    }

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ============================================
// CATEGORIES
// ============================================

router.get('/categories', async (req, res) => {
  try {
    // Prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const categories = await Category.findAll({
      order: [['name_fr', 'ASC']]
    });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/categories', categoryUpload.single('image'), async (req, res) => {
  try {
    const { name_fr, name_ar, description_fr, description_ar, is_active, size_type } = req.body;
    
    console.log('Received category data:', { name_fr, name_ar, description_fr, description_ar, is_active, size_type });
    
    // Generate slug from name_fr
    const generateSlug = (name) => {
      if (!name || typeof name !== 'string') {
        console.log('Invalid name for slug generation:', name);
        return 'category-' + Date.now();
      }
      
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        + '-' + Date.now(); // Add timestamp for uniqueness
      
      console.log('Generated slug:', slug, 'from name:', name);
      return slug;
    };
    
    const categoryData = {
      name_fr, 
      name_ar, 
      description_fr, 
      description_ar, 
      size_type: size_type || 'other',
      is_active,
      slug: generateSlug(name_fr)
    };
    
    console.log('Category data to create:', categoryData);
    
    if (req.file) {
      categoryData.image = `/uploads/categories/${req.file.filename}`;
    }
    
    const category = await Category.create(categoryData);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', categoryUpload.single('image'), async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const { name_fr, name_ar, description_fr, description_ar, is_active } = req.body;
    const updateData = { name_fr, name_ar, description_fr, description_ar, is_active };
    
    if (req.file) {
      // Delete old image if exists
      if (category.image) {
        const oldImagePath = path.join(process.env.UPLOAD_DIR || './uploads', 'categories', path.basename(category.image));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = `/uploads/categories/${req.file.filename}`;
    }
    
    await category.update(updateData);
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has products
    const productCount = await Product.count({ where: { category_id: req.params.id } });
    if (productCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category with products' });
    }

    await category.destroy();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============================================
// ANALYTICS (SUPERADMIN ONLY)
// ============================================

router.get('/analytics', isSuperAdmin, async (req, res) => {
  try {
    const { period = 'month', start_date, end_date } = req.query;
    
    // Set date range
    let startDate, endDate;
    if (period === 'custom' && start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'year') {
      startDate = new Date(new Date().getFullYear(), 0, 1);
      endDate = new Date();
    } else { // month
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      endDate = new Date();
    }

    // Total revenue (delivered orders only)
    const totalRevenue = await Order.sum('total_amount', {
      where: {
        status: 'delivered',
        created_at: { [Op.between]: [startDate, endDate] }
      }
    }) || 0;

    // Total orders
    const totalOrders = await Order.count({
      where: {
        created_at: { [Op.between]: [startDate, endDate] }
      }
    });

    // Average order value (based on delivered orders)
    const deliveredOrders = await Order.count({
      where: {
        status: 'delivered',
        created_at: { [Op.between]: [startDate, endDate] }
      }
    });
    const avgOrderValue = deliveredOrders > 0 ? totalRevenue / deliveredOrders : 0;

    // Monthly revenue (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const monthlyRevenue = await sequelize.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(total_amount) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE status = 'delivered' AND created_at >= ?
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `, {
      replacements: [twelveMonthsAgo],
      type: QueryTypes.SELECT
    });

    // Best selling products
    const bestSellers = await sequelize.query(`
      SELECT 
        p.name_fr as name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.status = 'delivered' 
        AND o.created_at BETWEEN ? AND ?
      GROUP BY p.id, p.name_fr
      ORDER BY total_sold DESC
      LIMIT 10
    `, {
      replacements: [startDate, endDate],
      type: QueryTypes.SELECT
    });

    // Sales by wilaya
    const salesByWilaya = await sequelize.query(`
      SELECT 
        wilaya_name,
        COUNT(*) as orders,
        SUM(total_amount) as revenue
      FROM orders
      WHERE status = 'delivered'
        AND created_at BETWEEN ? AND ?
      GROUP BY wilaya_name
      ORDER BY revenue DESC
      LIMIT 10
    `, {
      replacements: [startDate, endDate],
      type: QueryTypes.SELECT
    });

    // Cancelled orders analysis
    const cancelledOrders = await sequelize.query(`
      SELECT 
        p.name_fr as name,
        COUNT(*) as cancel_count,
        SUM(oi.quantity * oi.price) as lost_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.status = 'cancelled' 
        AND o.created_at BETWEEN ? AND ?
      GROUP BY p.id, p.name_fr
      ORDER BY cancel_count DESC
      LIMIT 10
    `, {
      replacements: [startDate, endDate],
      type: QueryTypes.SELECT
    });

    res.json({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      monthlyRevenue,
      bestSellers,
      salesByWilaya,
      cancelledOrders
    });
  } catch (error) {
    console.error('Analytics error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// CONTACT MANAGEMENT
// ============================================

const contactConfigPath = path.join(__dirname, '..', 'config', 'contact.json');

router.get('/contact', async (req, res) => {
  try {
    let contactInfo = {
      phone: '+213 555 123 456',
      instagram: 'https://instagram.com/mbmode'
    };

    try {
      const configData = fs.readFileSync(contactConfigPath, 'utf8');
      const config = JSON.parse(configData);
      contactInfo = {
        phone: config.phone || contactInfo.phone,
        instagram: config.instagram || contactInfo.instagram
      };
    } catch (error) {
      // File doesn't exist or is invalid, use defaults
      console.log('Contact config file not found, using defaults');
    }

    res.json(contactInfo);
  } catch (error) {
    console.error('Get contact info error:', error);
    res.status(500).json({ error: 'Failed to fetch contact information' });
  }
});

router.put('/contact', async (req, res) => {
  try {
    const { phone, instagram } = req.body;

    // Validation
    if (!phone || !instagram) {
      return res.status(400).json({ error: 'Phone and Instagram URL are required' });
    }

    if (phone.length < 10) {
      return res.status(400).json({ error: 'Phone number must be at least 10 characters' });
    }

    // Validate Instagram URL
    try {
      new URL(instagram);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid Instagram URL' });
    }

    const contactInfo = {
      phone: phone.trim(),
      instagram: instagram.trim()
    };

    // Ensure config directory exists
    const configDir = path.dirname(contactConfigPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Save to JSON file
    fs.writeFileSync(contactConfigPath, JSON.stringify(contactInfo, null, 2));

    res.json({ 
      message: 'Contact information updated successfully',
      contact: contactInfo
    });
  } catch (error) {
    console.error('Update contact info error:', error);
    res.status(500).json({ error: 'Failed to update contact information' });
  }
});

// ============================================
// USERS MANAGEMENT (SUPERADMIN ONLY)
// ============================================

router.get('/users', isSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, role } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    // Search by name or email
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filter by status (blocked/active)
    if (status === 'blocked') {
      where.is_blocked = true;
    } else if (status === 'active') {
      where.is_blocked = false;
    }

    // Filter by role
    if (role && ['user', 'admin'].includes(role)) {
      where.role = role;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'email', 'role', 'is_blocked', 'last_login_at', 'phone', 'address', 'created_at', 'updated_at'],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    // Get order statistics for each user
    const usersWithStats = await Promise.all(rows.map(async (user) => {
      const orderStats = await Order.findAll({
        where: { user_id: user.id },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_spent'],
          [sequelize.fn('MAX', sequelize.col('created_at')), 'last_order_date']
        ],
        raw: true
      });

      return {
        ...user.toJSON(),
        stats: {
          total_orders: parseInt(orderStats[0]?.total_orders) || 0,
          total_spent: parseFloat(orderStats[0]?.total_spent) || 0,
          last_order_date: orderStats[0]?.last_order_date || null
        }
      };
    }));

    res.json({
      users: usersWithStats,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:id', isSuperAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'role', 'is_blocked', 'last_login_at', 'phone', 'address', 'created_at', 'updated_at']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's orders
    const orders = await Order.findAll({
      where: { user_id: user.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Get user statistics
    const stats = await Order.findAll({
      where: { user_id: user.id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_spent'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'avg_order_value']
      ],
      raw: true
    });

    // Get orders by status
    const ordersByStatus = await Order.findAll({
      where: { user_id: user.id },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    res.json({
      user: user.toJSON(),
      orders,
      stats: {
        total_orders: parseInt(stats[0]?.total_orders) || 0,
        total_spent: parseFloat(stats[0]?.total_spent) || 0,
        avg_order_value: parseFloat(stats[0]?.avg_order_value) || 0
      },
      ordersByStatus
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

router.put('/users/:id/block', isSuperAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin' || user.role === 'superadmin') {
      return res.status(400).json({ error: 'Cannot block admin or superadmin users' });
    }

    const wasBlocked = user.is_blocked;
    await user.update({ is_blocked: !user.is_blocked });

    // Track admin activity
    await UserActivity.create({
      user_id: user.id,
      action: user.is_blocked ? 'user_blocked' : 'user_unblocked',
      description: `User ${user.is_blocked ? 'blocked' : 'unblocked'} by admin ${req.user.name}`,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent')
    });

    res.json({ 
      message: `User ${user.is_blocked ? 'blocked' : 'unblocked'} successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_blocked: user.is_blocked
      }
    });
  } catch (error) {
    console.error('Block/unblock user error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

router.put('/users/:id/role', isSuperAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldRole = user.role;
    await user.update({ role });

    // Track admin activity
    await UserActivity.create({
      user_id: user.id,
      action: 'role_changed',
      description: `User role changed from ${oldRole} to ${role} by admin ${req.user.name}`,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent')
    });

    res.json({ 
      message: `User role updated to ${role} successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

router.delete('/users/:id', isSuperAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin' || user.role === 'superadmin') {
      return res.status(400).json({ error: 'Cannot delete admin or superadmin users' });
    }

    // Check if user has orders
    const orderCount = await Order.count({ where: { user_id: user.id } });
    
    if (orderCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user with existing orders. Consider blocking instead.' 
      });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user activity logs
router.get('/users/:id/activities', isSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { count, rows } = await UserActivity.findAndCountAll({
      where: { user_id: req.params.id },
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      activities: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({ error: 'Failed to fetch user activities' });
  }
});

// ============================================
// SHIPPING MANAGEMENT
// ============================================

router.get('/shipping', async (req, res) => {
  try {
    const shippingRates = await ShippingRate.findAll({
      order: [['wilaya_name', 'ASC']]
    });
    res.json(shippingRates);
  } catch (error) {
    console.error('Get shipping rates error:', error);
    res.status(500).json({ error: 'Failed to fetch shipping rates' });
  }
});

router.post('/shipping/initialize', async (req, res) => {
  try {
    // Initialize shipping rates from wilayas data
    const wilayas = [
      { id: 1, name: 'Adrar', name_ar: 'أدرار', shipping_price: 800 },
      { id: 2, name: 'Chlef', name_ar: 'الشلف', shipping_price: 600 },
      { id: 3, name: 'Laghouat', name_ar: 'الأغواط', shipping_price: 700 },
      { id: 4, name: 'Oum El Bouaghi', name_ar: 'أم البواقي', shipping_price: 600 },
      { id: 5, name: 'Batna', name_ar: 'باتنة', shipping_price: 600 },
      { id: 6, name: 'Béjaïa', name_ar: 'بجاية', shipping_price: 600 },
      { id: 7, name: 'Biskra', name_ar: 'بسكرة', shipping_price: 700 },
      { id: 8, name: 'Béchar', name_ar: 'بشار', shipping_price: 900 },
      { id: 9, name: 'Blida', name_ar: 'البليدة', shipping_price: 400 },
      { id: 10, name: 'Bouira', name_ar: 'البويرة', shipping_price: 500 },
      { id: 11, name: 'Tamanrasset', name_ar: 'تمنراست', shipping_price: 1200 },
      { id: 12, name: 'Tébessa', name_ar: 'تبسة', shipping_price: 700 },
      { id: 13, name: 'Tlemcen', name_ar: 'تلمسان', shipping_price: 700 },
      { id: 14, name: 'Tiaret', name_ar: 'تيارت', shipping_price: 600 },
      { id: 15, name: 'Tizi Ouzou', name_ar: 'تيزي وزو', shipping_price: 500 },
      { id: 16, name: 'Alger', name_ar: 'الجزائر', shipping_price: 300 },
      { id: 17, name: 'Djelfa', name_ar: 'الجلفة', shipping_price: 600 },
      { id: 18, name: 'Jijel', name_ar: 'جيجل', shipping_price: 600 },
      { id: 19, name: 'Sétif', name_ar: 'سطيف', shipping_price: 600 },
      { id: 20, name: 'Saïda', name_ar: 'سعيدة', shipping_price: 700 },
      { id: 21, name: 'Skikda', name_ar: 'سكيكدة', shipping_price: 600 },
      { id: 22, name: 'Sidi Bel Abbès', name_ar: 'سيدي بلعباس', shipping_price: 700 },
      { id: 23, name: 'Annaba', name_ar: 'عنابة', shipping_price: 600 },
      { id: 24, name: 'Guelma', name_ar: 'قالمة', shipping_price: 600 },
      { id: 25, name: 'Constantine', name_ar: 'قسنطينة', shipping_price: 600 },
      { id: 26, name: 'Médéa', name_ar: 'المدية', shipping_price: 500 },
      { id: 27, name: 'Mostaganem', name_ar: 'مستغانم', shipping_price: 600 },
      { id: 28, name: "M'Sila", name_ar: 'المسيلة', shipping_price: 600 },
      { id: 29, name: 'Mascara', name_ar: 'معسكر', shipping_price: 600 },
      { id: 30, name: 'Ouargla', name_ar: 'ورقلة', shipping_price: 800 },
      { id: 31, name: 'Oran', name_ar: 'وهران', shipping_price: 500 },
      { id: 32, name: 'El Bayadh', name_ar: 'البيض', shipping_price: 800 },
      { id: 33, name: 'Illizi', name_ar: 'إليزي', shipping_price: 1200 },
      { id: 34, name: 'Bordj Bou Arréridj', name_ar: 'برج بوعريريج', shipping_price: 600 },
      { id: 35, name: 'Boumerdès', name_ar: 'بومرداس', shipping_price: 400 },
      { id: 36, name: 'El Tarf', name_ar: 'الطارف', shipping_price: 700 },
      { id: 37, name: 'Tindouf', name_ar: 'تندوف', shipping_price: 1200 },
      { id: 38, name: 'Tissemsilt', name_ar: 'تيسمسيلت', shipping_price: 600 },
      { id: 39, name: 'El Oued', name_ar: 'الوادي', shipping_price: 800 },
      { id: 40, name: 'Khenchela', name_ar: 'خنشلة', shipping_price: 700 },
      { id: 41, name: 'Souk Ahras', name_ar: 'سوق أهراس', shipping_price: 700 },
      { id: 42, name: 'Tipaza', name_ar: 'تيبازة', shipping_price: 400 },
      { id: 43, name: 'Mila', name_ar: 'ميلة', shipping_price: 600 },
      { id: 44, name: 'Aïn Defla', name_ar: 'عين الدفلى', shipping_price: 500 },
      { id: 45, name: 'Naâma', name_ar: 'النعامة', shipping_price: 800 },
      { id: 46, name: 'Aïn Témouchent', name_ar: 'عين تموشنت', shipping_price: 600 },
      { id: 47, name: 'Ghardaïa', name_ar: 'غرداية', shipping_price: 800 },
      { id: 48, name: 'Relizane', name_ar: 'غليزان', shipping_price: 600 },
      { id: 49, name: 'Timimoun', name_ar: 'تيميمون', shipping_price: 900 },
      { id: 50, name: 'Bordj Badji Mokhtar', name_ar: 'برج باجي مختار', shipping_price: 1200 },
      { id: 51, name: 'Ouled Djellal', name_ar: 'أولاد جلال', shipping_price: 700 },
      { id: 52, name: 'Béni Abbès', name_ar: 'بني عباس', shipping_price: 900 },
      { id: 53, name: 'In Salah', name_ar: 'عين صالح', shipping_price: 1000 },
      { id: 54, name: 'In Guezzam', name_ar: 'عين قزام', shipping_price: 1200 },
      { id: 55, name: 'Touggourt', name_ar: 'تقرت', shipping_price: 800 },
      { id: 56, name: 'Djanet', name_ar: 'جانت', shipping_price: 1200 },
      { id: 57, name: 'El M\'Ghair', name_ar: 'المغير', shipping_price: 800 },
      { id: 58, name: 'El Meniaa', name_ar: 'المنيعة', shipping_price: 900 }
    ];

    // Check if already initialized
    const existingCount = await ShippingRate.count();
    if (existingCount > 0) {
      return res.json({ message: 'Shipping rates already initialized', count: existingCount });
    }

    // Create shipping rates
    const shippingRates = wilayas.map(wilaya => ({
      wilaya_id: wilaya.id,
      wilaya_name: wilaya.name,
      wilaya_name_ar: wilaya.name_ar,
      shipping_price: wilaya.shipping_price,
      is_active: true
    }));

    await ShippingRate.bulkCreate(shippingRates);

    res.json({ 
      message: 'Shipping rates initialized successfully', 
      count: shippingRates.length 
    });
  } catch (error) {
    console.error('Initialize shipping rates error:', error);
    res.status(500).json({ error: 'Failed to initialize shipping rates' });
  }
});

router.put('/shipping/:id', async (req, res) => {
  try {
    const { shipping_price, is_active } = req.body;
    
    const shippingRate = await ShippingRate.findByPk(req.params.id);
    if (!shippingRate) {
      return res.status(404).json({ error: 'Shipping rate not found' });
    }

    await shippingRate.update({
      shipping_price: parseFloat(shipping_price),
      is_active: is_active !== false
    });

    res.json(shippingRate);
  } catch (error) {
    console.error('Update shipping rate error:', error);
    res.status(500).json({ error: 'Failed to update shipping rate' });
  }
});

router.post('/shipping/bulk-update', async (req, res) => {
  try {
    const { updates } = req.body; // Array of {id, shipping_price, is_active}
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates must be an array' });
    }

    const promises = updates.map(update => 
      ShippingRate.update(
        { 
          shipping_price: parseFloat(update.shipping_price),
          is_active: update.is_active !== false
        },
        { where: { id: update.id } }
      )
    );

    await Promise.all(promises);

    const updatedRates = await ShippingRate.findAll({
      order: [['wilaya_name', 'ASC']]
    });

    res.json({ 
      message: 'Shipping rates updated successfully',
      rates: updatedRates
    });
  } catch (error) {
    console.error('Bulk update shipping rates error:', error);
    res.status(500).json({ error: 'Failed to update shipping rates' });
  }
});

// ============================================
// ANALYTICS EXPORT
// ============================================

router.get('/analytics/export', isSuperAdmin, async (req, res) => {
  try {
    const { period = 'month', start_date, end_date, format = 'json' } = req.query;
    
    // Set date range
    let startDate, endDate;
    if (period === 'custom' && start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'year') {
      startDate = new Date(new Date().getFullYear(), 0, 1);
      endDate = new Date();
    } else {
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      endDate = new Date();
    }

    // Get all orders in period
    const allOrders = await Order.findAll({
      where: {
        created_at: { [Op.between]: [startDate, endDate] }
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Get order status breakdown
    const ordersByStatus = await sequelize.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total
      FROM orders
      WHERE created_at BETWEEN ? AND ?
      GROUP BY status
    `, {
      replacements: [startDate, endDate],
      type: QueryTypes.SELECT
    });

    // Get daily sales
    const dailySales = await sequelize.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total_amount) as revenue
      FROM orders
      WHERE status = 'delivered'
        AND created_at BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, {
      replacements: [startDate, endDate],
      type: QueryTypes.SELECT
    });

    // Get customer insights
    const topCustomers = await sequelize.query(`
      SELECT 
        full_name,
        phone,
        wilaya_name,
        COUNT(*) as order_count,
        SUM(total_amount) as total_spent
      FROM orders
      WHERE status = 'delivered'
        AND created_at BETWEEN ? AND ?
      GROUP BY full_name, phone, wilaya_name
      ORDER BY total_spent DESC
      LIMIT 20
    `, {
      replacements: [startDate, endDate],
      type: QueryTypes.SELECT
    });

    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      },
      summary: {
        totalOrders: allOrders.length,
        totalRevenue: allOrders
          .filter(o => o.status === 'delivered')
          .reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
        ordersByStatus
      },
      dailySales,
      topCustomers,
      allOrders: allOrders.map(order => ({
        orderNumber: order.order_number,
        date: order.created_at,
        customer: {
          name: order.full_name,
          phone: order.phone,
          wilaya: order.wilaya_name,
          address: order.address
        },
        items: order.items.map(item => ({
          product: item.product?.name_fr || 'Unknown',
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color
        })),
        subtotal: order.subtotal,
        shippingCost: order.shipping_cost,
        total: order.total_amount,
        status: order.status
      }))
    };

    if (format === 'csv') {
      // Generate CSV with UTF-8 BOM for Excel compatibility
      const BOM = '\uFEFF';
      let csv = BOM;
      
      csv += '=== MBMODE COMPLETE ANALYTICS EXPORT ===\n';
      csv += `Export Date:,${new Date().toLocaleString()}\n`;
      csv += `Period:,${period}\n`;
      csv += `Date Range:,${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}\n\n\n`;
      
      // Summary Section
      csv += '=== SUMMARY ===\n';
      csv += 'Metric,Value\n';
      csv += `Total Orders,${exportData.summary.totalOrders}\n`;
      csv += `Total Revenue,${exportData.summary.totalRevenue.toFixed(2)} DZD\n\n\n`;
      
      // Order Status Breakdown
      csv += '=== ORDER STATUS BREAKDOWN ===\n';
      csv += 'Status,Count,Total Amount (DZD)\n';
      ordersByStatus.forEach(status => {
        csv += `${status.status},${status.count},${parseFloat(status.total || 0).toFixed(2)}\n`;
      });
      csv += '\n\n';
      
      // Top Customers
      csv += '=== TOP 20 CUSTOMERS ===\n';
      csv += 'Rank,Customer Name,Phone,Wilaya,Orders,Total Spent (DZD)\n';
      topCustomers.forEach((customer, index) => {
        csv += `${index + 1},"${customer.full_name.replace(/"/g, '""')}",${customer.phone},${customer.wilaya_name},${customer.order_count},${parseFloat(customer.total_spent).toFixed(2)}\n`;
      });
      csv += '\n\n';
      
      // Daily Sales
      csv += '=== DAILY SALES ===\n';
      csv += 'Date,Orders,Revenue (DZD)\n';
      dailySales.forEach(day => {
        csv += `${day.date},${day.orders},${parseFloat(day.revenue).toFixed(2)}\n`;
      });
      csv += '\n\n';
      
      // All Orders Detail
      csv += '=== ALL ORDERS DETAIL ===\n';
      csv += 'Order Number,Date,Customer Name,Phone,Wilaya,Address,Products,Subtotal (DZD),Shipping (DZD),Total (DZD),Status\n';
      exportData.allOrders.forEach(order => {
        const itemsStr = order.items.map(i => `${i.product} (${i.quantity}x ${i.size || ''} ${i.color || ''})`).join('; ');
        const date = new Date(order.date).toLocaleDateString();
        csv += `${order.orderNumber},${date},"${order.customer.name.replace(/"/g, '""')}",${order.customer.phone},${order.customer.wilaya},"${order.customer.address.replace(/"/g, '""')}","${itemsStr}",${order.subtotal},${order.shippingCost},${order.total},${order.status}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=mbmode-full-export-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } else {
      res.json(exportData);
    }
  } catch (error) {
    console.error('Analytics export error:', error);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

// ============================================
// REVIEW MANAGEMENT
// ============================================

// Get all reviews for admin management
router.get('/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all', sort = 'latest' } = req.query;

    let where = {};
    if (status === 'pending') where.is_approved = false;
    if (status === 'approved') where.is_approved = true;

    // Sorting
    let order = [['created_at', 'DESC']];
    if (sort === 'rating_high') order = [['rating', 'DESC'], ['created_at', 'DESC']];
    if (sort === 'rating_low') order = [['rating', 'ASC'], ['created_at', 'DESC']];

    const offset = (page - 1) * limit;

    const { count, rows } = await ProductReview.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name_fr', 'name_ar']
        }
      ],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      reviews: rows,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Approve a review
router.put('/reviews/:id/approve', async (req, res) => {
  try {
    const review = await ProductReview.findByPk(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await review.update({ is_approved: true });
    
    res.json({ message: 'Review approved successfully', review });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({ error: 'Failed to approve review' });
  }
});

// Reject a review
router.put('/reviews/:id/reject', async (req, res) => {
  try {
    const review = await ProductReview.findByPk(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await review.update({ is_approved: false });
    
    res.json({ message: 'Review rejected successfully', review });
  } catch (error) {
    console.error('Error rejecting review:', error);
    res.status(500).json({ error: 'Failed to reject review' });
  }
});

// Delete a review
router.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await ProductReview.findByPk(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await review.destroy();
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ============================================
// ORDER CLEANUP
// ============================================

// Manual trigger for order cleanup (cancel expired pending orders)
router.post('/orders/cleanup', async (req, res) => {
  try {
    const { cancelExpiredOrders } = require('../utils/orderCleanup');
    const result = await cancelExpiredOrders();
    
    res.json({
      message: 'Order cleanup completed',
      cancelled: result.cancelled,
      orders: result.orders || []
    });
  } catch (error) {
    console.error('Manual order cleanup error:', error);
    res.status(500).json({ error: 'Failed to run order cleanup' });
  }
});

// ============================================
// DEBUG ROUTE (TEMPORARY)
// ============================================

router.post('/debug-upload', bannerUpload.single('image'), async (req, res) => {
  try {
    console.log('=== DEBUG UPLOAD ===');
    console.log('req.file:', req.file);
    console.log('UPLOAD_DIR:', process.env.UPLOAD_DIR);
    console.log('File saved to:', req.file ? req.file.path : 'No file');
    
    res.json({
      success: true,
      file: req.file,
      uploadDir: process.env.UPLOAD_DIR,
      message: 'Debug upload successful'
    });
  } catch (error) {
    console.error('Debug upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// BANNERS
// ============================================

router.get('/banners', async (req, res) => {
  try {
    // Prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const banners = await Banner.findAll({
      order: [['sort_order', 'ASC']]
    });
    res.json(banners);
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

router.get('/banners/:id', async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    res.json(banner);
  } catch (error) {
    console.error('Get banner error:', error);
    res.status(500).json({ error: 'Failed to fetch banner' });
  }
});

router.post('/banners', bannerUpload.single('image'), async (req, res) => {
  try {
    const {
      title_fr, title_ar, subtitle_fr, subtitle_ar,
      link_url, sort_order, is_active, start_date, end_date
    } = req.body;

    const bannerData = {
      title_fr, title_ar, subtitle_fr, subtitle_ar,
      link_url, sort_order: sort_order || 0,
      is_active: is_active !== 'false',
      start_date: start_date || null,
      end_date: end_date || null,
      image: req.file ? `/uploads/banners/${req.file.filename}` : '/uploads/banners/default.jpg'
    };

    const banner = await Banner.create(bannerData);
    res.status(201).json(banner);
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ error: 'Failed to create banner', details: error.message });
  }
});

router.put('/banners/:id', bannerUpload.single('image'), async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    const {
      title_fr, title_ar, subtitle_fr, subtitle_ar,
      link_url, sort_order, is_active, start_date, end_date
    } = req.body;

    const updateData = {
      title_fr, title_ar, subtitle_fr, subtitle_ar,
      link_url, sort_order,
      is_active: is_active !== 'false',
      start_date: start_date || null,
      end_date: end_date || null
    };

    if (req.file) {
      // Delete old image if exists
      if (banner.image) {
        const oldImagePath = path.join(process.env.UPLOAD_DIR || './uploads', 'banners', path.basename(banner.image));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = `/uploads/banners/${req.file.filename}`;
    }

    await banner.update(updateData);
    res.json(banner);
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

router.delete('/banners/:id', async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    // Delete image file if exists
    if (banner.image) {
      const imagePath = path.join(process.env.UPLOAD_DIR || './uploads', 'banners', path.basename(banner.image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await banner.destroy();
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

router.put('/banners/:id/toggle', async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    await banner.update({ is_active: !banner.is_active });
    res.json(banner);
  } catch (error) {
    console.error('Toggle banner error:', error);
    res.status(500).json({ error: 'Failed to toggle banner' });
  }
});

module.exports = router;


