const sequelize = require('./config/database');
const { User, Product, Category, Banner, Order, OrderItem, ProductImage, ProductVariant, ProductReview } = require('./models');

async function initializeDatabase() {
    try {
        console.log('🔄 Initializing local database...');
        
        // Test connection
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        // Sync all models (create tables)
        await sequelize.sync({ force: false }); // Set to true to recreate tables
        console.log('✅ Database tables synchronized');
        
        // Create a test admin user
        const adminExists = await User.findOne({ where: { email: 'admin@mbmode.com' } });
        if (!adminExists) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await User.create({
                name: 'Admin User',
                email: 'admin@mbmode.com',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('✅ Admin user created: admin@mbmode.com / admin123');
        }
        
        // Create a test regular user
        const userExists = await User.findOne({ where: { email: 'user@mbmode.com' } });
        if (!userExists) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('user123', 10);
            
            await User.create({
                name: 'Test User',
                email: 'user@mbmode.com',
                password: hashedPassword,
                role: 'user'
            });
            console.log('✅ Test user created: user@mbmode.com / user123');
        }
        
        // Create sample categories
        const categoryExists = await Category.findOne();
        if (!categoryExists) {
            await Category.bulkCreate([
                { name: 'T-Shirts', slug: 't-shirts', size_type: 'clothing' },
                { name: 'Jeans', slug: 'jeans', size_type: 'clothing' },
                { name: 'Shoes', slug: 'shoes', size_type: 'shoes' },
                { name: 'Accessories', slug: 'accessories', size_type: 'none' }
            ]);
            console.log('✅ Sample categories created');
        }
        
        console.log('🎉 Local database initialized successfully!');
        console.log('📝 You can now start the server with: npm start');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    } finally {
        await sequelize.close();
    }
}

initializeDatabase();