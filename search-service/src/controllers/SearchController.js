'use strict';

const { Router } = require('express');

/**
 * SearchController - mirrors SearchService.API.Controllers.SearchController
 * Base route: /api/search
 * No authentication required.
 */
function createSearchRouter(searchService) {
  const router = Router();

  /**
   * GET /api/search
   * Query params: query, page, size, category, subCategory, brands,
   *               priceMin, priceMax, minRating, colors, sizes, gender,
   *               sortBy, inStockOnly
   */
  router.get('/', async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const size = Math.min(1000, Math.max(1, parseInt(req.query.size || '50', 10)));

      if (isNaN(page) || page < 1) {
        return res.status(400).json({ success: false, message: 'page must be >= 1' });
      }
      if (isNaN(size) || size < 1 || size > 1000) {
        return res.status(400).json({ success: false, message: 'size must be between 1 and 1000' });
      }

      const result = await searchService.search({ ...req.query, page, size });
      return res.json({
        success: true,
        message: 'Search completed',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error('[SearchController] search error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  return router;
}

module.exports = createSearchRouter;
