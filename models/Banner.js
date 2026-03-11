const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Banner = sequelize.define('Banner', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    title_ar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    title_fr: {
        type: DataTypes.STRING,
        allowNull: true
    },
    subtitle_ar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    subtitle_fr: {
        type: DataTypes.STRING,
        allowNull: true
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false
    },
    button_text_ar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    button_text_fr: {
        type: DataTypes.STRING,
        allowNull: true
    },
    link_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'banners',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Banner;
