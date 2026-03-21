'use strict';

const productRepository = require('../repositories/ProductRepository');
const categoryRepository = require('../repositories/CategoryRepository');
const SearchFilter = require('@ecom/shared/search/SearchFilter');

const COLOR_HEX = {
  red: '#FF0000', blue: '#0000FF', green: '#00AA00',
  white: '#FFFFFF', black: '#000000', grey: '#808080',
  gray: '#808080', pink: '#FFC0CB',
};

/** Map raw MongoDB product doc → ProductResponseDto */
function toProductResponseDto(doc) {
  if (!doc) return null;
  return {
    id: doc.id ?? doc.productId,
    name: doc.name,
    brand: doc.brand,
    category: doc.category,
    subCategory: doc.subcategory ?? doc.subCategory ?? '',
    gender: doc.gender ?? '',
    description: doc.description,
    price: doc.price,
    rating: doc.rating,
    reviewCount: doc.reviewCount ?? 0,
    inStock: doc.inStock ?? (doc.stock > 0),
    sizes: doc.size ?? doc.sizes ?? [],
    colors: doc.color ?? doc.colors ?? [],
    stock: doc.stock ?? 0,
    imageUrls: doc.imageUrls ?? [],
  };
}

class ProductService {
  constructor(cacheService) {
    this._cache = cacheService;
  }

  async getProductById(id) {
    const cacheKey = `product:${id}`;
    const cached = await this._cache.getAsync(cacheKey);
    if (cached) return cached;

    const doc = await productRepository.getById(Number(id));
    if (!doc) return null;
    const dto = toProductResponseDto(doc);
    await this._cache.setAsync(cacheKey, dto);
    return dto;
  }

  async searchWithFilters(reqQuery) {
    const filter = new SearchFilter({
      query: reqQuery.query || null,
      categories: SearchFilter.parseList(reqQuery.category),
      subCategories: SearchFilter.parseList(reqQuery.subCategory),
      brands: SearchFilter.parseList(reqQuery.brands),
      genders: SearchFilter.parseList(reqQuery.gender),
      colors: SearchFilter.parseList(reqQuery.colors),
      sizes: SearchFilter.parseList(reqQuery.sizes),
      priceMin: reqQuery.priceMin != null ? parseFloat(reqQuery.priceMin) : null,
      priceMax: reqQuery.priceMax != null ? parseFloat(reqQuery.priceMax) : null,
      minRating: reqQuery.minRating != null ? parseFloat(reqQuery.minRating) : null,
      inStockOnly: reqQuery.inStockOnly === 'true' || reqQuery.inStockOnly === true,
      sortBy: SearchFilter.sortByFromInt(reqQuery.sortBy),
      page: Math.max(1, parseInt(reqQuery.page || '1', 10)),
      pageSize: Math.min(1000, Math.max(1, parseInt(reqQuery.size || '20', 10))),
    });

    const { products, totalCount } = await productRepository.search(filter);
    const dtos = products.map(toProductResponseDto);

    const PaginationHelper = require('@ecom/shared/utils/PaginationHelper');
    const pagination = PaginationHelper.buildMetadata(filter.page, filter.pageSize, totalCount);

    return { products: dtos, pagination };
  }

  async getFilterOptions() {
    const [allProducts, brands, categories] = await Promise.all([
      productRepository.getAll(),
      productRepository.getUniqueBrands(20),
      categoryRepository.getAll(),
    ]);

    // Price range
    const prices = allProducts.map(p => p.price).filter(n => n > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 10000;

    // Color counts
    const colorMap = {};
    for (const p of allProducts) {
      for (const c of (p.color || p.colors || [])) {
        if (c) colorMap[c] = (colorMap[c] || 0) + 1;
      }
    }

    // Rating counts
    const ratingBuckets = [2, 3, 4, 5].map(r => ({
      minRating: r,
      label: `${r}★ & above`,
      count: allProducts.filter(p => p.rating >= r).length,
    }));

    // Category counts
    const catCountMap = {};
    for (const p of allProducts) {
      const cat = p.category || 'Unknown';
      catCountMap[cat] = (catCountMap[cat] || 0) + 1;
    }

    return {
      categories: Object.entries(catCountMap).map(([name, count]) => ({ name, count })),
      brands: brands.map(b => ({ name: b, count: allProducts.filter(p => p.brand === b).length })),
      priceRange: { min: minPrice, max: maxPrice },
      colors: Object.entries(colorMap).map(([name, count]) => ({
        name, count, hexCode: COLOR_HEX[name.toLowerCase()] || null,
      })),
      ratings: ratingBuckets,
    };
  }
}

module.exports = ProductService;
