'use strict';

const { Router } = require('express');
const cartService = require('../services/CartService');

const router = Router();

/**
 * GET /api/cart/health  (anonymous)
 */
router.get('/health', (_req, res) => {
  res.json({ message: 'CartService is healthy' });
});

/**
 * GET /api/cart
 * Returns the authenticated user's cart.
 */
router.get('/', async (req, res) => {
  try {
    const cart = await cartService.getCart(req.userId);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    return res.json({ success: true, message: 'Cart retrieved', data: cart });
  } catch (err) {
    console.error('[CartController] getCart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/cart/add
 * Body: { productId, productName, price, quantity, image? }
 */
router.post('/add', async (req, res) => {
  try {
    const { productId, productName, price, quantity } = req.body;
    if (!productId || !productName || price == null || !quantity) {
      return res.status(400).json({ success: false, message: 'productId, productName, price, and quantity are required' });
    }
    const cart = await cartService.addItem(req.userId, req.body);
    return res.json({ success: true, message: 'Item added to cart', data: cart });
  } catch (err) {
    console.error('[CartController] addItem error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/cart/remove
 * Body: { productId }
 */
router.post('/remove', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }
    const cart = await cartService.removeItem(req.userId, req.body);
    return res.json({ success: true, message: 'Item removed from cart', data: cart });
  } catch (err) {
    console.error('[CartController] removeItem error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * DELETE /api/cart/clear
 */
router.delete('/clear', async (req, res) => {
  try {
    const deleted = await cartService.clearCart(req.userId);
    return res.json({ success: true, message: 'Cart cleared', data: deleted });
  } catch (err) {
    console.error('[CartController] clearCart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/cart/merge
 * Body: { items: [{ productId, productName, price, quantity, image? }] }
 */
router.post('/merge', async (req, res) => {
  try {
    const result = await cartService.mergeCart(req.userId, req.body);
    return res.json({ success: true, message: result.message, data: result });
  } catch (err) {
    console.error('[CartController] mergeCart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
