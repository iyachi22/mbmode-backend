const sequelize = require('./config/database');

async function queryDatabase() {
    try {
        console.log('🔍 Querying database...');
        
        // Show all users
        const [users] = await sequelize.query("SELECT id, name, email, role FROM users");
        console.log('\n👥 Users:');
        users.forEach(user => {
            console.log(`   ${user.id}: ${user.name} (${user.email}) - ${user.role}`);
        });
        
        // Show all categories
        const [categories] = await sequelize.query("SELECT * FROM categories");
        console.log('\n📂 Categories:');
        categories.forEach(cat => {
            console.log(`   ${cat.id}: ${cat.name || 'No name'}`);
        });
        
        // Show all products
        const [products] = await sequelize.query("SELECT * FROM products");
        console.log('\n🛍️ Products:');
        products.forEach(prod => {
            console.log(`   ${prod.id}: ${prod.name || 'No name'} - $${prod.price}`);
        });
        
        // Show all orders
        const [orders] = await sequelize.query("SELECT * FROM orders");
        console.log('\n📦 Orders:');
        orders.forEach(order => {
            console.log(`   ${order.id}: ${order.order_number} - ${order.status} - $${order.total_amount}`);
        });
        
    } catch (error) {
        console.error('❌ Query failed:', error.message);
    } finally {
        await sequelize.close();
    }
}

queryDatabase();