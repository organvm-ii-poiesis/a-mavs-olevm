/**
 * AGORA Chamber UI Functionality
 * Handles section navigation, tag filtering, and content display
 */

const AgoraUI = (() => {
  // Private state
  let currentSection = 'feed';
  let currentFilter = 'all';
  let config = window.AGORA_CONFIG || {};

  /**
   * Initialize the Agora chamber
   */
  const init = () => {
    if (!config.chamber) {
      console.warn('AGORA_CONFIG not found');
      return;
    }

    setupEventListeners();
    applyInitialState();
    setupAccessibility();
  };

  /**
   * Setup all event listeners
   */
  const setupEventListeners = () => {
    // Section navigation
    const sectionBtns = document.querySelectorAll('.section-btn');
    sectionBtns.forEach(btn => {
      btn.addEventListener('click', handleSectionChange);
    });

    // Tag filtering
    const tagBtns = document.querySelectorAll('.agora-tag-filter');
    tagBtns.forEach(btn => {
      btn.addEventListener('click', handleTagFilter);
    });
  };

  /**
   * Handle section navigation
   */
  const handleSectionChange = (e) => {
    const section = e.target.closest('.section-btn').dataset.section;
    if (!section) return;

    // Update state
    currentSection = section;

    // Update button states
    updateSectionButtons(section);

    // Show/hide content
    updateSectionContent(section);

    // Reset filter when changing sections
    resetFilter();
  };

  /**
   * Update section button active states
   */
  const updateSectionButtons = (activeSection) => {
    const buttons = document.querySelectorAll('.section-btn');
    buttons.forEach(btn => {
      if (btn.dataset.section === activeSection) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  };

  /**
   * Update section content visibility
   */
  const updateSectionContent = (section) => {
    const contents = document.querySelectorAll('.section-content');
    contents.forEach(content => {
      if (content.id === `${section}-section`) {
        content.classList.add('active');
        content.style.display = 'block';
      } else {
        content.classList.remove('active');
        content.style.display = 'none';
      }
    });
  };

  /**
   * Handle tag filtering
   */
  const handleTagFilter = (e) => {
    const tag = e.target.closest('.agora-tag-filter').dataset.tag;
    if (!tag) return;

    currentFilter = tag;

    // Update button states
    updateFilterButtons(tag);

    // Filter content
    filterContentByTag(tag);
  };

  /**
   * Update filter button active states
   */
  const updateFilterButtons = (activeTag) => {
    const buttons = document.querySelectorAll('.agora-tag-filter');
    buttons.forEach(btn => {
      if (btn.dataset.tag === activeTag) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  };

  /**
   * Filter chamber cards by tag
   */
  const filterContentByTag = (tag) => {
    const cards = document.querySelectorAll('.chamber-card.agora');

    cards.forEach(card => {
      const cardTags = card.dataset.tags ? card.dataset.tags.split(',') : [];

      if (tag === 'all' || cardTags.includes(tag)) {
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
        card.style.maxHeight = '1000px';
      } else {
        card.style.opacity = '0.3';
        card.style.pointerEvents = 'none';
        card.style.maxHeight = '0';
        card.style.overflow = 'hidden';
      }
    });

    // Announce to screen readers
    announceFilterChange(tag);
  };

  /**
   * Reset filter to 'all'
   */
  const resetFilter = () => {
    currentFilter = 'all';
    const allBtn = document.querySelector('[data-tag="all"]');
    if (allBtn) {
      allBtn.click();
    }
  };

  /**
   * Apply initial state on load
   */
  const applyInitialState = () => {
    const defaultSection = config.organization?.defaultSection || 'feed';
    updateSectionButtons(defaultSection);
    updateSectionContent(defaultSection);
    updateFilterButtons('all');
  };

  /**
   * Setup accessibility features
   */
  const setupAccessibility = () => {
    // Add keyboard navigation
    setupKeyboardNavigation();

    // Add ARIA labels
    addAriaLabels();

    // Add skip links
    setupSkipLinks();
  };

  /**
   * Keyboard navigation support
   */
  const setupKeyboardNavigation = () => {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + F to focus filter
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const firstFilter = document.querySelector('.agora-tag-filter');
        if (firstFilter) firstFilter.focus();
      }

      // Alt + S to focus section navigation
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const firstSection = document.querySelector('.section-btn');
        if (firstSection) firstSection.focus();
      }
    });
  };

  /**
   * Add ARIA labels for accessibility
   */
  const addAriaLabels = () => {
    const sectionBtns = document.querySelectorAll('.section-btn');
    sectionBtns.forEach(btn => {
      const section = btn.dataset.section;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', section === currentSection ? 'true' : 'false');
      btn.setAttribute('aria-controls', `${section}-section`);
    });

    const filterBtns = document.querySelectorAll('.agora-tag-filter');
    filterBtns.forEach(btn => {
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
    });

    const cards = document.querySelectorAll('.chamber-card.agora');
    cards.forEach(card => {
      card.setAttribute('role', 'article');
    });
  };

  /**
   * Setup skip links
   */
  const setupSkipLinks = () => {
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector('#chamber-content');
        if (target) {
          target.focus();
        }
      });
    }
  };

  /**
   * Announce filter changes to screen readers
   */
  const announceFilterChange = (tag) => {
    const announcement = `Filtering by ${tag === 'all' ? 'all topics' : tag}`;
    const ariaLive = document.querySelector('[aria-live="polite"]') ||
                     createAriaLiveRegion();
    ariaLive.textContent = announcement;
  };

  /**
   * Create ARIA live region for announcements
   */
  const createAriaLiveRegion = () => {
    const region = document.createElement('div');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.style.position = 'absolute';
    region.style.left = '-9999px';
    document.body.appendChild(region);
    return region;
  };

  /**
   * Public API
   */
  return {
    init,
    getCurrentSection: () => currentSection,
    getCurrentFilter: () => currentFilter,
    setSection: handleSectionChange,
    setFilter: handleTagFilter
  };
})();

// Auto-initialize on DOMContentLoaded if script loads before body
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AgoraUI.init();
  });
} else {
  // Document already loaded
  AgoraUI.init();
}
