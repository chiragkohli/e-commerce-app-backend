'use strict';

/**
 * Category model - mirrors Shared.Core.Models.Category
 */
class Category {
  constructor(doc = {}) {
    this.id = doc.id ?? 0;
    this.parentId = doc.parent_id ?? doc.parentId ?? null;
    this.name = doc.name ?? '';
    this.gender = doc.gender ?? null;
    this.type = doc.type ?? null; // "Gender" | "Category" | "SubCategory"
  }
}

module.exports = Category;
