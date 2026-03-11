const express = require('express');
const router = express.Router();
const { Category } = require('../models');

// GET /api/categories - List all active categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: { is_active: true },
            order: [['name_fr', 'ASC']]
        });

        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

module.exports = router;
