'use strict';

const axios = require('axios');
const Product = require('../models/Product');

/**
 * Azure AI Search client – mirrors Shared.Core.Search.Services.AzureSearchClient
 * Uses Azure AI Search REST API (v2024-07-01)
 */
class AzureSearchClient {
  /**
   * @param {object} settings
   * @param {string} settings.endpoint
   * @param {string} settings.adminApiKey
   * @param {string} settings.indexName
   * @param {boolean} settings.autoCreateIndex
   * @param {number}  settings.connectTimeoutMs
   * @param {number}  settings.requestTimeoutMs
   */
  constructor(settings) {
    this._endpoint = settings.endpoint.replace(/\/$/, '');
    this._apiKey = settings.adminApiKey;
    this._indexName = settings.indexName || 'products';
    this._autoCreate = settings.autoCreateIndex !== false;
    this._timeout = settings.requestTimeoutMs || 30000;

    this._client = axios.create({
      baseURL: this._endpoint,
      timeout: this._timeout,
      headers: {
        'api-key': this._apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  get _indexUrl() {
    return `/indexes/${this._indexName}`;
  }

  get _docsUrl() {
    return `/indexes/${this._indexName}/docs`;
  }

  async initializeIndexAsync() {
    // Check if index exists
    try {
      await this._client.get(`${this._indexUrl}?api-version=2024-07-01`);
      return; // index already exists
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }

    if (!this._autoCreate) return;

    const indexDef = {
      name: this._indexName,
      fields: [
        { name: 'id', type: 'Edm.String', key: true, searchable: false, filterable: true },
        { name: 'name', type: 'Edm.String', searchable: true, filterable: false, sortable: true },
        { name: 'brand', type: 'Edm.String', searchable: true, filterable: true, sortable: false },
        { name: 'category', type: 'Edm.String', searchable: true, filterable: true, sortable: false },
        { name: 'subcategory', type: 'Edm.String', searchable: true, filterable: true, sortable: false },
        { name: 'gender', type: 'Edm.String', searchable: true, filterable: true, sortable: false },
        { name: 'description', type: 'Edm.String', searchable: true, filterable: false, sortable: false },
        { name: 'price', type: 'Edm.Double', searchable: false, filterable: true, sortable: true },
        { name: 'rating', type: 'Edm.Double', searchable: false, filterable: true, sortable: true },
        { name: 'reviewCount', type: 'Edm.Int32', searchable: false, filterable: true, sortable: true },
        { name: 'stock', type: 'Edm.Int32', searchable: false, filterable: true, sortable: false },
        { name: 'inStock', type: 'Edm.Boolean', searchable: false, filterable: true, sortable: false },
        { name: 'colors', type: "Collection(Edm.String)", searchable: true, filterable: true },
        { name: 'sizes', type: "Collection(Edm.String)", searchable: false, filterable: true },
        { name: 'imageUrls', type: "Collection(Edm.String)", searchable: false, filterable: false },
        { name: 'createdAt', type: 'Edm.DateTimeOffset', searchable: false, filterable: true, sortable: true },
      ],
      scoringProfiles: [{
        name: 'relevanceBoost',
        textWeights: {
          weights: { name: 5, colors: 4, category: 3, subcategory: 3, brand: 2, gender: 1.5, description: 1 },
        },
      }],
      defaultScoringProfile: 'relevanceBoost',
    };

    await this._client.post(`/indexes?api-version=2024-07-01`, indexDef);
  }

  async deleteIndexAsync() {
    try {
      await this._client.delete(`${this._indexUrl}?api-version=2024-07-01`);
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }
  }

  async indexProductAsync(product) {
    const doc = this._toAzureDoc(product);
    await this._client.post(
      `${this._docsUrl}/index?api-version=2024-07-01`,
      { value: [{ '@search.action': 'uploadOrMerge', ...doc }] }
    );
  }

  async bulkIndexProductsAsync(products) {
    // Azure batch limit: 1000 docs
    const BATCH = 1000;
    for (let i = 0; i < products.length; i += BATCH) {
      const batch = products.slice(i, i + BATCH).map(p => ({
        '@search.action': 'uploadOrMerge',
        ...this._toAzureDoc(p),
      }));
      await this._client.post(
        `${this._docsUrl}/index?api-version=2024-07-01`,
        { value: batch }
      );
    }
  }

  /**
   * @param {import('../search/SearchFilter')} filter
   * @returns {Promise<{ products: Product[], totalCount: number }>}
   */
  async searchAsync(filter) {
    const params = new URLSearchParams();
    params.set('api-version', '2024-07-01');
    params.set('search', filter.query || '*');
    params.set('$count', 'true');
    params.set('$skip', String((filter.page - 1) * filter.pageSize));
    params.set('$top', String(filter.pageSize));

    // Build OData filter
    const filters = [];
    if (filter.categories?.length) filters.push(`search.in(category,'${filter.categories.join(',')}',',')`);
    if (filter.subCategories?.length) filters.push(`search.in(subcategory,'${filter.subCategories.join(',')}',',')`);
    if (filter.brands?.length) filters.push(`search.in(brand,'${filter.brands.join(',')}',',')`);
    if (filter.genders?.length) filters.push(`search.in(gender,'${filter.genders.join(',')}',',')`);
    if (filter.priceMin != null) filters.push(`price ge ${filter.priceMin}`);
    if (filter.priceMax != null) filters.push(`price le ${filter.priceMax}`);
    if (filter.minRating != null) filters.push(`rating ge ${filter.minRating}`);
    if (filter.inStockOnly) filters.push(`inStock eq true`);
    if (filter.colors?.length) filters.push(`colors/any(c: search.in(c,'${filter.colors.join(',')}',','))`);
    if (filter.sizes?.length) filters.push(`sizes/any(s: search.in(s,'${filter.sizes.join(',')}',','))`);

    if (filters.length) params.set('$filter', filters.join(' and '));

    // Sort
    const sortMap = {
      PriceLowHigh: 'price asc',
      PriceHighLow: 'price desc',
      Newest: 'createdAt desc',
      TopRated: 'rating desc',
      RelevanceScore: 'search.score() desc',
    };
    params.set('$orderby', sortMap[filter.sortBy] || 'search.score() desc');

    const response = await this._client.get(
      `${this._docsUrl}/search?${params.toString()}`
    );

    const data = response.data;
    const totalCount = data['@odata.count'] ?? 0;
    const docs = (data.value || []).map(d => {
      const p = new Product({
        id: parseInt(d.id, 10),
        name: d.name,
        brand: d.brand,
        gender: d.gender,
        category: d.category,
        subcategory: d.subcategory,
        description: d.description,
        price: d.price,
        rating: d.rating,
        reviewCount: d.reviewCount,
        stock: d.stock,
        size: d.sizes,
        color: d.colors,
        imageUrls: d.imageUrls,
        inStock: d.inStock,
        createdAt: d.createdAt,
      });
      p.searchScore = d['@search.score'] ?? 0;
      return p;
    });

    return { products: docs, totalCount };
  }

  _toAzureDoc(product) {
    return {
      id: String(product.productId),
      name: product.name,
      brand: product.brand,
      category: product.category,
      subcategory: product.subCategory,
      gender: product.gender,
      description: product.description,
      price: product.price,
      rating: product.rating,
      reviewCount: product.reviewCount,
      stock: product.stock,
      inStock: product.inStock,
      colors: product.colors,
      sizes: product.sizes,
      imageUrls: product.imageUrls,
      createdAt: product.createdAt instanceof Date
        ? product.createdAt.toISOString()
        : new Date().toISOString(),
    };
  }
}

module.exports = AzureSearchClient;
