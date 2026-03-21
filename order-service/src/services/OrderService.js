'use strict';

const orderRepository = require('../repositories/OrderRepository');
const PaginationHelper = require('@ecom/shared/utils/PaginationHelper');

/** Map raw MongoDB order doc → OrderResponseDto */
function toOrderResponseDto(order) {
  if (!order) return null;
  const id = order._id ? order._id.toString() : null;
  return {
    id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    items: (order.items || []).map(i => ({
      productId: i.productId,
      productName: i.productName,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
      imageUrl: i.imageUrl || null,
    })),
    totalAmount: order.totalAmount,
    status: order.status || 'Pending',
    shippingAddress: order.shippingAddress || null,
    billingAddress: order.billingAddress || null,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    expectedDeliveryDate: order.expectedDeliveryDate || null,
    shippingCost: order.shippingCost || 0,
    taxAmount: order.taxAmount || 0,
    notes: order.notes || null,
  };
}

class OrderService {
  /**
   * Fetch order by ID and verify ownership.
   */
  async getOrderById(id, userId) {
    const order = await orderRepository.getOrderById(id);
    if (!order) return null;
    if (order.userId.toLowerCase() !== userId.toLowerCase()) return null; // ownership check
    return toOrderResponseDto(order);
  }

  /**
   * Paginated orders for a specific user.
   */
  async getUserOrders(userId, page = 1, pageSize = 50) {
    const { orders, totalCount } = await orderRepository.getOrdersByUserId(userId, page, pageSize);
    const orderDtos = orders.map(toOrderResponseDto);
    const metadata = PaginationHelper.buildMetadata(page, pageSize, totalCount);
    return {
      orders: orderDtos,
      totalCount,
      page,
      pageSize,
      totalPages: metadata.totalPages,
    };
  }

  /**
   * Create a new order from a CreateOrderRequestDto.
   */
  async createOrder(dto, userId) {
    const items = (dto.items || []).map(i => ({
      productId: i.productId,
      productName: i.productName,
      unitPrice: parseFloat(i.unitPrice || 0),
      quantity: i.quantity,
      lineTotal: parseFloat(i.lineTotal || i.unitPrice * i.quantity || 0),
      imageUrl: i.imageUrl || null,
    }));

    const itemsSubtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const shippingCost = parseFloat(dto.shippingCost || 0);
    const taxAmount = parseFloat(dto.taxAmount || 0);
    const totalAmount = parseFloat((itemsSubtotal + shippingCost + taxAmount).toFixed(2));

    const order = {
      userId: userId || dto.userId,
      items,
      totalAmount,
      status: 'Pending',
      shippingAddress: dto.shippingAddress || null,
      billingAddress: dto.billingAddress || null,
      paymentMethod: dto.paymentMethod || 'Unknown',
      shippingCost,
      taxAmount,
      notes: dto.notes || null,
    };

    const created = await orderRepository.createOrder(order);
    return toOrderResponseDto(created);
  }
}

module.exports = new OrderService();
