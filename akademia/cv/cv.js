/**
 * ETCETER4 Interactive CV
 * Manages facet switching, mode toggling, and museum lenses
 */

class InteractiveCV {
  constructor() {
    this.currentFacet = 'overview';
    this.currentMode = 'professional';
    this.currentLens = 'collector';

    this.init();
  }

  init() {
    // Set up facet buttons
    document.querySelectorAll('.facet-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const facet = e.target.dataset.facet;
        this.switchFacet(facet);
      });
    });

    // Set up mode toggle buttons
    document
      .getElementById('mode-professional')
      .addEventListener('click', () => {
        this.switchMode('professional');
      });
    document
      .getElementById('mode-experimental')
      .addEventListener('click', () => {
        this.switchMode('experimental');
      });

    // Set up lens buttons
    document.querySelectorAll('.lens-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const lens = e.target.dataset.lens;
        this.switchLens(lens);
      });
    });

    // Handle URL hash on load
    this.handleURLHash();

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.handleURLHash();
    });
  }

  switchFacet(facet) {
    // Update button states
    document.querySelectorAll('.facet-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.facet === facet);
    });

    // Hide all sections
    document.querySelectorAll('.cv-section').forEach(section => {
      section.classList.add('hidden');
    });

    // Show selected section with fade-in
    const targetSection = document.getElementById(`${facet}-section`);
    if (targetSection) {
      setTimeout(() => {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('fade-in');
      }, 50);
    }

    this.currentFacet = facet;

    // Update URL hash
    this.updateURLHash();
  }

  switchMode(mode) {
    this.currentMode = mode;

    // Update button states
    document
      .getElementById('mode-professional')
      .classList.toggle('active', mode === 'professional');
    document
      .getElementById('mode-experimental')
      .classList.toggle('active', mode === 'experimental');

    // Update body class
    document.body.classList.toggle(
      'experimental-mode',
      mode === 'experimental'
    );

    // In experimental mode, you might add subtle glitches, animations, etc.
    if (mode === 'experimental') {
      this.enableExperimentalMode();
    } else {
      this.disableExperimentalMode();
    }

    this.updateURLHash();
  }

  switchLens(lens) {
    this.currentLens = lens;

    // Update button states
    document.querySelectorAll('.lens-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lens === lens);
    });

    // Switch views for all work items
    document.querySelectorAll('.work-item').forEach(item => {
      const views = item.querySelectorAll('.work-view');
      views.forEach(view => {
        if (view.classList.contains(`${lens}-view`)) {
          view.classList.remove('hidden');
          view.classList.add('fade-in');
        } else {
          view.classList.add('hidden');
          view.classList.remove('fade-in');
        }
      });
    });

    this.updateURLHash();
  }

  enableExperimentalMode() {
    // Add subtle glitch effects
    this.glitchInterval = setInterval(() => {
      if (Math.random() < 0.05) {
        // 5% chance per interval
        this.subtleGlitch();
      }
    }, 2000);

    // Add subtle background animation
    document.body.style.animation = 'subtleShift 60s ease-in-out infinite';
  }

  disableExperimentalMode() {
    // Clear glitch interval
    if (this.glitchInterval) {
      clearInterval(this.glitchInterval);
      this.glitchInterval = null;
    }

    // Remove background animation
    document.body.style.animation = '';
  }

  subtleGlitch() {
    // Very subtle text glitch effect
    const elements = document.querySelectorAll('h2, h3, p');
    if (elements.length === 0) return;

    const target = elements[Math.floor(Math.random() * elements.length)];
    const originalText = target.textContent;

    // Glitch for just 100ms
    target.style.filter = 'blur(2px)';
    target.style.transform = 'translateX(2px)';

    setTimeout(() => {
      target.style.filter = '';
      target.style.transform = '';
    }, 100);
  }

  updateURLHash() {
    // Create shareable URL with current state
    const hash = `#${this.currentFacet}/${this.currentMode}/${this.currentLens}`;
    window.history.replaceState(null, null, hash);
  }

  handleURLHash() {
    const hash = window.location.hash.slice(1); // Remove #
    if (!hash) return;

    const parts = hash.split('/');

    if (parts[0]) {
      const facet = parts[0];
      if (
        ['overview', 'academic', 'professor', 'designer', 'artist'].includes(
          facet
        )
      ) {
        this.switchFacet(facet);
      }
    }

    if (parts[1]) {
      const mode = parts[1];
      if (['professional', 'experimental'].includes(mode)) {
        this.switchMode(mode);
      }
    }

    if (parts[2]) {
      const lens = parts[2];
      if (['collector', 'archaeologist', 'critique'].includes(lens)) {
        this.switchLens(lens);
      }
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const cv = new InteractiveCV();

  // Add smooth scroll behavior
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });
});

// Export sharing functionality
function shareCV() {
  const url = window.location.href;

  if (navigator.share) {
    navigator
      .share({
        title: 'ET CETER4 - CV',
        url: url,
      })
      .catch(err => console.log('Share failed', err));
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      alert('CV link copied to clipboard!');
    });
  }
}
