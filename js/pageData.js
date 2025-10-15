/**
 * PageTree
 * 
 */

const _pID = {
    "landing": "#landing",
    "menu": "#menu",
    "sound": "#sound",
    "vision": "#vision",
    "words": "#words",
    "blog": "#blog",
    "diary": "#diary",
    "video": "#video",
    "stills": "#stills",
    "info": "#info"
}

let pages = [];

pages.menu = new Page ({
    "id": _pID.menu,
    "tier": 2,
    "downLinks": [_pID.words, _pID.sound, _pID.vision, _pID.info],
    "upLinks": [_pID.landing],
    "initialize": function () {
        // get the lib and sketch
        $.cachedScript( "js/vendor/p5.js" ).done(function( script, textStatus ) {});
        // $.cachedScript( "js/sketch.js" ).done(function( script, textStatus ) {});
    }
});

pages.sound = new Page ({
    "id": _pID.sound,
    "tier": 3,
    "upLinks": [_pID.menu],
    "initialize": function () {
        // add the iFrames
        const _iFrames = [
            '<iframe style="border: 0; width: 300px; height: 300px;" src="http://bandcamp.com/EmbeddedPlayer/album=3780915385/size=large/bgcol=ffffff/linkcol=0687f5/minimal=true/transparent=true/"><a href="http://music.etceter4.com/album/ogod">OGOD by ET CETER4</a></iframe>',
            '<iframe style="border: 0; width: 300px; height: 300px;" src="http://bandcamp.com/EmbeddedPlayer/album=604244064/size=large/bgcol=ffffff/linkcol=333333/minimal=true/transparent=true/"><a href="http://music.etceter4.com/album/et-ceter4-rmxs">ET CETER4 RMXS by ET CETER4</a></iframe>',
            '<iframe style="border: 10px; width: 300px; height: 300px;" src="http://bandcamp.com/EmbeddedPlayer/album=489900059/size=large/bgcol=ffffff/linkcol=0687f5/minimal=true/transparent=true/"><a href="http://music.etceter4.com/album/the-progression-of-digression">ProgressionDigression by ET CETER4</a></iframe>',
            '<iframe style="border: 10px; width: 300px; height: 300px;" src="http://bandcamp.com/EmbeddedPlayer/album=448587485/size=large/bgcol=ffffff/linkcol=de270f/minimal=true/transparent=true/"><a href="http://music.etceter4.com/album/etc">Etc by ET CETER4</a></iframe>'
        ]
        
        $('#sound #BCContainer').each(function (index) {
            $(this).html(_iFrames[index]);
        });
    }
});

pages.stills = new Page ({
    "id": _pID.stills,
    "tier": 4,
    "upLinks": [_pID.vision],
    "initialize": function () {
        replacePlaceholders(this.id);    
    }
});

pages.diary = new Page ({
    "id": _pID.diary,
    "tier": 4,
    "upLinks": [_pID.words],
    "initialize": function () {
        replacePlaceholders(this.id);
    }
});

pages.info = new Page({
    "id": _pID.info,
    "upLinks": [_pID.menu]
});

pages = [pages.menu, pages.sound, pages.stills, pages.diary, pages.info, new Page({
    "id": _pID.landing,
    "tier": 1,
    "downLinks": [_pID.menu],
}), new Page ({
    "id": _pID.vision,
    "tier": 3,
    "upLinks": [_pID.menu],
}), new Page ({
    "id": _pID.words,
    "tier": 3,
    "downLinks": [_pID.diary, _pID.blog],
    "upLinks": [_pID.menu],
}), new Page ({
    "id": _pID.blog,
    "tier": 4,
    "upLinks": [_pID.words],
}), new Page ({
    "id": _pID.video,
    "tier": 4,
    "upLinks": [_pID.vision],
})]

// taken from here: https://api.jquery.com/jquery.getscript/
jQuery.cachedScript = function( url, options ) {
 
  // Allow user to set any option except for dataType, cache, and url
  options = $.extend( options || {}, {
    dataType: "script",
    cache: true,
    url: url
  });
 
  // Use $.ajax() since it is more flexible than $.getScript
  // Return the jqXHR object so we can chain callbacks
  return $.ajax( options );
};