const { Order } = require('../models');
const { Op } = require('sequelize');

/**
 * Auto-cancel pending orders older than 3 days
 */
async function cancelExpiredOrders() {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Find all pending orders older than 3 days
    const expiredOrders = await Order.findAll({
      where: {
        status: 'pending',
        created_at: {
          [Op.lt]: threeDaysAgo
        }
      }
    });

    if (expiredOrders.length === 0) {
      console.log('No expired orders to cancel');
      return { cancelled: 0 };
    }

    // Cancel each expired order
    const cancelPromises = expiredOrders.map(order =>
      order.update({
        status: 'cancelled',
        cancelled_at: new Date(),
        notes: (order.notes || '') + '\n[AUTO-CANCELLED] Order automatically cancelled after 3 days without confirmation'
      })
    );

    await Promise.all(cancelPromises);

    console.log(`Auto-cancelled ${expiredOrders.length} expired orders`);
    return { 
      cancelled: expiredOrders.length,
      orders: expiredOrders.map(o => o.order_number)
    };
  } catch (error) {
    console.error('Error cancelling expired orders:', error);
    throw error;
  }
}

/**
 * Start the cleanup scheduler
 * Runs every 6 hours
 */
function startOrderCleanupScheduler() {
  // Run immediately on start
  cancelExpiredOrders();

  // Then run every 6 hours (6 * 60 * 60 * 1000 ms)
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  setInterval(() => {
    console.log('Running scheduled order cleanup...');
    cancelExpiredOrders();
  }, SIX_HOURS);

  console.log('Order cleanup scheduler started (runs every 6 hours)');
}

module.exports = {
  cancelExpiredOrders,
  startOrderCleanupScheduler
};
