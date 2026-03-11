const { User } = require('./models');

async function listUsers() {
  try {
    console.log('📋 Listing all users...\n');
    
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'is_blocked', 'last_login_at', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    if (users.length === 0) {
      console.log('No users found.');
      return;
    }

    console.log('👥 Users in database:');
    console.log('='.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🎯 Role: ${user.role}`);
      console.log(`   🔒 Status: ${user.is_blocked ? '❌ Blocked' : '✅ Active'}`);
      console.log(`   🕒 Last Login: ${user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}`);
      console.log(`   📅 Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });

    // Show admin accounts specifically
    const admins = users.filter(user => user.role === 'admin');
    if (admins.length > 0) {
      console.log('🔑 ADMIN ACCOUNTS:');
      console.log('='.repeat(40));
      admins.forEach(admin => {
        console.log(`👤 ${admin.name} (${admin.email})`);
        console.log(`   Status: ${admin.is_blocked ? '❌ Blocked' : '✅ Active'}`);
      });
      console.log('');
      console.log('💡 Default admin password: admin123');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing users:', error);
    process.exit(1);
  }
}

listUsers();