'use strict';

const SearchAnalyzer = require('./SearchAnalyzer');

// Scoring weights – mirrors Shared.Core.Search.Services.AdvancedSearchEngine
const WEIGHTS = {
  name: 3.0,
  brand: 2.0,
  category: 1.5,
  description: 1.0,
  rating: 0.5,
};

/**
 * In-memory relevance search engine.
 * Mirrors Shared.Core.Search.Services.AdvancedSearchEngine
 */
class AdvancedSearchEngine {
  constructor() {
    this._analyzer = new SearchAnalyzer();
  }

  /**
   * @param {import('../models/Product')[]} products  Full product list from DB
   * @param {string|null}   query
   * @param {string|null}   category
   * @param {number}        page    1-based
   * @param {number}        pageSize
   * @returns {Promise<{ products: import('../models/Product')[], scores: number[], totalCount: number }>}
   */
  async searchAsync(products, query, category, page = 1, pageSize = 50) {
    let results = [...products];

    // Category filter
    if (category) {
      const cat = category.toLowerCase();
      results = results.filter(p =>
        (p.category || '').toLowerCase() === cat ||
        (p.subCategory || '').toLowerCase() === cat
      );
    }

    // Relevance scoring
    if (query && query.trim()) {
      const tokens = await this._analyzer.analyzeAsync(query);
      const scored = results
        .map(p => ({ product: p, score: this._score(p, tokens) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating);

      const totalCount = scored.length;
      const skip = (page - 1) * pageSize;
      return {
        products: scored.slice(skip, skip + pageSize).map(s => {
          s.product.searchScore = s.score;
          return s.product;
        }),
        scores: scored.slice(skip, skip + pageSize).map(s => s.score),
        totalCount,
      };
    }

    const totalCount = results.length;
    const skip = (page - 1) * pageSize;
    return {
      products: results.slice(skip, skip + pageSize),
      scores: new Array(Math.min(pageSize, results.length - skip)).fill(0),
      totalCount,
    };
  }

  /**
   * @param {import('../models/Product')} product
   * @param {string[]} tokens – already analyzed tokens
   * @returns {number} relevance score
   */
  _score(product, tokens) {
    if (tokens.length === 0) return 0;
    let total = 0;
    for (const token of tokens) {
      total += this._fieldScore(product.name, token, WEIGHTS.name);
      total += this._fieldScore(product.brand, token, WEIGHTS.brand);
      total += this._fieldScore(product.category, token, WEIGHTS.category);
      total += this._fieldScore(product.description, token, WEIGHTS.description);
    }
    total += product.rating * WEIGHTS.rating;
    return total;
  }

  _fieldScore(fieldValue, token, weight) {
    if (!fieldValue) return 0;
    const lower = fieldValue.toLowerCase();
    if (lower.includes(token)) return weight;
    return 0;
  }

  /**
   * Autocomplete suggestions.
   * @param {import('../models/Product')[]} products
   * @param {string} partialQuery
   * @param {number} limit
   * @returns {Promise<string[]>}
   */
  async getSuggestionsAsync(products, partialQuery, limit = 10) {
    if (!partialQuery) return [];
    const lower = partialQuery.toLowerCase();
    const suggestions = new Set();
    for (const p of products) {
      if ((p.name || '').toLowerCase().startsWith(lower)) suggestions.add(p.name);
      if ((p.brand || '').toLowerCase().startsWith(lower)) suggestions.add(p.brand);
      if (suggestions.size >= limit) break;
    }
    return [...suggestions].slice(0, limit);
  }

  /**
   * Facet counts.
   * @param {import('../models/Product')[]} products
   * @param {string|null} query
   * @returns {Promise<Object<string,number>>}
   */
  async getFacetsAsync(products, query) {
    const facets = {};
    for (const p of products) {
      const key = p.category || 'Unknown';
      facets[key] = (facets[key] || 0) + 1;
    }
    return facets;
  }
}

module.exports = AdvancedSearchEngine;
