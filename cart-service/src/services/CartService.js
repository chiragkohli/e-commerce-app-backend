'use strict';

const cartRepository = require('../repositories/CartRepository');

/** Map a raw cart document → CartResponseDto */
function toCartResponseDto(cart) {
  if (!cart) return null;
  const items = (cart.items || []).map(i => ({
    productId: i.productId,
    productName: i.productName,
    price: i.price,
    quantity: i.quantity,
    image: i.image || null,
    subtotal: parseFloat((i.price * i.quantity).toFixed(2)),
  }));

  const total = parseFloat(items.reduce((s, i) => s + i.subtotal, 0).toFixed(2));
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return {
    userId: cart.userId,
    items,
    itemCount,
    total,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

/** Return an empty CartResponseDto for a given userId */
function emptyCartDto(userId) {
  const now = new Date();
  return { userId, items: [], itemCount: 0, total: 0, createdAt: now, updatedAt: now };
}

class CartService {
  async getCart(userId) {
    const cart = await cartRepository.getCartByUserId(userId);
    return cart ? toCartResponseDto(cart) : null;
  }

  async addItem(userId, dto) {
    const item = {
      productId: dto.productId,
      productName: dto.productName,
      price: parseFloat(dto.price),
      quantity: dto.quantity,
      image: dto.image || null,
    };
    const cart = await cartRepository.addItemToCart(userId, item);
    return toCartResponseDto(cart);
  }

  async removeItem(userId, dto) {
    const cart = await cartRepository.removeItemFromCart(userId, dto.productId);
    return cart ? toCartResponseDto(cart) : emptyCartDto(userId);
  }

  async clearCart(userId) {
    return cartRepository.deleteCart(userId);
  }

  /**
   * Merge a guest cart into the user's cart.
   * Replaces existing cart then batch-inserts all items.
   */
  async mergeCart(userId, mergeDto) {
    // Delete existing cart
    await cartRepository.deleteCart(userId);

    const items = (mergeDto.items || []).map(i => ({
      productId: i.productId,
      productName: i.productName,
      price: parseFloat(i.price),
      quantity: i.quantity,
      image: i.image || null,
    }));

    let mergedItemsCount = 0;
    let cart = null;

    if (items.length > 0) {
      cart = await cartRepository.addItemsToCart(userId, items);
      mergedItemsCount = cart.items.length;
    }

    return {
      cart: cart ? toCartResponseDto(cart) : emptyCartDto(userId),
      mergedItemsCount,
      mergeCompleted: true,
      message: `Cart merged successfully. ${mergedItemsCount} item(s) in cart.`,
    };
  }
}

module.exports = new CartService();
