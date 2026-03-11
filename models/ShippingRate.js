const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShippingRate = sequelize.define('ShippingRate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  wilaya_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  wilaya_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  wilaya_name_ar: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  shipping_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 500.00
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'shipping_rates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ShippingRate;