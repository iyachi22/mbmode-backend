const Product = require('./Product');
const Category = require('./Category');
const ProductImage = require('./ProductImage');
const ProductVariant = require('./ProductVariant');
const ProductReview = require('./ProductReview');
const Banner = require('./Banner');
const User = require('./User');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const ShippingRate = require('./ShippingRate');
const UserActivity = require('./UserActivity');

// Define associations
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(ProductReview, { foreignKey: 'product_id', as: 'reviews' });
ProductReview.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

ProductReview.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(ProductReview, { foreignKey: 'user_id', as: 'reviews' });

Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

UserActivity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(UserActivity, { foreignKey: 'user_id', as: 'activities' });

module.exports = {
    Product,
    Category,
    ProductImage,
    ProductVariant,
    ProductReview,
    Banner,
    User,
    Order,
    OrderItem,
    ShippingRate,
    UserActivity
};
