'use strict';

const path = require('path');
const fs = require('fs');
const { getDb } = require('../data/db');

async function seedDatabase() {
  try {
    const db = getDb();
    const productColl = db.collection(process.env.MONGODB_PRODUCTS_COLLECTION || 'products');
    const forceReseed = process.env.FORCE_RESEED === 'true';

    const existingCount = await productColl.countDocuments();
    if (existingCount > 0 && !forceReseed) {
      console.log('[SearchService] Database already seeded – skipping');
      return;
    }

    const productsPath = path.join(__dirname, '..', '..', 'products.json');
    if (fs.existsSync(productsPath)) {
      const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
      if (forceReseed) await productColl.deleteMany({});
      if (products.length > 0) {
        await productColl.insertMany(products);
        console.log(`[SearchService] Seeded ${products.length} products`);
      }
    } else {
      console.warn('[SearchService] products.json not found – skipping product seeding');
    }
  } catch (err) {
    console.error('[SearchService] Seeding error:', err);
  }
}

module.exports = { seedDatabase };
