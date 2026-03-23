"use strict";

/**
 * Pagination helper.
 * Mirrors Shared.Core.Utilities.PaginationHelper + PaginationMetadata
 */
class PaginationHelper {
  /**
   * Paginate an in-memory array.
   * @template T
   * @param {T[]}   items
   * @param {number} pageNumber  1-based (clamped to >= 1)
   * @param {number} pageSize    1-1000
   * @returns {{ items: T[], metadata: PaginationMetadata }}
   */
  static paginate(items, pageNumber = 1, pageSize = 50) {
    // Clamp
    pageNumber = Math.max(1, pageNumber);
    pageSize = Math.min(1000, Math.max(1, pageSize));

    const totalRecords = items.length;
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Adjust if page exceeds total
    if (totalPages > 0 && pageNumber > totalPages) {
      pageNumber = totalPages;
    }

    const skip = (pageNumber - 1) * pageSize;
    const paged = items.slice(skip, skip + pageSize);

    return {
      items: paged,
      metadata: PaginationHelper.buildMetadata(
        pageNumber,
        pageSize,
        totalRecords,
      ),
    };
  }

  /**
   * Build metadata without slicing (use when data is already paginated by DB).
   * @param {number} page
   * @param {number} pageSize
   * @param {number} totalRecords
   * @returns {PaginationMetadata}
   */
  static buildMetadata(page, pageSize, totalRecords) {
    const totalPages = Math.ceil(totalRecords / pageSize) || 0;
    return {
      currentPage: page,
      pageSize: pageSize,
      totalRecords: totalRecords,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}

module.exports = PaginationHelper;
