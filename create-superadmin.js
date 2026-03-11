const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
  try {
    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({
      where: { email: 'khouaniyoussef@gmail.com' }
    });

    if (existingSuperAdmin) {
      // Update existing user to superadmin
      await existingSuperAdmin.update({ role: 'superadmin' });
      console.log('✅ Updated existing user to superadmin:', existingSuperAdmin.email);
      return;
    }

    // Create new superadmin user
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);
    
    const superAdmin = await User.create({
      name: 'Youssef Khouani',
      email: 'khouaniyoussef@gmail.com',
      password: hashedPassword,
      role: 'superadmin',
      email_verified_at: new Date(),
      is_blocked: false
    });

    console.log('✅ Superadmin created successfully:');
    console.log('Email:', superAdmin.email);
    console.log('Password: SuperAdmin123! (Please change this after first login)');
    console.log('Role:', superAdmin.role);
  } catch (error) {
    console.error('❌ Error creating superadmin:', error);
  }
}

// Run the function
createSuperAdmin().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});