const sequelize = require('./config/database');
const User = require('./models/User');

async function updateUsersTable() {
  try {
    console.log('Updating users table with new fields...');
    
    // Sync the User model to add new columns
    await User.sync({ alter: true });
    
    console.log('✅ Users table updated successfully');
    
    // Check current users
    const userCount = await User.count();
    console.log(`Found ${userCount} existing users.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating users table:', error);
    process.exit(1);
  }
}

updateUsersTable();