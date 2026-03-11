const express = require('express');
const router = express.Router();
const { Product, Category, ProductImage, ProductVariant, ProductReview } = require('../models');
const { Op } = require('sequelize');

// GET /api/products - List all products with filters
router.get('/', async (req, res) => {
    try {
        const { 
            category, 
            search, 
            featured, 
            min_price, 
            max_price,
            sort = 'latest',
            page = 1,
            limit = 12
        } = req.query;

        const where = {
            is_active: true
        };



        // Filter by category
        if (category) {
            where.category_id = category;
        }

        // Search
        if (search) {
            where[Op.or] = [
                { name_ar: { [Op.like]: `%${search}%` } },
                { name_fr: { [Op.like]: `%${search}%` } }
            ];
        }

        // Featured filter
        if (featured === '1' || featured === 'true') {
            where.is_featured = true;
        }

        // Price range
        if (min_price) {
            where.price = { ...where.price, [Op.gte]: parseFloat(min_price) };
        }
        if (max_price) {
            where.price = { ...where.price, [Op.lte]: parseFloat(max_price) };
        }

        // Sorting
        let order = [['created_at', 'DESC']];
        if (sort === 'price_low') order = [['price', 'ASC']];
        if (sort === 'price_high') order = [['price', 'DESC']];
        if (sort === 'name') order = [['name_fr', 'ASC']];

        const offset = (page - 1) * limit;

        const { count, rows } = await Product.findAndCountAll({
            where,
            include: [
                { model: Category, as: 'category' },
                { model: ProductImage, as: 'images' },
                { model: ProductVariant, as: 'variants' }
            ],
            order,
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true,
            col: 'id'
        });



        res.json({
            products: rows,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/products/featured - Get featured products
router.get('/featured', async (req, res) => {
    try {
        let products = await Product.findAll({
            where: {
                is_active: true,
                is_featured: true,
                stock_quantity: { [Op.gt]: 0 }
            },
            include: [
                { model: ProductImage, as: 'images' },
                { model: ProductVariant, as: 'variants' }
            ],
            limit: 8,
            order: [['created_at', 'DESC']]
        });

        // Fallback: if no featured products, return latest products
        if (products.length === 0) {
            products = await Product.findAll({
                where: {
                    is_active: true,
                    stock_quantity: { [Op.gt]: 0 }
                },
                include: [
                    { model: ProductImage, as: 'images' },
                    { model: ProductVariant, as: 'variants' }
                ],
                limit: 8,
                order: [['created_at', 'DESC']]
            });
        }

        res.json(products);
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({ error: 'Failed to fetch featured products', details: error.message });
    }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { 
                id: req.params.id,
                is_active: true
            },
            include: [
                { model: Category, as: 'category' },
                { model: ProductImage, as: 'images' },
                { model: ProductVariant, as: 'variants' }
            ]
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Get review statistics
        const reviewStats = await ProductReview.findOne({
            where: { product_id: req.params.id, is_approved: true },
            attributes: [
                [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'averageRating'],
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalReviews']
            ],
            raw: true
        });

        const productData = product.toJSON();
        productData.averageRating = reviewStats?.averageRating ? parseFloat(reviewStats.averageRating).toFixed(1) : 0;
        productData.totalReviews = reviewStats?.totalReviews ? parseInt(reviewStats.totalReviews) : 0;

        res.json(productData);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

module.exports = router;
