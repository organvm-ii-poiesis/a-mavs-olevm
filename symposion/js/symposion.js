/**
 * @file symposion/js/symposion.js
 * @description Symposion chamber functionality
 * Manages dialogue filtering, speaker badges, and multi-voice interactions
 */

'use strict';

/**
 * @global {Object} SymposionChamber - Symposion chamber controller
 */
// eslint-disable-next-line no-unused-vars
const SymposionChamber = (() => {
  /**
   * Cache DOM references
   */
  const dom = {
    navButtons: null,
    gridItems: null,
    dialogueCards: null,
  };

  /**
   * Current state
   */
  let currentSection = 'all';

  /**
   * Initialize chamber
   */
  function initialize() {
    cacheDOM();
    attachEventListeners();
    loadContent();
  }

  /**
   * Cache DOM elements for better performance
   */
  function cacheDOM() {
    dom.navButtons = document.querySelectorAll('.symposion-nav-btn');
    dom.gridItems = document.getElementById('chamber-items');
    dom.dialogueCards = document.querySelectorAll('.symposion-dialogue-card');
  }

  /**
   * Attach event listeners to navigation buttons
   */
  function attachEventListeners() {
    if (!dom.navButtons) return;

    dom.navButtons.forEach((button) => {
      button.addEventListener('click', handleNavClick);
    });

    // Handle keyboard navigation
    document.addEventListener('keydown', handleKeyboardNav);
  }

  /**
   * Handle navigation button click
   * @param {Event} event - Click event
   */
  function handleNavClick(event) {
    const section = event.target.dataset.section;
    filterBySection(section);
    updateActiveButton(event.target);
  }

  /**
   * Handle keyboard navigation (Arrow keys to switch sections)
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeyboardNav(event) {
    const sections = Array.from(dom.navButtons).map((btn) => btn.dataset.section);
    const currentIndex = sections.indexOf(currentSection);

    if (event.key === 'ArrowRight' && currentIndex < sections.length - 1) {
      const nextSection = sections[currentIndex + 1];
      filterBySection(nextSection);
      updateActiveButton(
        document.querySelector(`[data-section="${nextSection}"]`),
      );
    } else if (event.key === 'ArrowLeft' && currentIndex > 0) {
      const prevSection = sections[currentIndex - 1];
      filterBySection(prevSection);
      updateActiveButton(
        document.querySelector(`[data-section="${prevSection}"]`),
      );
    }
  }

  /**
   * Filter dialogue cards by section
   * @param {string} section - Section to filter ('all', 'interviews', 'conversations')
   */
  function filterBySection(section) {
    currentSection = section;

    if (!dom.dialogueCards) return;

    const cards = Array.from(dom.dialogueCards);
    const visibleCards = cards.filter((card) => {
      if (section === 'all') return true;
      return card.dataset.section === section;
    });

    // Fade out all cards
    cards.forEach((card) => {
      card.style.opacity = '0';
      card.style.pointerEvents = 'none';
      card.setAttribute('aria-hidden', 'true');
    });

    // Fade in visible cards with stagger
    setTimeout(() => {
      visibleCards.forEach((card, index) => {
        card.style.display = 'grid';
        card.style.pointerEvents = 'auto';
        card.removeAttribute('aria-hidden');
        // Stagger animation
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transition = 'opacity 0.4s ease';
        }, index * 50);
      });

      // Hide non-visible cards
      cards.forEach((card) => {
        if (!visibleCards.includes(card)) {
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    }, 200);

    // Announce change to screen readers
    announceFilterChange(section);
  }

  /**
   * Update active button styling
   * @param {HTMLElement} button - Button to set as active
   */
  function updateActiveButton(button) {
    if (!dom.navButtons) return;

    dom.navButtons.forEach((btn) => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });

    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    button.focus();
  }

  /**
   * Announce filter change to screen readers
   * @param {string} section - Section name
   */
  function announceFilterChange(section) {
    const sectionLabel = {
      all: 'All Dialogues',
      interviews: 'Interviews',
      conversations: 'Conversations',
    };

    const message = `Showing ${sectionLabel[section] || section}`;
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      announcement.remove();
    }, 1000);
  }

  /**
   * Load dialogue content (stub for future data loading)
   * This would fetch from SYMPOSION_CONFIG or an API endpoint
   */
  function loadContent() {
    // Content is statically generated in HTML
    // This function can be enhanced to dynamically render from config
  }

  /**
   * Add speaker highlight on hover
   */
  function enhanceSpeakerInteraction() {
    const speakers = document.querySelectorAll('.speaker-badge');

    speakers.forEach((badge) => {
      badge.addEventListener('mouseenter', function () {
        this.style.transform = 'scale(1.05)';
      });

      badge.addEventListener('mouseleave', function () {
        this.style.transform = 'scale(1)';
      });
    });
  }

  /**
   * Initialize smooth scroll for linked dialogues
   */
  function initializeLinkNavigation() {
    const dialogueLinks = document.querySelectorAll('.symposion-link');

    dialogueLinks.forEach((link) => {
      link.addEventListener('click', function (event) {
        // Smooth scroll and optional modal/expand behavior
        // event.preventDefault();
        // Implement as needed
      });
    });
  }

  /**
   * Public API
   */
  return {
    initialize,
    filterBySection,
    currentSection: () => currentSection,
  };
})();

/**
 * Initialize when DOM is ready (if not already initialized by HTML script tag)
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    SymposionChamber.initialize();
  });
} else {
  SymposionChamber.initialize();
}
