'use strict';

const { Router } = require('express');

/**
 * ProductController - mirrors ProductService.API.Controllers.ProductController
 * Base route: /api/products
 * No authentication required.
 */
function createProductRouter(productService) {
  const router = Router();

  /**
   * GET /api/products
   * Returns paginated list of all products
   * Query params: page (default: 1, min: 1), pageSize (default: 10, max: 200)
   * Response: data (product array), pagination (metadata)
   */
  router.get('/', async (req, res) => {
    try {
      const page = req.query.page;
      const pageSize = req.query.pageSize;

      // Validate input format before passing to service
      if (page !== undefined && isNaN(page)) {
        return res.status(400).json({ success: false, message: 'Invalid page parameter - must be a number' });
      }
      if (pageSize !== undefined && isNaN(pageSize)) {
        return res.status(400).json({ success: false, message: 'Invalid pageSize parameter - must be a number' });
      }

      const result = await productService.getAllProducts(page || 1, pageSize || 10);

      return res.json({
        success: true,
        message: `Retrieved ${result.products.length} of ${result.pagination.totalRecords} products`,
        data: result.products,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error('[ProductController] getAll error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
  });

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
