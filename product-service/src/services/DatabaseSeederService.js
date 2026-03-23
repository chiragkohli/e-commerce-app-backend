'use strict';

const path = require('path');
const fs = require('fs');
const { getDb } = require('../data/db');

/**
 * Seed the categories and products collections from JSON files on startup.
 * Mirrors ProductService.API.Services.DatabaseSeederService
 */
async function seedDatabase() {
  try {
    const db = getDb();
    const categoryColl = db.collection(process.env.MONGODB_CATEGORIES_COLLECTION || 'categories');
    const forceReseed = process.env.FORCE_RESEED === 'true';

    const existingCount = await categoryColl.countDocuments();
    if (existingCount > 0 && !forceReseed) {
      console.log('[ProductService] Database already seeded - skipping');
      return;
    }

    // Categories
    const categoriesPath = path.join(__dirname, '..', '..', 'categories.json');
    if (fs.existsSync(categoriesPath)) {
      const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
      if (forceReseed) await categoryColl.deleteMany({});
      if (categories.length > 0) {
        await categoryColl.insertMany(categories);
        console.log(`[ProductService] Seeded ${categories.length} categories`);
      }
    } else {
      console.warn('[ProductService] categories.json not found - skipping category seeding');
    }
  } catch (err) {
    console.error('[ProductService] Seeding error:', err);
  }
}

module.exports = { seedDatabase };
