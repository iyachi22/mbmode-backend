const mysql = require('mysql2/promise');

async function createDatabase() {
    try {
        console.log('🔄 Creating MySQL database...');
        
        // Connect to MySQL without specifying database
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: ''
        });
        
        // Create database if it doesn't exist
        await connection.execute('CREATE DATABASE IF NOT EXISTS mb13_store');
        console.log('✅ Database "mb13_store" created or already exists');
        
        await connection.end();
        console.log('🎉 Database setup completed!');
        console.log('📍 You can now access it via phpMyAdmin: http://localhost/phpmyadmin');
        
    } catch (error) {
        console.error('❌ Error creating database:', error.message);
        console.log('💡 Make sure XAMPP MySQL is running');
    }
}

createDatabase();