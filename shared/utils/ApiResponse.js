'use strict';

/**
 * Generic API response wrapper.
 * Mirrors ApiResponse<T> used across all .NET services.
 */
class ApiResponse {
  /**
   * @param {boolean} success
   * @param {string}  message
   * @param {*}       [data]
   */
  constructor(success, message, data = undefined) {
    this.success = success;
    this.message = message;
    if (data !== undefined) this.data = data;
  }

  static success(data, message = 'Success') {
    return new ApiResponse(true, message, data);
  }

  static error(message = 'An error occurred') {
    return new ApiResponse(false, message);
  }
}

module.exports = { ApiResponse };
