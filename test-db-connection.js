const { Sequelize } = require('sequelize');
require('dotenv').config();

async function testConnection() {
    console.log('🔄 Testing database connection...');
    
    let sequelize;
    
    if (process.env.DB_DIALECT === 'sqlite') {
        console.log('📋 SQLite Configuration:');
        console.log('   Storage:', process.env.DB_STORAGE);
        
        sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: process.env.DB_STORAGE || './database.sqlite',
            logging: false
        });
    } else {
        console.log('📋 MySQL Configuration:');
        console.log('   Host:', process.env.DB_HOST);
        console.log('   Port:', process.env.DB_PORT || 3306);
        console.log('   Database:', process.env.DB_NAME);
        console.log('   User:', process.env.DB_USER);
        console.log('   Password:', process.env.DB_PASSWORD ? '[SET - Length: ' + process.env.DB_PASSWORD.length + ']' : '[EMPTY]');
        
        sequelize = new Sequelize(
            process.env.DB_NAME,
            process.env.DB_USER,
            process.env.DB_PASSWORD,
            {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT || 3306,
                dialect: 'mysql',
                logging: false
            }
        );
    }

    try {
        await sequelize.authenticate();
        console.log('✅ Database connection successful!');
        
        // Test query - different for MySQL vs SQLite
        let results;
        if (process.env.DB_DIALECT === 'sqlite') {
            [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
            console.log('📊 Tables in database:', results.length);
            results.forEach(table => {
                console.log('   -', table.name);
            });
        } else {
            // MySQL query to show tables
            [results] = await sequelize.query("SHOW TABLES");
            console.log('📊 Tables in database:', results.length);
            results.forEach(table => {
                const tableName = Object.values(table)[0];
                console.log('   -', tableName);
            });
        }
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('🔍 Error details:', error.original?.code || 'Unknown error');
    } finally {
        await sequelize.close();
    }
}

testConnection();