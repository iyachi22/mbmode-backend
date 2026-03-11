const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function createTestUsers() {
    try {
        console.log('🔄 Creating test users...');
        
        // Create admin user
        const adminExists = await User.findOne({ where: { email: 'admin@mbmode.com' } });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                name: 'Admin User',
                email: 'admin@mbmode.com',
                password: hashedPassword,
                role: 'admin',
                created_at: new Date(),
                updated_at: new Date()
            });
            console.log('✅ Admin user created: admin@mbmode.com / admin123');
        } else {
            console.log('ℹ️ Admin user already exists');
        }
        
        // Create the user that tried to login
        const userExists = await User.findOne({ where: { email: 'khouaniyoussef@gmail.com' } });
        if (!userExists) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            await User.create({
                name: 'Youssef Khouani',
                email: 'khouaniyoussef@gmail.com',
                password: hashedPassword,
                role: 'user',
                created_at: new Date(),
                updated_at: new Date()
            });
            console.log('✅ User created: khouaniyoussef@gmail.com / password123');
        } else {
            console.log('ℹ️ User already exists');
        }
        
        // Create a test regular user
        const testUserExists = await User.findOne({ where: { email: 'user@mbmode.com' } });
        if (!testUserExists) {
            const hashedPassword = await bcrypt.hash('user123', 10);
            await User.create({
                name: 'Test User',
                email: 'user@mbmode.com',
                password: hashedPassword,
                role: 'user',
                created_at: new Date(),
                updated_at: new Date()
            });
            console.log('✅ Test user created: user@mbmode.com / user123');
        } else {
            console.log('ℹ️ Test user already exists');
        }
        
        console.log('🎉 Test users setup completed!');
        console.log('');
        console.log('📋 Available login credentials:');
        console.log('   Admin: admin@mbmode.com / admin123');
        console.log('   User: khouaniyoussef@gmail.com / password123');
        console.log('   Test: user@mbmode.com / user123');
        
    } catch (error) {
        console.error('❌ Error creating test users:', error);
    }
}

createTestUsers();