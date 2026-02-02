/**
 * Changes the background image positions for OGOD pages
 * Uses ETCETER4_CONFIG for configurable values
 */

'use strict';

/**
 * OGOD animation interval ID - stored for cleanup
 * @type {number|null}
 */
let ogodIntervalId = null;

/**
 * Resize the background image container
 */
function resizeOgodBackground() {
  const gridSize =
    typeof ETCETER4_CONFIG !== 'undefined' ? ETCETER4_CONFIG.ogod.gridSize : 21;
  $('#bgi').width($(window).width() * gridSize);
  $('#bgi').height($(window).height() * gridSize);
}

/**
 * Cleanup OGOD resources - clears interval and removes resize handler
 * Should be called when navigating away from OGOD pages
 */
function cleanupOgod() {
  if (ogodIntervalId !== null) {
    clearInterval(ogodIntervalId);
    ogodIntervalId = null;
  }
  $(window).off('resize.ogod');
}

$('#bgi').on('load', () => {
  const config =
    typeof ETCETER4_CONFIG !== 'undefined'
      ? ETCETER4_CONFIG.ogod
      : { gridSize: 21, totalFrames: 410, frameInterval: 120 };

  // Clean up any existing interval before starting new one
  if (ogodIntervalId !== null) {
    clearInterval(ogodIntervalId);
  }

  $('#bgi').css('visibility', 'visible');
  resizeOgodBackground();
  let f = 0;
  ogodIntervalId = setInterval(() => {
    $('#bg').css('left', `-${(f % config.gridSize) * $(window).width()}px`);
    $('#bg').css(
      'top',
      `-${Math.floor(f / config.gridSize) * $(window).height()}px`
    );
    f = f + 1;
    if (f === config.totalFrames) {
      f = 0;
    }
  }, config.frameInterval);
});

// Use namespaced event for proper cleanup
$(window).on('resize.ogod', () => {
  resizeOgodBackground();
});
