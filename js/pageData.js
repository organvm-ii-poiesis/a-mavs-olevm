/**
 * @file pageData.js
 * @description Page configuration and data management for etceter4.com
 * Defines the page tree structure, relationships, and initialization logic
 * for all pages in the site navigation system.
 *
 * @requires page.js - Page constructor and prototype methods
 * @requires jQuery - For DOM manipulation and AJAX
 *
 * This file creates the page hierarchy and defines:
 * - Page IDs and their relationships (upLinks, downLinks)
 * - Page tier levels in the navigation tree
 * - Initialization functions for each page
 * - Dynamic content loading for various sections
 */

/**
 * Page ID constants
 * @const {Object} _pID - Maps page names to their HTML element IDs
 * @property {string} landing - Landing page ID
 * @property {string} menu - Main menu page ID
 * @property {string} sound - Sound/music section ID
 * @property {string} vision - Visual content section ID
 * @property {string} words - Written content section ID
 * @property {string} blog - Blog section ID
 * @property {string} diary - Diary/journal section ID
 * @property {string} video - Video content section ID
 * @property {string} stills - Still images/photos section ID
 * @property {string} info - Information/about section ID
 */

const _pID = {
  landing: '#landing',
  menu: '#menu',
  sound: '#sound',
  vision: '#vision',
  words: '#words',
  blog: '#blog',
  diary: '#diary',
  video: '#video',
  stills: '#stills',
  info: '#info',
};

/**
 * Pages array - Contains all page instances
 * @type {Page[]}
 * @global
 *
 * Each page is created with:
 * - id: HTML element ID (matches _pID constants)
 * - tier: Depth level in navigation tree (higher = deeper)
 * - upLinks: Array of parent page IDs (for back navigation)
 * - downLinks: Array of child page IDs (for forward navigation)
 * - initialize: Function called on first page load
 * - load: Function called on subsequent page loads (optional)
 *
 * Navigation Flow:
 * Landing (tier 1) → Menu (tier 2) → Content sections (tier 3) → Detail pages (tier 4)
 */
let pages = [];

/**
 * Menu page configuration
 * Tier 2 - Main hub connecting to all major sections
 */
pages.menu = new Page({
  id: _pID.menu,
  tier: 2,
  downLinks: [_pID.words, _pID.sound, _pID.vision, _pID.info],
  upLinks: [_pID.landing],
  initialize: function () {
    // get the lib and sketch
    $.cachedScript('js/vendor/p5.js').done(function (script, textStatus) {});
    // $.cachedScript( "js/sketch.js" ).done(function( script, textStatus ) {});
  },
});

/**
 * Sound page configuration
 * Tier 3 - Music/audio section with embedded Bandcamp players
 * Initializes with album iframes from Bandcamp
 */
pages.sound = new Page({
  id: _pID.sound,
  tier: 3,
  upLinks: [_pID.menu],
  initialize: function () {
    // add the iFrames
    const _iFrames = [
      '<iframe style="border: 0; width: 300px; height: 300px;" src="http://bandcamp.com/EmbeddedPlayer/album=3780915385/size=large/bgcol=ffffff/linkcol=0687f5/minimal=true/transparent=true/"><a href="http://music.etceter4.com/album/ogod">OGOD by ET CETER4</a></iframe>',
      '<iframe style="border: 0; width: 300px; height: 300px;" src="http://bandcamp.com/EmbeddedPlayer/album=604244064/size=large/bgcol=ffffff/linkcol=333333/minimal=true/transparent=true/"><a href="http://music.etceter4.com/album/et-ceter4-rmxs">ET CETER4 RMXS by ET CETER4</a></iframe>',
      '<iframe style="border: 10px; width: 300px; height: 300px;" src="http://bandcamp.com/EmbeddedPlayer/album=489900059/size=large/bgcol=ffffff/linkcol=0687f5/minimal=true/transparent=true/"><a href="http://music.etceter4.com/album/the-progression-of-digression">ProgressionDigression by ET CETER4</a></iframe>',
      '<iframe style="border: 10px; width: 300px; height: 300px;" src="http://bandcamp.com/EmbeddedPlayer/album=448587485/size=large/bgcol=ffffff/linkcol=de270f/minimal=true/transparent=true/"><a href="http://music.etceter4.com/album/etc">Etc by ET CETER4</a></iframe>',
    ];

    $('#sound #BCContainer').each(function (index) {
      $(this).html(_iFrames[index]);
    });
  },
});

/**
 * Stills page configuration
 * Tier 4 - Image gallery section
 * Uses replacePlaceholders function to load dynamic image content
 */
pages.stills = new Page({
  id: _pID.stills,
  tier: 4,
  upLinks: [_pID.vision],
  initialize: function () {
    replacePlaceholders(this.id);
  },
});

/**
 * Diary page configuration
 * Tier 4 - Journal/blog entries section
 * Uses replacePlaceholders function to load dynamic diary content
 */
pages.diary = new Page({
  id: _pID.diary,
  tier: 4,
  upLinks: [_pID.words],
  initialize: function () {
    replacePlaceholders(this.id);
  },
});

/**
 * Info page configuration
 * About/information section with contact and details
 */
pages.info = new Page({
  id: _pID.info,
  upLinks: [_pID.menu],
});

pages = [
  pages.menu,
  pages.sound,
  pages.stills,
  pages.diary,
  pages.info,
  new Page({
    id: _pID.landing,
    tier: 1,
    downLinks: [_pID.menu],
  }),
  new Page({
    id: _pID.vision,
    tier: 3,
    upLinks: [_pID.menu],
  }),
  new Page({
    id: _pID.words,
    tier: 3,
    downLinks: [_pID.diary, _pID.blog],
    upLinks: [_pID.menu],
  }),
  new Page({
    id: _pID.blog,
    tier: 4,
    upLinks: [_pID.words],
  }),
  new Page({
    id: _pID.video,
    tier: 4,
    upLinks: [_pID.vision],
  }),
];

// taken from here: https://api.jquery.com/jquery.getscript/
jQuery.cachedScript = function (url, options) {
  // Allow user to set any option except for dataType, cache, and url
  options = $.extend(options || {}, {
    dataType: 'script',
    cache: true,
    url: url,
  });

  // Use $.ajax() since it is more flexible than $.getScript
  // Return the jqXHR object so we can chain callbacks
  return $.ajax(options);
};
