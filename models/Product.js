const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    name_ar: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name_fr: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description_ar: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    description_fr: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    compare_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    category_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },
    sku: {
        type: DataTypes.STRING,
        unique: true
    },
    stock_quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    free_delivery: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'products',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Product;
