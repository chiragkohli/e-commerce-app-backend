'use strict';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'is', 'it', 'its', 'was', 'are', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall',
  'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'just', 'than', 'then',
  'that', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they',
]);

/**
 * SearchAnalyzer - mirrors Shared.Core.Search.Services.SearchAnalyzer
 * Pipeline: normalize → tokenize → lowercase → remove stopwords → stem
 */
class SearchAnalyzer {
  /**
   * Analyze a query string and return an array of processed tokens.
   * @param {string} query
   * @returns {Promise<string[]>}
   */
  async analyzeAsync(query) {
    if (!query || typeof query !== 'string') return [];

    // Normalize: remove non-alphanumeric except spaces and hyphens, collapse whitespace
    const normalized = query
      .replace(/[^a-zA-Z0-9 \-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Tokenize on spaces, hyphens, and commas
    const tokens = normalized.split(/[ \-,]+/).filter(Boolean);

    return tokens
      .map(t => t.toLowerCase())
      .filter(t => t.length > 1 && !STOP_WORDS.has(t))
      .map(t => SearchAnalyzer._stem(t));
  }

  /** Simple English suffix-stripping stemmer. */
  static _stem(word) {
    if (word.length <= 3) return word;
    if (word.endsWith('tion')) return word.slice(0, -4);
    if (word.endsWith('ing')) return word.slice(0, -3);
    if (word.endsWith('ness')) return word.slice(0, -4);
    if (word.endsWith('ment')) return word.slice(0, -4);
    if (word.endsWith('able')) return word.slice(0, -4);
    if (word.endsWith('ible')) return word.slice(0, -4);
    if (word.endsWith('ful')) return word.slice(0, -3);
    if (word.endsWith('less')) return word.slice(0, -4);
    if (word.endsWith('er')) return word.slice(0, -2);
    if (word.endsWith('est')) return word.slice(0, -3);
    if (word.endsWith('ly')) return word.slice(0, -2);
    if (word.endsWith('ous')) return word.slice(0, -3);
    if (word.endsWith('al')) return word.slice(0, -2);
    if (word.endsWith('ic')) return word.slice(0, -2);
    if (word.endsWith('ed')) return word.slice(0, -2);
    if (word.endsWith('s') && word.length > 4) return word.slice(0, -1);
    return word;
  }
}

module.exports = SearchAnalyzer;
