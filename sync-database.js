const sequelize = require('./config/database');
const { User, Product, Category, Banner, Order, OrderItem, ProductImage, ProductVariant, ProductReview } = require('./models');

async function syncDatabase() {
    try {
        console.log('🔄 Syncing database models...');
        
        // Test connection
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        // Sync all models (create tables if they don't exist)
        await sequelize.sync({ alter: true }); // Use alter to modify existing tables
        console.log('✅ Database models synchronized');
        
        console.log('🎉 Database sync completed successfully!');
        
    } catch (error) {
        console.error('❌ Database sync failed:', error);
    } finally {
        await sequelize.close();
    }
}

syncDatabase();