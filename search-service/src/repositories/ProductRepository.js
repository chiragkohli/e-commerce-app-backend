'use strict';

const { getDb } = require('../data/db');
const SearchFilter = require('@ecom/shared/search/SearchFilter');

function PRODUCTS() {
  return getDb().collection(process.env.MONGODB_PRODUCTS_COLLECTION || 'products');
}

function buildMongoFilter(filter) {
  const query = {};

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

function buildMongoSort(sortBy) {
  switch (sortBy) {
    case 'PriceLowHigh': return { price: 1 };
    case 'PriceHighLow': return { price: -1 };
    case 'Newest': return { createdAt: -1 };
    case 'TopRated': return { rating: -1 };
    default: return { rating: -1 };
  }
}

class ProductRepository {
  async getAll() {
    return PRODUCTS().find({}).toArray();
  }

  async getById(productId) {
    return PRODUCTS().findOne({ id: productId });
  }

  /** @param {SearchFilter} filter */
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
}

module.exports = new ProductRepository();
