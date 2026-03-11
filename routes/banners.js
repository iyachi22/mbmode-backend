const express = require('express');
const router = express.Router();
const { Banner } = require('../models');

// GET /api/banners - Get active banners
router.get('/', async (req, res) => {
    try {
        const banners = await Banner.findAll({
            where: { is_active: true },
            order: [['sort_order', 'ASC']]
        });

        res.json(banners);
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({ error: 'Failed to fetch banners', details: error.message });
    }
});

module.exports = router;
