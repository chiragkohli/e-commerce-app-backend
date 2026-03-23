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

  /**
   * Get all products with pagination (optimized with DB-level skip/limit)
   * @param {number} page - 1-based page number
   * @param {number} pageSize - Items per page (1-200)
   * @returns {object} { products: [], pagination: {} }
   */
  async getAllProducts(page = 1, pageSize = 10) {
    // Input validation
    let validPage = parseInt(page, 10);
    let validPageSize = parseInt(pageSize, 10);

    // Validate page
    if (isNaN(validPage) || validPage < 1) {
      console.warn('[ProductService] Invalid page:', page, '- using default 1');
      validPage = 1;
    }

    // Validate pageSize (1-200 range)
    if (isNaN(validPageSize) || validPageSize < 1) {
      console.warn('[ProductService] Invalid pageSize:', pageSize, '- using default 10');
      validPageSize = 10;
    } else if (validPageSize > 200) {
      console.warn('[ProductService] PageSize exceeds max (200) - capping to 200');
      validPageSize = 200;
    }

    const cacheKey = `products:all:${validPage}:${validPageSize}`;
    const cached = await this._cache.getAsync(cacheKey);
    if (cached) {
      console.log(`[ProductService] Cache hit for products page ${validPage}`);
      return cached;
    }

    // Fetch from database with skip/limit (optimized)
    const { products: rawProducts, totalCount } = await productRepository.getPaginated(validPage, validPageSize);

    // Clamp page to valid range if result is empty (user requested beyond available pages)
    const maxPage = Math.ceil(totalCount / validPageSize) || 1;
    let safePage = validPage;
    if (totalCount > 0 && validPage > maxPage) {
      console.warn(
        `[ProductService] Requested page ${validPage} exceeds max page ${maxPage} - clamping to ${maxPage}`
      );
      safePage = maxPage;
      // Re-fetch the last page
      const { products: lastPageProducts } = await productRepository.getPaginated(safePage, validPageSize);
      const mappedProducts = lastPageProducts.map(toProductResponseDto);
      const PaginationHelper = require('@ecom/shared/utils/PaginationHelper');
      const pagination = PaginationHelper.buildMetadata(safePage, validPageSize, totalCount);
      const result = { products: mappedProducts, pagination };
      await this._cache.setAsync(cacheKey, result);
      return result;
    }

    // Map products to DTOs
    const products = rawProducts.map(toProductResponseDto);

    const PaginationHelper = require('@ecom/shared/utils/PaginationHelper');
    const pagination = PaginationHelper.buildMetadata(validPage, validPageSize, totalCount);

    const result = { products, pagination };
    await this._cache.setAsync(cacheKey, result);

    console.log(
      `[ProductService] Fetched products - page: ${validPage}/${maxPage}, items: ${products.length}/${totalCount}`
    );

    return result;
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
