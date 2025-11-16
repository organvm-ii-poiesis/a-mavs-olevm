/*
 *
 * Considering following the idiomatic style guide
 * https://www.npmjs.com/package/eslint-config-idiomatic
 * https://github.com/rwaldron/idiomatic.js
 *
 */

/**
 * Document on load functions
 */

$(document).ready(() => {
  const hash = window.location.hash;
  // Goes to the section in the URL
  if (hash) {
    const _hash = $(hash);

    _hash.removeClass('dn');
    if (hash === '#stills' || hash === '#diary') {
      _hash.addClass('dt');
    }
    currentPage = Page.findPage(hash);
    currentPage.initPage();
  } else {
    $('#landing').removeClass('dn');
    currentPage = Page.findPage('#landing');
  }
});
