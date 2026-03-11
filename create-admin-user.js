const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Admin credentials
    const adminData = {
      name: 'Admin',
      email: 'admin@mbmode.com',
      password: 'admin123',
      role: 'admin'
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      where: { email: adminData.email } 
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Password: admin123');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Create admin user
    const admin = await User.create({
      name: adminData.name,
      email: adminData.email,
      password: hashedPassword,
      role: adminData.role,
      is_blocked: false
    });

    console.log('✅ Admin user created successfully!');
    console.log('👤 Name:', admin.name);
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: admin123');
    console.log('🎯 Role:', admin.role);
    console.log('🆔 ID:', admin.id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();