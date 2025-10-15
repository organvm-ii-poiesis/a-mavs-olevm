"use strict"; 

/**
 * @global {Object} currentPage - current page object
 * @global {Boolean} adIsLoaded - tells us whether or not the ad has been loaded
 */

let currentPage = {};
const adIsLoaded = false;

/** 
 * Page Object
 * 
 * @param {string} id - identifier, equal to their HTML element ID name
 * @param {number} tier - their row in the tree
 * @param {String[]} downlink - element id's connected to them below in the tree
 * @param {String[]} uplinks - element id's connected to them above them in the tree
 * @param {string} trace - location of what page you came from if traversing from beyond direct links of tree
 * @param {function} initialize - create initial state for page
 * @param {function} load - loads the page
 *
 */

function Page ( _p ) {

    // core data
    this.id = _p.id || "";
    this.tier = _p.tier || 0;
    this.downLinks = _p.downLinks || [];
    this.upLinks = _p.upLinks || [];
    
    // page state
    this.trace = "";
    this.isVisible = false;
    this.isInitialized = false;
    this.isInitializing = false;
    this.isLoaded = false;
    this.isLoading = false;
    this.hasAllData = false;

    // page handlers
    this.initialize = _p.initialize || function () {};
    this.load = _p.load || function () {};

}

/**
 * Initializes the page
 * 
 */

Page.prototype.initPage = function () {
    if ( !this.isInitialized && !this.isInitializing ) { 
        this.isInitializing = true;
        this.initialize();
        this.isInitializing = false;
        this.isInitialized = true;
    }
}

/**
 * getBackElement
 * 
 * @summary Takes a page and returns the name of the section that will bring you back
 * 
 * @param {string} _Page - the html element of the page your looking for the back for
 * 
 */

Page.prototype.getBackElement = function ( _Page ) {
	_Page = _Page || this;
    const pageObj = Page.findPage(_Page.id);
	
    if (pageObj.trace) {
		return pageObj.trace;
	} else if (pageObj.upLinks[0]) {
        // always return the left most link
		return Page.findPage(pageObj.upLinks[0]);
	} else {
		return "";
	}
}

/**
 * findPage
 * 
 * @summary - Takes a page identifier and returns the object if found
 * 
 * @param {string} _pageid - the page id your searching for
 * 
 */

Page.findPage = function ( _pageid ) {
    const index = pages.findIndex (function (current) { return _pageid === current.id; });
    if (index === -1) { throw "Can't find page"; }
    else { return pages[index]; }
}

/**
 * showNewSection
 * 
 * @summary - Navigates from the currently loaded section to the section provided (loading section).
 * It performs an animation that fades out the current section, then fades in the loading section.
 *
 * @param {String} loadingSection - page to be faded in
 * @returns {Boolean} true if successful
 * 
*/

function showNewSection ( _loadingSection ) {
    if (!_loadingSection || currentPage.isLoading) {
        return false; // loadingSection isn't defined, or the page is loading
    } else {
        const loadingSection = Page.findPage( _loadingSection );

        loadingSection.initPage();

        fadeOutPage(currentPage, function() {
            fadeInPage( loadingSection );
        });
    }
    return true;
}

/**
 *  Fades in a page
 * 
 * @param {Object} Page - page to be faded in
 * @returns {Boolean} true if successful
 */

function fadeInPage (_Page, _cb) {
    let _display;

    if (_Page.isLoading === false) {
        // make sure opacity is 0 & then the object is there
        $(_Page.id).css("opacity", 0);
        if (_Page.id === "#stills" || _Page.id === "#diary") { _display = "table"; }

        // fade in next section
        $(_Page.id).velocity("fadeIn", {
            delay: 0,
            duration: 0, // 500
            display: _display,
            easing: "easeInSine",
            begin: function () {
                _Page.isLoading = true;
            },
            complete: function () {
                // console.log("Finished Fade In")
                _Page.isLoading = false;
                window.currentPage = _Page;
                if (_cb) { _cb(); return true; } else { return true; }
            }
        });
    } else {
        // prevents fast clicking of the buttons from overloading the function
        return false;
    }
}


/**
 *  Fades out a page
 * 
 * @param {Object} _Page - page to be faded out
 * @returns {Boolean} true if successful
 */

function fadeOutPage ( _Page, _cb) {
    if ( _Page.isLoading === false ) {
        const displayOfPage = $(_Page.id).css("display");
        // make sure it's not fading out a hidden or non existant element
        if ( displayOfPage !== undefined && displayOfPage !== "none") {
            $(_Page.id).velocity("fadeOut", {
                delay: 1000,
                duration: 200, // 200-300
                easing: "ease-out",
                begin: function () {
                    currentPage = _Page;
                    _Page.isLoading = true;
                },
                complete: function () {
                    // hide the current page when faded out
                    // console.log('Finished fadeout');
                    $(_Page.id).addClass("dn");
                    _Page.isLoading = false;
                    currentPage.isLoading = false;
                    if (_cb) { _cb(); return true; } else { return true; }
                }
            });
        } else {
            currentPage.isLoading = false;
            return false; // Page isn't loaded
        }
    } else {
        return false; // Page is already loading
    }
}



/**
 * Site navigation listeners
 */

// these listen for when the page is meant to be loaded, trys to init then load, then fade out the current section
// if any, then fade in the new section
$("#backButton").on("click", function () { showNewSection(currentPage.getBackElement().id) });
$("#toLandingPage").on("click", function() { showNewSection("#landing"); });
$("#toMenuPage").on("click", function() { showNewSection("#menu"); });
$("#toWordsPage").on("click", function() { showNewSection("#words"); });
// $("#toSoundPage").on("click", function() { showNewSection("#sound"); });
$("#toVisionPage").on("click", function() { showNewSection("#vision"); });
$("#toInfoPage").on("click", function() { showNewSection("#info"); });
$("#toVideoPage").on("click", function() { showNewSection("#video"); });
$("#toStillsPage").on("click", function() { showNewSection("#stills"); });
$("#toMapPage").on("click", function() { showNewSection("#sitemap"); });
$("#toDiaryPage").on("click", function() { showNewSection("#diary"); });
$("#toBlogPage").on("click", function() { showNewSection("#blog"); });
$("#toLoopPage").on("click", function() { showNewSection("#loop"); });

$("#SoundBackButton").on("click", function() { showNewSection("#menu"); });
$("#WordBackButton").on("click", function() { showNewSection("#menu"); });
$("#VisionBackButton").on("click", function() { showNewSection("#menu"); });
$("#InfoBackButton").on("click", function() { showNewSection("#menu"); });

$("#VideoBackButton").on("click", function() { showNewSection("#vision"); });
$("#VideoBackButton2").on("click", function() { showNewSection("#vision"); });
$("#VideoBackButton3").on("click", function() { showNewSection("#vision"); });
$("#VideoBackButton4").on("click", function() { showNewSection("#vision"); });
$("#VideoBackButton5").on("click", function() { showNewSection("#vision"); });

/* 
 * Mobile Menu Button 
 */

$(".c-hamburger").on("click", function() {
    const hamburgerMenu = $(".c-hamburger");
    const mobileMenu = $(".mobileMenu");

    if (hamburgerMenu.hasClass("is-active")) {
        hamburgerMenu.removeClass("is-active");
        mobileMenu.removeClass("open");
    } else {
        hamburgerMenu.addClass("is-active");
        mobileMenu.addClass("open");
    }
});