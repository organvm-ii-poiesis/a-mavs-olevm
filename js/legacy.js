/*********************************************/
/*********************************************/
/*********************************************/
/*********************************************/
/***********        LEGACY         ***********/
/*********************************************/
/*********************************************/
/*********************************************/

/*
 * Resizes all the pages widths and heights when the window resizes
 */

$(window).resize(function () {
  // var windowHeight = $(window).height();
  // var headerHeight = $("#header").height();
  // var footerHeight = $("#footer").height();
  // $("#pages").css("height", windowHeight - headerHeight - footerHeight + "px");
});

//////
//////
//////

/*
 * Changes the Header colors
 * @param {string} bgColor - a color that will be applied to the element
 * @param {string} fontColor - a color that will applied to the child of the child within the element
 * @param {string} aClass - the HTML element, class, or id to be changed.
 - It returns true if successful

 function changeHeader(, bgColor, fontColor) { ... } ; stub

 */

function changeHeader(bgColor, fontColor, aClass) {
  // change the color of the background of the element to bgColor
  $('header').css('background-color', bgColor);

  // gets the child of the child & changes the font color
  var aChildren = $('header').find('a');
  aChildren.css('color', fontColor);
  aChildren.removeClass();
  aChildren.addClass(aClass);

  return true;
}

/*
 * Change Header Tests
 *
 * prep:
 * create an element within the body that has 3 tiers
 *
 * execution:
 * run it on a element & see if bgColor and font color are what's expected
 */

// changeHeader("blue", "red", "class2c"); // test

//////
//////
//////

/**
 * Changes the footer style
 *
 * @param a color that will be applied to the element
 * @param {string} aClass - a HTML element, class, or id.
 * @returns {boolean} true if successful
 *
 */

function changeFooter(bgColor, fillColor, fontColor, aClass) {
  var footer = $('footer');
  footer.css('background-color', bgColor);
  footer.find('#backButton').css('color', fillColor);
  footer.find('svg').css('fill', fillColor);

  var aChildren = $('footer').find('a');
  aChildren.css('color', fontColor);
  aChildren.removeClass();
  aChildren.addClass(aClass);

  return true;
}
