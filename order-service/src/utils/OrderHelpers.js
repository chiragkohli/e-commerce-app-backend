'use strict';

const VALID_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

/**
 * Order utility helpers – mirrors OrderService.API.Utilities.OrderHelpers
 */
function generateOrderNumber() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const { v4: uuidv4 } = require('uuid');
  const guid8 = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  return `ORD-${ts}-${guid8}`;
}

function isValidStatus(status) {
  return VALID_STATUSES.includes(status);
}

function getValidStatuses() {
  return [...VALID_STATUSES];
}

function calculateOrderTotal(subtotal, taxAmount, shippingCost) {
  return parseFloat((subtotal + taxAmount + shippingCost).toFixed(2));
}

module.exports = { generateOrderNumber, isValidStatus, getValidStatuses, calculateOrderTotal };
