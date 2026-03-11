const sequelize = require('./config/database');
const ShippingRate = require('./models/ShippingRate');

async function createShippingTable() {
  try {
    console.log('Creating shipping_rates table...');
    
    // Create the table
    await ShippingRate.sync({ force: false });
    
    console.log('✅ shipping_rates table created successfully');
    
    // Check if we need to initialize data
    const count = await ShippingRate.count();
    if (count === 0) {
      console.log('No shipping rates found. You can initialize them via the admin panel.');
    } else {
      console.log(`Found ${count} existing shipping rates.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating shipping_rates table:', error);
    process.exit(1);
  }
}

createShippingTable();