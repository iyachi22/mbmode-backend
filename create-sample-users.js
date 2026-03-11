const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function createSampleUsers() {
  try {
    console.log('👥 Creating sample users for testing...\n');
    
    const sampleUsers = [
      {
        name: 'Ahmed Benali',
        email: 'ahmed.benali@example.com',
        password: 'user123',
        role: 'user',
        phone: '+213555123456',
        address: 'Rue de la Liberté, Alger'
      },
      {
        name: 'Fatima Khadra',
        email: 'fatima.khadra@example.com',
        password: 'user123',
        role: 'user',
        phone: '+213666789012',
        address: 'Boulevard Mohamed V, Oran'
      },
      {
        name: 'Omar Mansouri',
        email: 'omar.mansouri@example.com',
        password: 'user123',
        role: 'user',
        phone: '+213777345678',
        address: 'Avenue de l\'Indépendance, Constantine'
      },
      {
        name: 'Amina Boudiaf',
        email: 'amina.boudiaf@example.com',
        password: 'user123',
        role: 'user',
        phone: '+213888901234',
        address: 'Rue des Martyrs, Annaba'
      }
    ];

    let createdCount = 0;
    let existingCount = 0;

    for (const userData of sampleUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        where: { email: userData.email } 
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.name} (${userData.email}) already exists`);
        existingCount++;
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        is_blocked: false
      });

      console.log(`✅ Created user: ${user.name} (${user.email})`);
      createdCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Created: ${createdCount} new users`);
    console.log(`⚠️  Existing: ${existingCount} users already existed`);
    
    // Show total user count
    const totalUsers = await User.count();
    console.log(`👥 Total users in database: ${totalUsers}`);

    // Show breakdown by role
    const adminCount = await User.count({ where: { role: 'admin' } });
    const userCount = await User.count({ where: { role: 'user' } });
    
    console.log(`\n🎯 User breakdown:`);
    console.log(`👑 Admins: ${adminCount}`);
    console.log(`👤 Users: ${userCount}`);
    
    console.log(`\n💡 All sample users have password: user123`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample users:', error);
    process.exit(1);
  }
}

createSampleUsers();