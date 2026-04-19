const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('user', 'admin', 'superadmin'),
        defaultValue: 'user'
    },
    email_verified_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    is_blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    last_login_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = User;
