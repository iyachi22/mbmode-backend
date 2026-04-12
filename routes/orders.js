const express = require('express');
const router = express.Router();
const { Order, OrderItem, Product } = require('../models');
const { generateOrderPDF } = require('../utils/pdfGenerator');
const { sendOrderConfirmation } = require('../utils/emailService');
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs');

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
    try {
        const {
            customer_name,
            customer_email,
            customer_phone,
            wilaya_id,
            wilaya_name,
            commune,
            address,
            items,
            subtotal,
            shipping_cost,
            total,
            notes
        } = req.body;

        // Check if user is authenticated (optional)
        let user_id = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const jwt = require('jsonwebtoken');
                const token = authHeader.substring(7);
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                user_id = decoded.userId;
                console.log('✅ Order created by authenticated user:', user_id);
            } catch (error) {
                console.log('ℹ️ Order created by guest user (invalid/expired token)');
            }
        } else {
            console.log('ℹ️ Order created by guest user (no token)');
        }

        // Generate order number
        const order_number = 'ORD-' + Date.now();

        // Create order
        const order = await Order.create({
            order_number,
            user_id, // Associate with user if logged in
            full_name: customer_name,
            email: customer_email,
            phone: customer_phone,
            wilaya_id: wilaya_id,
            wilaya_name: wilaya_name || `Wilaya ${wilaya_id}`,
            commune: commune || '',
            address,
            subtotal: subtotal,
            shipping_price: shipping_cost || 0,
            total_amount: total,
            payment_method: 'cash_on_delivery',
            payment_status: 'pending',
            status: 'pending',
            notes: notes || null
        });

        // Create order items
        let createdOrderItems = [];
        if (items && items.length > 0) {
            const orderItems = items.map(item => ({
                order_id: order.id,
                product_id: item.product_id,
                variant_id: item.variant_id || null,
                quantity: item.quantity,
                price: item.price
            }));

            createdOrderItems = await OrderItem.bulkCreate(orderItems);
            
            // Load products for PDF
            for (let item of createdOrderItems) {
                item.product = await Product.findByPk(item.product_id);
            }
        }

        // Generate PDF receipt
        let pdfPath = null;
        try {
            pdfPath = await generateOrderPDF(order, createdOrderItems);
            console.log('✅ PDF generated:', pdfPath);
        } catch (pdfError) {
            console.error('❌ Error generating PDF:', pdfError);
        }

        // Send email confirmation (non-blocking)
        sendOrderConfirmation(order, createdOrderItems, pdfPath).catch(emailError => {
            console.error('❌ Error sending email:', emailError.message);
        });

        res.status(201).json({
            message: 'Order created successfully',
            id: order.id,
            order_number: order.order_number,
            pdfUrl: pdfPath ? `/api/orders/${order.id}/receipt` : null
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ 
            error: 'Failed to create order',
            details: error.message 
        });
    }
});

// GET /api/orders/:id/receipt - Download PDF receipt
router.get('/:id/receipt', async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Product, as: 'product' }]
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Generate PDF on the fly
        const pdfPath = await generateOrderPDF(order, order.items);
        
        // Send file and delete after
        res.download(pdfPath, `commande-${order.order_number}.pdf`, (err) => {
            if (err) {
                console.error('Error sending PDF:', err);
            }
            // Clean up temp file
            if (fs.existsSync(pdfPath)) {
                fs.unlinkSync(pdfPath);
            }
        });
    } catch (error) {
        console.error('Error downloading receipt:', error);
        res.status(500).json({ error: 'Failed to download receipt' });
    }
});

module.exports = router;
