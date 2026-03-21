'use strict';

const { getDb } = require('../data/db');

const COLLECTION = () =>
  getDb().collection(process.env.MONGODB_CART_COLLECTION || 'carts');

/**
 * MongoDB cart repository.
 * Mirrors CartService.API.Repositories.MongoDbCartRepository
 */
class CartRepository {
  async getCartByUserId(userId) {
    return COLLECTION().findOne({ userId });
  }

  async createCart(cart) {
    cart.createdAt = new Date();
    cart.updatedAt = new Date();
    await COLLECTION().insertOne(cart);
    return cart;
  }

  async updateCart(cart) {
    cart.updatedAt = new Date();
    await COLLECTION().replaceOne({ userId: cart.userId }, cart);
    return cart;
  }

  async deleteCart(userId) {
    const result = await COLLECTION().deleteOne({ userId });
    return result.deletedCount > 0;
  }

  /**
   * Add a single item to a user's cart.
   * Creates the cart if it doesn't exist.
   * If the product already exists in the cart, increments quantity.
   */
  async addItemToCart(userId, item) {
    let cart = await this.getCartByUserId(userId);

    if (!cart) {
      cart = { userId, items: [], createdAt: new Date(), updatedAt: new Date() };
    }

    const existing = cart.items.find(i => i.productId === item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.items.push({ ...item });
    }

    cart.updatedAt = new Date();
    await COLLECTION().replaceOne({ userId }, cart, { upsert: true });
    return cart;
  }

  /**
   * Remove an item (by productId) from the cart.
   * Deletes the cart document if no items remain.
   * Returns null if the cart was deleted.
   */
  async removeItemFromCart(userId, productId) {
    const cart = await this.getCartByUserId(userId);
    if (!cart) return null;

    cart.items = cart.items.filter(i => i.productId !== productId);

    if (cart.items.length === 0) {
      await COLLECTION().deleteOne({ userId });
      return null;
    }

    cart.updatedAt = new Date();
    await COLLECTION().replaceOne({ userId }, cart);
    return cart;
  }

  /**
   * Merge / replace all items in one operation.
   * Creates or replaces the cart.
   */
  async addItemsToCart(userId, items) {
    const now = new Date();
    let cart = await this.getCartByUserId(userId);

    if (!cart) {
      cart = { userId, items: [], createdAt: now, updatedAt: now };
    }

    for (const newItem of items) {
      const existing = cart.items.find(i => i.productId === newItem.productId);
      if (existing) {
        existing.quantity += newItem.quantity;
      } else {
        cart.items.push({ ...newItem });
      }
    }

    cart.updatedAt = now;
    await COLLECTION().replaceOne({ userId }, cart, { upsert: true });
    return cart;
  }
}

module.exports = new CartRepository();
