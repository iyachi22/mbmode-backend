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
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
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
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: (category) => {
            // Auto-generate slug from name_fr if not provided
            if (!category.slug && category.name_fr) {
                category.slug = category.name_fr
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
                    .replace(/\s+/g, '-') // Replace spaces with hyphens
                    .replace(/-+/g, '-') // Replace multiple hyphens with single
                    .trim('-'); // Remove leading/trailing hyphens
                
                // Add timestamp to ensure uniqueness
                category.slug += '-' + Date.now();
            }
        },
        beforeUpdate: (category) => {
            // Auto-generate slug from name_fr if not provided
            if (!category.slug && category.name_fr) {
                category.slug = category.name_fr
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
                    .replace(/\s+/g, '-') // Replace spaces with hyphens
                    .replace(/-+/g, '-') // Replace multiple hyphens with single
                    .trim('-'); // Remove leading/trailing hyphens
                
                // Add timestamp to ensure uniqueness
                category.slug += '-' + Date.now();
            }
        }
    }
});

module.exports = Category;
