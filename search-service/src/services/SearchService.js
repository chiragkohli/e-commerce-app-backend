'use strict';

const SearchFilter = require('@ecom/shared/search/SearchFilter');
const PaginationHelper = require('@ecom/shared/utils/PaginationHelper');
const productRepository = require('../repositories/ProductRepository');

/** Map raw MongoDB doc → ProductDto (SearchService response shape) */
function toProductDto(doc, searchScore = 0) {
  return {
    id: doc.id ?? doc.productId,
    name: doc.name,
    brand: doc.brand,
    description: doc.description,
    price: doc.price,
    rating: doc.rating,
    reviewCount: doc.reviewCount ?? 0,
    inStock: doc.inStock ?? (doc.stock > 0),
    imageUrls: doc.imageUrls ?? [],
    colors: doc.color ?? doc.colors ?? [],
    sizes: doc.size ?? doc.sizes ?? [],
    stock: doc.stock ?? 0,
    category: doc.category ?? '',
    subCategory: doc.subcategory ?? doc.subCategory ?? '',
    gender: doc.gender ?? '',
    relevanceScore: searchScore > 0 ? searchScore : (doc.rating ?? 0),
  };
}

class SearchService {
  /**
   * @param {object} searchClient  AzureSearchClient or NullSearchClient
   * @param {string} provider      'AzureAISearch' | 'AdvancedSearch'
   */
  constructor(searchClient, provider) {
    this._searchClient = searchClient;
    this._provider = provider;
  }

  async search(reqQuery) {
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
      pageSize: Math.min(1000, Math.max(1, parseInt(reqQuery.size || '50', 10))),
    });

    let products = [];
    let totalCount = 0;

    if (this._provider === 'AzureAISearch') {
      try {
        const result = await this._searchClient.searchAsync(filter);
        products = result.products;
        totalCount = result.totalCount;
        // Convert Product instances → ProductDto
        const dtos = products.map(p => toProductDto(p.toDocument ? p.toDocument() : p, p.searchScore || 0));
        const pagination = PaginationHelper.buildMetadata(filter.page, filter.pageSize, totalCount);
        return { data: dtos, pagination };
      } catch (err) {
        console.warn('[SearchService] Azure AI Search failed, falling back to MongoDB:', err.message);
        // fall through to MongoDB
      }
    }

    // MongoDB fallback / AdvancedSearch provider
    const result = await productRepository.search(filter);
    products = result.products;
    totalCount = result.totalCount;

    const dtos = products.map(p => toProductDto(p));
    const pagination = PaginationHelper.buildMetadata(filter.page, filter.pageSize, totalCount);
    return { data: dtos, pagination };
  }
}

module.exports = SearchService;
