'use strict';

const categoryRepository = require('../repositories/CategoryRepository');
const productRepository = require('../repositories/ProductRepository');

class CategoryService {
  constructor(cacheService) {
    this._cache = cacheService;
  }

  async getAllCategories() {
    const cached = await this._cache.getAsync('categories:all');
    if (cached) return cached;
    const cats = await categoryRepository.getAll();
    await this._cache.setAsync('categories:all', cats);
    return cats;
  }

  async getCategoryById(id) {
    const cacheKey = `category:${id}`;
    const cached = await this._cache.getAsync(cacheKey);
    if (cached) return cached;
    const cat = await categoryRepository.getById(Number(id));
    if (cat) await this._cache.setAsync(cacheKey, cat);
    return cat;
  }

  async getCategoriesByParentId(parentId) {
    const pid = parentId != null ? Number(parentId) : null;
    return categoryRepository.getByParentId(pid);
  }

  async getRootCategories() {
    return categoryRepository.getByParentId(null);
  }

  async getFiltersListResponse() {
    const [brands, categories] = await Promise.all([
      productRepository.getUniqueBrands(20),
      this.getAllCategories(),
    ]);

    return {
      sizes: ['S', 'M', 'L', 'XL', 'Free Size', '28', '30', '32', '34'],
      colors: ['Black', 'Blue', 'Green', 'Grey', 'Pink', 'Red', 'White'],
      ratings: [2, 3, 4, 5],
      minPrice: 0,
      maxPrice: 10000,
      brands,
      categories,
    };
  }
}

module.exports = CategoryService;
