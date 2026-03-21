'use strict';

const { ObjectId } = require('mongodb');
const { getDb } = require('../data/db');
const { generateOrderNumber } = require('../utils/OrderHelpers');

const COLLECTION = () =>
  getDb().collection(process.env.MONGODB_ORDERS_COLLECTION || 'orders');

/**
 * MongoDB order repository.
 * Mirrors OrderService.API.Repositories.MongoDbOrderRepository
 */
class OrderRepository {
  async getOrderById(id) {
    try {
      return COLLECTION().findOne({ _id: new ObjectId(id) });
    } catch {
      return null; // invalid ObjectId
    }
  }

  /**
   * @param {string} userId
   * @param {number} page      1-based
   * @param {number} pageSize
   * @returns {{ orders: object[], totalCount: number }}
   */
  async getOrdersByUserId(userId, page = 1, pageSize = 50) {
    const coll = COLLECTION();
    const filter = { userId };
    const totalCount = await coll.countDocuments(filter);
    const skip = (page - 1) * pageSize;
    const orders = await coll
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();
    return { orders, totalCount };
  }

  /**
   * @param {number} page
   * @param {number} pageSize
   * @returns {{ orders: object[], totalCount: number }}
   */
  async getAllOrders(page = 1, pageSize = 50) {
    const coll = COLLECTION();
    const totalCount = await coll.countDocuments({});
    const skip = (page - 1) * pageSize;
    const orders = await coll
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();
    return { orders, totalCount };
  }

  async createOrder(order) {
    const now = new Date();
    order.orderNumber = generateOrderNumber();
    order.createdAt = now;
    order.updatedAt = now;
    const result = await COLLECTION().insertOne(order);
    order._id = result.insertedId;
    return order;
  }

  async updateOrder(id, update) {
    update.updatedAt = new Date();
    try {
      await COLLECTION().replaceOne({ _id: new ObjectId(id) }, update);
      return update;
    } catch {
      return null;
    }
  }

  async deleteOrder(id) {
    try {
      const result = await COLLECTION().deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch {
      return false;
    }
  }
}

module.exports = new OrderRepository();
