/**
 * Changes the background image positions for OGOD pages
 */

function r() {
    $("#bgi").width($(window).width() * 21);
    $("#bgi").height($(window).height() * 21);
}

$("#bgi").on("load", (function () {
    $("#bgi").css("visibility", "visible");
    r();
    let f = 0;
    setInterval(function () {
        $("#bg").css("left", "-" + ((f % 21) * $(window).width()) + "px");
        $("#bg").css("top", "-" + ((Math.floor(f / 21)) * $(window).height()) + "px");
        f = f + 1;
        if (f == 410) f = 0;
    }, 120);
}));

$(window).resize(function () { r(); });