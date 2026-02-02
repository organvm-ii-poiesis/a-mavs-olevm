/**
 * @file ShareLinks.js
 * @description Share and copy link functionality for discovery items and filtered views.
 *
 * Features:
 * - Generate shareable URLs for individual items
 * - Generate shareable URLs for filtered views
 * - Copy to clipboard with visual feedback
 * - Social sharing integration (optional)
 *
 * Usage:
 * ------
 * const shareLinks = ShareLinks.getInstance();
 *
 * // Copy item link
 * await shareLinks.copyItemLink('item-id');
 *
 * // Copy current filter state
 * await shareLinks.copyFilterLink();
 *
 * // Get shareable URL
 * const url = shareLinks.getItemUrl('item-id');
 */

'use strict';

/**
 * ShareLinks - Link sharing utility singleton
 * @class
 */
class ShareLinks {
  /**
   * Get or create the singleton instance
   * @static
   * @returns {ShareLinks}
   */
  static getInstance() {
    if (!window.shareLinksInstance) {
      window.shareLinksInstance = new ShareLinks();
    }
    return window.shareLinksInstance;
  }

  /**
   * Create a new ShareLinks instance
   * @private
   */
  constructor() {
    // Base URL for the site
    this.baseUrl = window.location.origin;

    // Toast notification element (created lazily)
    this._toastElement = null;

    // Toast timeout
    this._toastTimeout = null;
  }

  /**
   * Generate shareable URL for an item
   * @param {string} itemId - Item ID
   * @returns {string|null} Full URL or null if item not found
   */
  getItemUrl(itemId) {
    const registry = ContentRegistry.getInstance();
    const item = registry.getItem(itemId);

    if (!item) {
      console.warn(`ShareLinks: Item not found: ${itemId}`);
      return null;
    }

    // Generate URL with item parameter
    const params = new URLSearchParams();
    params.set('item', itemId);

    return `${this.baseUrl}${window.location.pathname}?${params.toString()}#discovery`;
  }

  /**
   * Generate shareable URL for current filter state
   * @returns {string}
   */
  getFilterUrl() {
    const filterSystem = FilterSystem.getInstance();
    return filterSystem.getShareableUrl();
  }

  /**
   * Generate shareable URL for a specific filter configuration
   * @param {Object} filterState - Filter state object
   * @returns {string}
   */
  getFilterUrlForState(filterState) {
    const params = new URLSearchParams();

    if (filterState.tags && filterState.tags.length > 0) {
      params.set('tags', filterState.tags.join(','));
    }
    if (filterState.chambers && filterState.chambers.length > 0) {
      params.set('chambers', filterState.chambers.join(','));
    }
    if (filterState.types && filterState.types.length > 0) {
      params.set('types', filterState.types.join(','));
    }
    if (filterState.wings && filterState.wings.length > 0) {
      params.set('wings', filterState.wings.join(','));
    }
    if (filterState.fromYear) {
      params.set('from', filterState.fromYear.toString());
    }
    if (filterState.toYear) {
      params.set('to', filterState.toYear.toString());
    }

    const queryString = params.toString();
    return queryString
      ? `${this.baseUrl}${window.location.pathname}?${queryString}#discovery`
      : `${this.baseUrl}${window.location.pathname}#discovery`;
  }

  /**
   * Copy item link to clipboard
   * @param {string} itemId - Item ID
   * @param {Object} [options] - Options
   * @param {boolean} [options.showToast=true] - Show feedback toast
   * @returns {Promise<boolean>} Success status
   */
  async copyItemLink(itemId, options = {}) {
    const url = this.getItemUrl(itemId);

    if (!url) {
      return false;
    }

    return this._copyToClipboard(url, {
      showToast: options.showToast !== false,
      toastMessage: 'Link copied!',
    });
  }

