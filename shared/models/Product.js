'use strict';

/**
 * Canonical product model – mirrors Shared.Core.Models.Product
 * Used by all services that touch the "products" collection.
 */
class Product {
  /**
   * @param {object} doc  Raw MongoDB document
   */
  constructor(doc = {}) {
    this.productId = doc.id ?? doc.productId ?? 0;
    this.name = doc.name ?? '';
    this.brand = doc.brand ?? '';
    this.gender = doc.gender ?? '';
    this.category = doc.category ?? '';
    this.subCategory = doc.subcategory ?? doc.subCategory ?? '';
    this.description = doc.description ?? '';
    this.price = typeof doc.price === 'number' ? doc.price : parseFloat(doc.price ?? 0);
    this.currency = doc.currency ?? 'INR';
    this.rating = typeof doc.rating === 'number' ? doc.rating : parseFloat(doc.rating ?? 0);
    this.reviewCount = doc.reviewCount ?? 0;
    this.stock = doc.stock ?? 0;
    this.sizes = doc.size ?? doc.sizes ?? [];
    this.colors = doc.color ?? doc.colors ?? [];
    this.imageUrls = doc.imageUrls ?? [];
    this.inStock = typeof doc.inStock === 'boolean' ? doc.inStock : (this.stock > 0);
    this.createdAt = doc.createdAt ?? new Date();
    this.updatedAt = doc.updatedAt ?? new Date();
    this.searchScore = doc.searchScore ?? 0;
  }

  /** Map to plain object for MongoDB storage (preserves original field names). */
  toDocument() {
    return {
      id: this.productId,
      name: this.name,
      brand: this.brand,
      gender: this.gender,
      category: this.category,
      subcategory: this.subCategory,
      description: this.description,
      price: this.price,
      currency: this.currency,
      rating: this.rating,
      reviewCount: this.reviewCount,
      stock: this.stock,
      size: this.sizes,
      color: this.colors,
      imageUrls: this.imageUrls,
      inStock: this.inStock,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Product;
