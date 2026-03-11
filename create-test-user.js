const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ where: { email: 'test@test.com' } });
    if (existingUser) {
      console.log('Test user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: hashedPassword,
      role: 'user',
      is_blocked: false
    });

    console.log('Test user created successfully:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    // Also create admin user
    const existingAdmin = await User.findOne({ where: { email: 'admin@test.com' } });
    if (!existingAdmin) {
      const adminHashedPassword = await bcrypt.hash('admin123', 10);
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: adminHashedPassword,
        role: 'admin',
        is_blocked: false
      });

      console.log('Admin user created successfully:', {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();