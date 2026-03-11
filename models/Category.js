const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
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
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    size_type: {
        type: DataTypes.ENUM('clothing', 'shoes', 'accessories', 'other'),
        defaultValue: 'other'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'categories',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Category;
