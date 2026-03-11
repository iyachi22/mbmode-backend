const express = require('express');
const router = express.Router();
const { ProductReview, User, Product } = require('../models');
const { Op } = require('sequelize');

// GET /api/reviews/product/:productId - Get reviews for a product
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, sort = 'latest' } = req.query;

        const where = {
            product_id: productId,
            is_approved: true
        };

        // Sorting
        let order = [['created_at', 'DESC']];
        if (sort === 'rating_high') order = [['rating', 'DESC'], ['created_at', 'DESC']];
        if (sort === 'rating_low') order = [['rating', 'ASC'], ['created_at', 'DESC']];

        const offset = (page - 1) * limit;

        const { count, rows } = await ProductReview.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Calculate average rating
        const avgRating = await ProductReview.findOne({
            where: { product_id: productId, is_approved: true },
            attributes: [
                [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'average']
            ],
            raw: true
        });

        // Get rating distribution
        const ratingDistribution = await ProductReview.findAll({
            where: { product_id: productId, is_approved: true },
            attributes: [
                'rating',
                [require('sequelize').fn('COUNT', require('sequelize').col('rating')), 'count']
            ],
            group: ['rating'],
            raw: true
        });

        res.json({
            reviews: rows,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit),
            averageRating: avgRating?.average ? parseFloat(avgRating.average).toFixed(1) : 0,
            totalReviews: count,
            ratingDistribution: ratingDistribution.reduce((acc, item) => {
                acc[item.rating] = parseInt(item.count);
                return acc;
            }, {})
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews', details: error.message });
    }
});

// POST /api/reviews - Create a new review (requires authentication)
router.post('/', async (req, res) => {
    try {
        const { product_id, user_id, rating, title, comment } = req.body;

        // Validate required fields
        if (!product_id || !user_id || !rating) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Check if product exists
        const product = await Product.findByPk(product_id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if user already reviewed this product
        const existingReview = await ProductReview.findOne({
            where: { product_id, user_id }
        });

        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this product' });
        }

        // Create review
        const review = await ProductReview.create({
            product_id,
            user_id,
            rating,
            title,
            comment,
            is_approved: true, // Auto-approve reviews
            is_verified_purchase: false // TODO: Check if user purchased this product
        });

        res.status(201).json({
            message: 'Review submitted successfully and is now visible!',
            review
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Failed to create review', details: error.message });
    }
});

// GET /api/reviews/:id - Get single review
router.get('/:id', async (req, res) => {
    try {
        const review = await ProductReview.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name']
                },
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name_fr', 'name_ar']
                }
            ]
        });

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.json(review);
    } catch (error) {
        console.error('Error fetching review:', error);
        res.status(500).json({ error: 'Failed to fetch review' });
    }
});

// PUT /api/reviews/:id - Update review (user can edit their own review)
router.put('/:id', async (req, res) => {
    try {
        const { rating, title, comment } = req.body;
        const review = await ProductReview.findByPk(req.params.id);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // TODO: Add authentication check to ensure user owns this review

        await review.update({
            rating: rating || review.rating,
            title: title !== undefined ? title : review.title,
            comment: comment !== undefined ? comment : review.comment,
            is_approved: false // Reset approval status when edited
        });

        res.json({
            message: 'Review updated successfully. It will be reviewed again.',
            review
        });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ error: 'Failed to update review' });
    }
});

// DELETE /api/reviews/:id - Delete review
router.delete('/:id', async (req, res) => {
    try {
        const review = await ProductReview.findByPk(req.params.id);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // TODO: Add authentication check to ensure user owns this review or is admin

        await review.destroy();

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

module.exports = router;
