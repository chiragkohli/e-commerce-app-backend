'use strict';

/**
 * SearchFilter – mirrors Shared.Core.Search.SearchFilter
 * Passed between controllers, services, and repositories.
 */
class SearchFilter {
  constructor(opts = {}) {
    /** @type {string|null} */
    this.query = opts.query ?? null;
    /** @type {string[]|null} */
    this.categories = opts.categories ?? null;
    /** @type {string[]|null} */
    this.subCategories = opts.subCategories ?? null;
    /** @type {string[]|null} */
    this.brands = opts.brands ?? null;
    /** @type {string[]|null} */
    this.genders = opts.genders ?? null;
    /** @type {string[]|null} */
    this.colors = opts.colors ?? null;
    /** @type {string[]|null} */
    this.sizes = opts.sizes ?? null;
    /** @type {number|null} */
    this.priceMin = opts.priceMin ?? null;
    /** @type {number|null} */
    this.priceMax = opts.priceMax ?? null;
    /** @type {number|null} */
    this.minRating = opts.minRating ?? null;
    /** @type {boolean|null} */
    this.inStockOnly = opts.inStockOnly ?? null;
    /**
     * "RelevanceScore" | "PriceLowHigh" | "PriceHighLow" | "Newest" | "TopRated"
     * @type {string}
     */
    this.sortBy = opts.sortBy ?? 'RelevanceScore';
    /** @type {number} */
    this.page = opts.page ?? 1;
    /** @type {number} */
    this.pageSize = opts.pageSize ?? 50;
  }

  /** Parse a comma-separated query-param value into an array (null if empty/absent). */
  static parseList(value) {
    if (!value || typeof value !== 'string') return null;
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    return arr.length > 0 ? arr : null;
  }

  /**
   * Map SortBy enum int (from query string) to sort-by string.
   * 0=RelevanceScore, 1=PriceLowHigh, 2=PriceHighLow, 3=Newest, 4=TopRated
   */
  static sortByFromInt(val) {
    const map = {
      0: 'RelevanceScore',
      1: 'PriceLowHigh',
      2: 'PriceHighLow',
      3: 'Newest',
      4: 'TopRated',
    };
    const n = parseInt(val, 10);
    if (!isNaN(n) && map[n]) return map[n];
    if (typeof val === 'string' && Object.values(map).includes(val)) return val;
    return 'RelevanceScore';
  }
}

module.exports = SearchFilter;
