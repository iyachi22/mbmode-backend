const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DB_HOST', 'DB_NAME', 'DB_USER'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Please check your .env file');
    process.exit(1);
}

if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this') {
    console.warn('⚠️  WARNING: Using default JWT_SECRET. Please change it in production!');
}

// Initialize Express
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = process.env.CORS_ORIGIN 
            ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
            : ['*'];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files (configurable upload directory)
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(uploadDir));

// Import routes
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const bannerRoutes = require('./routes/banners');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const shippingRoutes = require('./routes/shipping');

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/user', require('./routes/user'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'mbmode API is running' });
});

// Public contact info endpoint
app.get('/api/contact', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const contactConfigPath = path.join(__dirname, 'config', 'contact.json');
    
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
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Import order cleanup scheduler
const { startOrderCleanupScheduler } = require('./utils/orderCleanup');

// Start server
app.listen(PORT, () => {
    console.log(`🚀 mbmode API server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    
    // Start order cleanup scheduler
    startOrderCleanupScheduler();
});