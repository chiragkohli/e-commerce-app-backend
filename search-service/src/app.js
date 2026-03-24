'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const loggingMiddleware = require('@ecom/shared/middleware/loggingMiddleware');
const AzureSearchClient = require('@ecom/shared/search/AzureSearchClient');
const NullSearchClient = require('@ecom/shared/search/NullSearchClient');

const { connect } = require('./data/db');
const { seedDatabase } = require('./services/DatabaseSeederService');
const SearchService = require('./services/SearchService');
const createSearchRouter = require('./controllers/SearchController');
const productRepository = require('./repositories/ProductRepository');

const app = express();
const PORT = process.env.PORT || 5003;

// --- Search provider setup ---
const provider = process.env.SEARCH_PROVIDER || 'AzureAISearch';
const azureEnabled = process.env.AZURE_SEARCH_ENABLED !== 'false';

let searchClient;
if (provider === 'AzureAISearch' && azureEnabled) {
  searchClient = new AzureSearchClient({
    endpoint: process.env.AZURE_SEARCH_ENDPOINT || '',
    adminApiKey: process.env.AZURE_SEARCH_ADMIN_API_KEY || '',
    indexName: process.env.AZURE_SEARCH_INDEX_NAME || 'products',
    autoCreateIndex: process.env.AZURE_SEARCH_AUTO_CREATE_INDEX !== 'false',
    requestTimeoutMs: 30000,
  });
} else {
  searchClient = new NullSearchClient();
}

const searchService = new SearchService(searchClient, provider);

// --- Middleware ---
app.use(loggingMiddleware);
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use('/api/search', createSearchRouter(searchService));

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'SearchService is healthy' });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('[SearchService] Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

connect()
  .then(async () => {
    await seedDatabase();

    // Initialize Azure AI Search index if applicable
    if (provider === 'AzureAISearch' && azureEnabled) {
      try {
        await searchClient.deleteIndexAsync();
        await searchClient.initializeIndexAsync();
        const allProducts = await productRepository.getAll();
        if (allProducts.length > 0) {
          // Convert raw docs to Product instances for Azure client
          const Product = require('@ecom/shared/models/Product');
          const productInstances = allProducts.map(d => new Product(d));
          await searchClient.bulkIndexProductsAsync(productInstances);
          console.log(`[SearchService] Indexed ${productInstances.length} products in Azure AI Search`);
        }
      } catch (err) {
        console.warn('[SearchService] Azure AI Search initialization failed (will fall back to MongoDB):', err.message);
      }
    }

    app.listen(PORT, () => {
      console.log(`[SearchService] Listening on port ${PORT} (provider: ${provider})`);
    });
  })
  .catch(err => {
    console.error('[SearchService] Failed to start:', err);
    process.exit(1);
  });

module.exports = app;
