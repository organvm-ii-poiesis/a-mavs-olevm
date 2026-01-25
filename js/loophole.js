'use strict';

/**
 * LOOPHOLE RANDOMIZER
 * Navigate to a random labyrinth page
 */
function randomlinks() {
  const links = [
    'labyrinth/040615.html',
    'labyrinth/040715.html',
    'labyrinth/040815.html',
    'labyrinth/040915.html',
    'labyrinth/041015.html',
    'labyrinth/041315.html',
    'labyrinth/041415.html',
    'labyrinth/041715.html',
    'labyrinth/042115.html',
    'labyrinth/042215.html',
    'labyrinth/051815.html',
    'labyrinth/072716.html',
  ];
  const randomIndex = Math.floor(Math.random() * links.length);
  window.location.href = links[randomIndex];
}

const totalCount = 99;

/**
 * Set a random background image
 * Uses modern CSS approach instead of deprecated document.body.background
 */
function ChangeIt() {
  const num = Math.ceil(Math.random() * totalCount);
  document.body.style.backgroundImage = 'url(bgimages/' + num + '.jpg)';
  document.body.style.backgroundRepeat = 'repeat';
}

/**
 * Initialize loophole page with event handlers
 * Attaches click handlers to all loophole links
 */
function initLoophole() {
  // Attach event handlers to all loophole links
  const loopholeLinks = document.querySelectorAll('#loop a[href="#"]');
  loopholeLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      randomlinks();
    });
  });

  ChangeIt();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoophole);
} else {
  initLoophole();
}
