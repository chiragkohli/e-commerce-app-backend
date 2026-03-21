'use strict';

const { getDb } = require('../data/db');

function CATEGORIES() {
  return getDb().collection(process.env.MONGODB_CATEGORIES_COLLECTION || 'categories');
}

class CategoryRepository {
  async getAll() {
    return CATEGORIES().find({}).toArray();
  }

  async getById(id) {
    return CATEGORIES().findOne({ id });
  }

  async getByParentId(parentId) {
    // parentId=null → root categories
    const filter = parentId == null
      ? { $or: [{ parent_id: null }, { parent_id: { $exists: false } }] }
      : { parent_id: parentId };
    return CATEGORIES().find(filter).toArray();
  }
}

module.exports = new CategoryRepository();
