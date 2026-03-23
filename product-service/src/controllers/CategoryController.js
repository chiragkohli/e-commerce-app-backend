'use strict';

const { Router } = require('express');

/**
 * CategoryController - mirrors ProductService.API.Controllers.CategoryController
 * Base route: /api/categories
 * No authentication required.
 */
function createCategoryRouter(categoryService, productService) {
  const router = Router();

  /** GET /api/categories */
  router.get('/', async (_req, res) => {
    try {
      const categories = await categoryService.getAllCategories();
      return res.json(categories);
    } catch (err) {
      console.error('[CategoryController] getAll error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  /** GET /api/categories/root */
  router.get('/root', async (_req, res) => {
    try {
      const cats = await categoryService.getRootCategories();
      return res.json(cats);
    } catch (err) {
      console.error('[CategoryController] getRootCategories error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  /**
   * GET /api/categories/filters-list
   * Returns hardcoded sizes/colors/ratings + DB brands & categories.
   */
  router.get('/filters-list', async (_req, res) => {
    try {
      const filters = await categoryService.getFiltersListResponse();
      return res.json(filters);
    } catch (err) {
      console.error('[CategoryController] filtersList error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  /**
   * GET /api/categories/filter-options
   * Full filter options with counts.
   */
  router.get('/filter-options', async (_req, res) => {
    try {
      const options = await productService.getFilterOptions();
      return res.json({ success: true, message: 'Filter options retrieved', data: options });
    } catch (err) {
      console.error('[CategoryController] filterOptions error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  /** GET /api/categories/parent/:parentId? */
  router.get('/parent/:parentId?', async (req, res) => {
    try {
      const pid = req.params.parentId;
      const cats = await categoryService.getCategoriesByParentId(pid != null ? pid : null);
      return res.json(cats);
    } catch (err) {
      console.error('[CategoryController] getByParent error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  /** GET /api/categories/:id */
  router.get('/:id', async (req, res) => {
    try {
      const cat = await categoryService.getCategoryById(req.params.id);
      if (!cat) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      return res.json(cat);
    } catch (err) {
      console.error('[CategoryController] getById error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  return router;
}

module.exports = createCategoryRouter;
