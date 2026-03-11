const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Helper function to get shipping config
const getShippingConfig = () => {
    try {
        const configPath = path.join(__dirname, '../config/shipping.json');
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        }
    } catch (error) {
        console.error('Error reading shipping config:', error);
    }
    
    // Default config if file doesn't exist or error
    return {
        default_price: 600,
        free_delivery_threshold: 10000,
        wilaya_prices: {}
    };
};

// GET /api/shipping/config - Get shipping configuration
router.get('/config', async (req, res) => {
    try {
        const config = getShippingConfig();
        res.json(config);
    } catch (error) {
        console.error('Error fetching shipping config:', error);
        res.status(500).json({ error: 'Failed to fetch shipping configuration' });
    }
});

// GET /api/shipping/price/:wilaya - Get shipping price for specific wilaya
router.get('/price/:wilaya', async (req, res) => {
    try {
        const { wilaya } = req.params;
        const { total = 0 } = req.query;
        
        const config = getShippingConfig();
        const cartTotal = parseFloat(total) || 0;
        
        // Check if cart total exceeds free delivery threshold
        if (cartTotal >= config.free_delivery_threshold) {
            return res.json({
                wilaya,
                price: 0,
                is_free: true,
                reason: 'free_delivery_threshold'
            });
        }
        
        // Get wilaya-specific price or default
        const price = config.wilaya_prices[wilaya] || config.default_price;
        
        res.json({
            wilaya,
            price: parseFloat(price),
            is_free: false,
            reason: 'standard_rate'
        });
    } catch (error) {
        console.error('Error calculating shipping price:', error);
        res.status(500).json({ error: 'Failed to calculate shipping price' });
    }
});

// PUT /api/shipping/config - Update shipping configuration (Admin only)
router.put('/config', async (req, res) => {
    try {
        const { default_price, free_delivery_threshold, wilaya_prices } = req.body;
        
        // Validate input
        if (typeof default_price !== 'number' || default_price < 0) {
            return res.status(400).json({ error: 'Invalid default_price' });
        }
        
        if (typeof free_delivery_threshold !== 'number' || free_delivery_threshold < 0) {
            return res.status(400).json({ error: 'Invalid free_delivery_threshold' });
        }
        
        const config = {
            default_price,
            free_delivery_threshold,
            wilaya_prices: wilaya_prices || {}
        };
        
        // Save to file
        const configPath = path.join(__dirname, '../config/shipping.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        res.json({ message: 'Shipping configuration updated successfully', config });
    } catch (error) {
        console.error('Error updating shipping config:', error);
        res.status(500).json({ error: 'Failed to update shipping configuration' });
    }
});

module.exports = router;