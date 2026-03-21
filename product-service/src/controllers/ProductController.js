'use strict';

const { Router } = require('express');

/**
 * ProductController – mirrors ProductService.API.Controllers.ProductController
 * Base route: /api/products
 * No authentication required.
 */
function createProductRouter(productService) {
  const router = Router();

  /**
   * GET /api/products/:id
   */
  router.get('/:id', async (req, res) => {
    try {
      const product = await productService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.json({ success: true, message: 'Product retrieved', data: product });
    } catch (err) {
      console.error('[ProductController] getById error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  return router;
}

module.exports = createProductRouter;