  /**
   * Copy current filter link to clipboard
   * @param {Object} [options] - Options
   * @param {boolean} [options.showToast=true] - Show feedback toast
   * @returns {Promise<boolean>} Success status
   */
  async copyFilterLink(options = {}) {
    const url = this.getFilterUrl();

    return this._copyToClipboard(url, {
      showToast: options.showToast !== false,
      toastMessage: 'Filter link copied!',
    });
  }

  /**
   * Copy arbitrary text to clipboard
   * @param {string} text - Text to copy
   * @param {Object} [options] - Options
   * @param {boolean} [options.showToast=true] - Show feedback toast
   * @param {string} [options.toastMessage='Copied!'] - Toast message
   * @returns {Promise<boolean>} Success status
   */
  async _copyToClipboard(text, options = {}) {
    try {
      // Use modern Clipboard API if available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        this._fallbackCopy(text);
      }

      // Show success toast
      if (options.showToast !== false) {
        this._showToast(options.toastMessage || 'Copied!', 'success');
      }

      // Emit event
      window.dispatchEvent(new CustomEvent('share-link-copied', {
        detail: { url: text },
      }));

      return true;
    } catch (error) {
      console.error('ShareLinks: Copy failed:', error);

      if (options.showToast !== false) {
        this._showToast('Copy failed', 'error');
      }

      return false;
    }
  }

  /**
   * Fallback copy method for older browsers
   * @private
   */
  _fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }

  /**
   * Show toast notification
   * @private
   */
  _showToast(message, type = 'success') {
    // Clear existing timeout
    if (this._toastTimeout) {
      clearTimeout(this._toastTimeout);
    }

    // Create toast element if needed
    if (!this._toastElement) {
      this._toastElement = document.createElement('div');
      this._toastElement.className = 'share-toast';
      this._toastElement.setAttribute('role', 'status');
      this._toastElement.setAttribute('aria-live', 'polite');
      document.body.appendChild(this._toastElement);
    }

    // Update toast
    this._toastElement.textContent = message;
    this._toastElement.className = `share-toast share-toast--${type} share-toast--visible`;

    // Hide after delay
    this._toastTimeout = setTimeout(() => {
      this._toastElement.classList.remove('share-toast--visible');
    }, 2000);
  }

  /**
   * Open native share dialog (mobile/desktop where supported)
   * @param {Object} shareData - Share data
   * @param {string} shareData.title - Share title
   * @param {string} shareData.text - Share text
   * @param {string} shareData.url - Share URL
   * @returns {Promise<boolean>} Success status
   */
  async nativeShare(shareData) {
    if (!navigator.share) {
      // Fallback to copy
      return this._copyToClipboard(shareData.url, {
        toastMessage: 'Link copied (sharing not supported)',
      });
    }

    try {
      await navigator.share(shareData);
      return true;
    } catch (error) {
      // User cancelled or error
      if (error.name !== 'AbortError') {
        console.error('ShareLinks: Native share failed:', error);
      }
      return false;
    }
  }

  /**
   * Share an item using native share or clipboard
   * @param {string} itemId - Item ID
   * @returns {Promise<boolean>}
   */
  async shareItem(itemId) {
    const registry = ContentRegistry.getInstance();
    const item = registry.getItem(itemId);

    if (!item) {
      return false;
    }

    const url = this.getItemUrl(itemId);

    // Try native share first
    if (navigator.share) {
      return this.nativeShare({
        title: item.title,
        text: item.description || `${item.title} - ET CETER4`,
        url,
      });
    }

    // Fall back to clipboard
    return this.copyItemLink(itemId);
  }

  /**
   * Generate social share URLs
   * @param {string} url - URL to share
   * @param {string} title - Title for share
   * @returns {Object} URLs for different platforms
   */
  getSocialShareUrls(url, title) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    return {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    };
  }

  /**
   * Parse item ID from URL
   * @returns {string|null} Item ID or null
   */
  getItemIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('item') || null;
  }

  /**
   * Check if URL contains a shared item reference
   * @returns {boolean}
   */
  hasSharedItem() {
    return this.getItemIdFromUrl() !== null;
  }
}

// Export for global scope
window.ShareLinks = ShareLinks;
