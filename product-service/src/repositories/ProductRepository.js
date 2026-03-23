'use strict';

const { getDb } = require('../data/db');
const SearchFilter = require('@ecom/shared/search/SearchFilter');

function PRODUCTS() {
  return getDb().collection(process.env.MONGODB_PRODUCTS_COLLECTION || 'products');
}

/** Build a MongoDB filter document from a SearchFilter */
function buildMongoFilter(filter) {
  const query = {};

  // Text search: regex across name, description, brand
  if (filter.query) {
    const regex = { $regex: filter.query, $options: 'i' };
    query.$or = [
      { name: regex },
      { description: regex },
      { brand: regex },
    ];
  }

  if (filter.categories?.length) query.category = { $in: filter.categories };
  if (filter.subCategories?.length) query.subcategory = { $in: filter.subCategories };
  if (filter.brands?.length) query.brand = { $in: filter.brands };
  if (filter.genders?.length) query.gender = { $in: filter.genders };
  if (filter.colors?.length) query.color = { $elemMatch: { $in: filter.colors } };
  if (filter.sizes?.length) query.size = { $elemMatch: { $in: filter.sizes } };

  if (filter.priceMin != null || filter.priceMax != null) {
    query.price = {};
    if (filter.priceMin != null) query.price.$gte = filter.priceMin;
    if (filter.priceMax != null) query.price.$lte = filter.priceMax;
  }

  if (filter.minRating != null) query.rating = { $gte: filter.minRating };
  if (filter.inStockOnly) query.stock = { $gt: 0 };

  return query;
}

/** Build a MongoDB sort spec from a sortBy string */
function buildMongoSort(sortBy) {
  switch (sortBy) {
    case 'PriceLowHigh': return { price: 1 };
    case 'PriceHighLow': return { price: -1 };
    case 'Newest': return { createdAt: -1 };
    case 'TopRated': return { rating: -1 };
    case 'RelevanceScore':
    default: return { rating: -1 };
  }
}

class ProductRepository {
  async getById(productId) {
    return PRODUCTS().findOne({ id: productId });
  }

  async getAll() {
    return PRODUCTS().find({}).toArray();
  }

  /**
   * Get products with database-level pagination (optimized)
   * @param {number} page - 1-based page number
   * @param {number} pageSize - Items per page
   * @returns {{ products: object[], totalCount: number }}
   */
  async getPaginated(page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const coll = PRODUCTS();

    const [products, totalCount] = await Promise.all([
      coll.find({}).skip(skip).limit(pageSize).toArray(),
      coll.countDocuments({}),
    ]);

    return { products, totalCount };
  }

  /**
   * Full-featured search with filters.
   * @param {SearchFilter} filter
   * @returns {{ products: object[], totalCount: number }}
   */
  async search(filter) {
    const coll = PRODUCTS();
    const mongoFilter = buildMongoFilter(filter);
    const sort = buildMongoSort(filter.sortBy);
    const skip = (filter.page - 1) * filter.pageSize;

    const [products, totalCount] = await Promise.all([
      coll.find(mongoFilter).sort(sort).skip(skip).limit(filter.pageSize).toArray(),
      coll.countDocuments(mongoFilter),
    ]);

    return { products, totalCount };
  }

  async getUniqueBrands(maxCount = 20) {
    const brands = await PRODUCTS().distinct('brand');
    return brands.filter(Boolean).sort().slice(0, maxCount);
  }

  async getUniqueCategories() {
    return PRODUCTS().distinct('category');
  }
}

module.exports = new ProductRepository();
