const sequelize = require('./config/database');
const { UserActivity } = require('./models');

async function createUserActivitiesTable() {
  try {
    console.log('Creating user_activities table...');
    
    // Create the table
    await UserActivity.sync({ force: false });
    
    console.log('✅ User activities table created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user activities table:', error);
    process.exit(1);
  }
}

createUserActivitiesTable();