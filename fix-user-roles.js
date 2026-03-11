const { User } = require('./models');

async function fixUserRoles() {
  try {
    console.log('🔧 Fixing user roles...\n');
    
    // Find users with null or empty roles
    const usersWithoutRoles = await User.findAll({
      where: {
        role: [null, '']
      }
    });

    if (usersWithoutRoles.length === 0) {
      console.log('✅ All users have valid roles!');
      return;
    }

    console.log(`Found ${usersWithoutRoles.length} users without proper roles:`);
    
    for (const user of usersWithoutRoles) {
      console.log(`- ${user.name} (${user.email}) - Role: "${user.role}"`);
      
      // Update to 'user' role
      await user.update({ role: 'user' });
      console.log(`  ✅ Updated to 'user' role`);
    }

    console.log('\n🎉 All user roles fixed!');
    
    // Show updated user list
    console.log('\n📋 Updated user list:');
    const allUsers = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'is_blocked'],
      order: [['created_at', 'DESC']]
    });

    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - Status: ${user.is_blocked ? 'Blocked' : 'Active'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing user roles:', error);
    process.exit(1);
  }
}

fixUserRoles();