'use strict';

const { Router } = require('express');
const orderService = require('../services/OrderService');

const router = Router();

/**
 * GET /api/orders/health
 */
router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'OrderService is healthy' });
});

/**
 * GET /api/orders/:id
 * Returns the order if it belongs to the authenticated user.
 */
router.get('/:id', async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.userId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.json({ success: true, message: 'Order retrieved', data: order });
  } catch (err) {
    console.error('[OrderController] getOrderById error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/orders
 * Query: page=1&pageSize=50
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize || '50', 10)));
    const result = await orderService.getUserOrders(req.userId, page, pageSize);
    return res.json({ success: true, message: 'Orders retrieved', data: result });
  } catch (err) {
    console.error('[OrderController] getUserOrders error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/orders
 * Body: CreateOrderRequestDto
 */
router.post('/', async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body, req.userId);
    return res.status(201).json({ success: true, message: 'Order created', data: order });
  } catch (err) {
    console.error('[OrderController] createOrder error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
