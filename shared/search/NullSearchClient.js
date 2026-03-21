'use strict';

/**
 * Null Object implementation of the search client.
 * Used when AzureAISearch is disabled or when AdvancedSearch provider is selected.
 */
class NullSearchClient {
  async initializeIndexAsync() { }
  async deleteIndexAsync() { }
  async indexProductAsync(_product) { }
  async bulkIndexProductsAsync(_products) { }
  async searchAsync(_filter) {
    return { products: [], totalCount: 0 };
  }
}

module.exports = NullSearchClient;
