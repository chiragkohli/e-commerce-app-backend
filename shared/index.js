"use strict";

// Models
const Product = require("./models/Product");
const Category = require("./models/Category");

// Search
const SearchFilter = require("./search/SearchFilter");
const SearchAnalyzer = require("./search/SearchAnalyzer");
const AdvancedSearchEngine = require("./search/AdvancedSearchEngine");
const AzureSearchClient = require("./search/AzureSearchClient");
const NullSearchClient = require("./search/NullSearchClient");

// Caching
const RedisCacheService = require("./caching/RedisCacheService");
const NullCacheService = require("./caching/NullCacheService");

// Middleware
const loggingMiddleware = require("./middleware/loggingMiddleware");
const authMiddleware = require("./middleware/authMiddleware");

// Utilities
const { ApiResponse } = require("./utils/ApiResponse");
const PaginationHelper = require("./utils/PaginationHelper");

module.exports = {
  Product,
  Category,
  SearchFilter,
  SearchAnalyzer,
  AdvancedSearchEngine,
  AzureSearchClient,
  NullSearchClient,
  RedisCacheService,
  NullCacheService,
  loggingMiddleware,
  authMiddleware,
  ApiResponse,
  PaginationHelper,
};
