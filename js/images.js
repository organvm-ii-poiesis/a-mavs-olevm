/**
 * @file Handles image loading & processing.
 * @author gabriel
 */ 

/**
 * appendImagesTo
 * 
 * @summary Appends images to an element 
 * 
 * @param {string} element - html element you're appending to
 * @param {string} location - pathway to the images
 * @param {string} prefix - prefix of the name of the images are 
 * @param {string} fileExtension - file extension of the images. Must include a period (.)
 * @param {number} start - integer value we should start at (inclusive)
 * @param {number} end - integer value we should stop at (inclusive)
 */

function appendImagesTo (element, location, prefix, fileExtension, start, end) {
    const srcContents = location + prefix;
    element = $(element)
    while (start <= end) {
        element.append('<div id="stillsImage" class="dn v-mid heightControl-stills min-h-21_875rem min-h-28_125rem-ns tc h-100">' + 
                            '<img class="mw-100 mh-100 w-auto h-auto anim anim-easeout" src="' + srcContents + start + fileExtension + '"/>' + 
                        '</div>');
        start++;
    }
}

/**
 * replacePlaceholders
 * 
 * @summary Replaces the placeholders of any images within a page
 * 
 * @param {string} element - html element to search
 */

function replacePlaceholders (element) {
    const images = $(element).find("img[src='img/placeholder.jpg']");
    if (images.length !== 0) {
        images.each( function ()  {
            const actualImage = $(this).attr("data-src");
            $(this).attr("src", actualImage);  
        });
    }
}

/**
 * Carousel
 * 
 * @summary A pretty dope carousel for images
 * 
 * @param {string} element - html element to search
 */

function Carousel ( _c ) {
    this.id = _c.id || "";
    this.page = _c.page || null;
    this.caption = _c.caption || null;
    this.index = _c.index || 0;
    this.total = _c.total || 0;
    this.images = _c.images || [];
    this.loadOffset = _c.loadOffset || 0;
    this.indexLoadLeft = _c.indexLoadLeft || 0;
    this.indexLoadRight = _c.indexLoadRight || this.total - 1;
    this.totalLoaded = _c.totalLoaded || 0;
}

Carousel.prototype.incIndex = function () {
    const _index = this.index + 1;
    if (_index > this.total - 1 ) {
        this.setIndex(0);
    } else {
        this.index = _index;
    }
}

Carousel.prototype.decIndex = function () {
    const _index = this.index - 1;
    if (_index < 0 ) {
        this.setIndex(this.total - 1);
    } else {
        this.index = _index;
    }
}

Carousel.prototype.setIndex = function (n) {
    this.index = n;
}

Carousel.prototype.loadCaption = function (img) {
    const _img = img.children().attr("src");
    const regExp = /img\/photos\/[a-z]*\/([a-z]*)(\d*)/g;
    const match = regExp.exec(_img);
    const name = match[1];
    const num = match[2];
    const caption = stillsData[name][num];

    console.log(name + " " + num);
    console.log(stillsData[name][num]);
    if (caption !== undefined) {
        this.caption.html(caption);
    } else {
        this.caption.html('');
    }
}

Carousel.prototype.setIndicator = function () {
    const adjIndex = this.index + 1;
    $('#stills-indicator').text(adjIndex.toString() + "/" + this.total);
}

Carousel.prototype.loadImages = function () {
    const _stillsPage = Page.findPage(this.id);
    if (!_stillsPage.hasAllData) {
        const _images = this.images;
        const len = _images.length;
        if (_images[0] !== undefined) {
            for (let i = 0; i < len; i++) {
                const _name = _images[i][0];
                const _imgAmount = _images[i][1];
                const _start = _name === "media" ? 4 : 1;
                appendImagesTo(this.id + " #imageContainer", "img/photos/" + _name + "/", _name, ".jpg", _start, _imgAmount);
            }

            _stillsPage.hasAllData = true;
            return true;
        } else {
            return false;
        }
    }
}

// when this is emitted, the Carousel has began to slide into a new image
Carousel.prototype.emitSlide = function (dir) {
    $( this.id ).trigger( "carousel:slide", [this.index, this.indexLoadLeft, this.indexLoadRight, this.images, dir, this] );
}

const stillsCarousel = new Carousel({
    "id": "#stills",
    "images": [["media", 44], ["faster", 28], ["slip", 6], ["live", 5]],
    "total": 44 + 5 + 28 + 6,
    "indexLoadLeft": $('[id*=stillsImage]').length,
    "loadOffset": 4,
    "caption": $('#stillsCaption')
});

const stillsData = {
    "media" : {
        "1": "Fires, fury, absolution.<br>Delusion, fantasy, insincerity.<br>Constants follow us.<br>News breaks us.",
        "2": "Culture, rocks, freedom.<br>Eat me, hide me.",
        "3": "It's simple, belive us. Believe us. Believe us.",
        "4": "",
        "5": "",
        "6": "",
        "7": "",
        "8": "",
        "9": "",
        "10": "",
        "11": "",
        "12": "",
        "13": "",
        "14": "",
        "15": "",
        "16": "",
        "17": "",
        "18": "",
        "19": "",
        "20": "",
        "21": "",
        "22": "",
        "23": ""
    },
    "live": {
        "1": "perception",
        "2": "",
        "3": "",
        "4": "",
        "5": ""
    },
    "faster": {
        "1": "console, swell.<br>the clean within",
        "2": "",
        "3": "",
        "4": "",
        "5": ""
    },
    "slip": {
        "1": "darkness",
        "2": "",
        "3": "",
        "4": "",
        "5": "",
        "6": ""
    }
}


/**
 * Image handlers
 * 
 */

$('#stills-left').on('click', function() {
    const img = $('#stillsImage.dtc');
    const sC = stillsCarousel;
    const _tmpIndex = sC.index;
    let loadingImage;

    sC.decIndex();
    sC.emitSlide('left');
    sC.setIndicator();
    img.removeClass('dtc').addClass('dn');

    if (_tmpIndex !== 0) {
        loadingImage = img.prev();
        loadingImage.addClass('dtc').removeClass('dn');
        loadingImage.children().addClass('anim-fadeIn');
    } else {
        loadingImage = $('[id*=stillsImage]').last();
        loadingImage.addClass('dtc').removeClass('dn');
        loadingImage.children().addClass('anim-fadeIn');
    }
    sC.loadCaption(loadingImage);
});

$('#stills-right').on('click', function() {
    const img = $('#stillsImage.dtc');
    const sC = stillsCarousel;
    const _tmpIndex = sC.index + 1;
    let loadingImage;

    sC.incIndex();
    sC.emitSlide('right'); 
    sC.setIndicator();
    img.removeClass('dtc').addClass('dn');

    if (_tmpIndex < sC.total) {
        loadingImage = img.next()
        loadingImage.addClass('dtc').removeClass('dn');
        loadingImage.children().addClass('anim-fadeIn');
    } else {
        loadingImage = $('[id*=stillsImage]').first()
        loadingImage.addClass('dtc').removeClass('dn');
        loadingImage.children().addClass('anim-fadeIn');
    }
    sC.loadCaption(loadingImage);
});

$("#stills").on("carousel:slide", function(event, _index, _indexLoadLeft, _indexLoadRight, _images, _dir, _this) {
    const _stillsPage = Page.findPage('#stills')
    if (_stillsPage.hasAllData === true) {
        // disable the event handler
        $("#stills").off("carousel:slide");
        return;
    } else if (_index === _indexLoadLeft || _index === _indexLoadRight) {
        _this.loadImages();
    }
});







// Carousel.prototype.updateTotalLoaded = function () {
//     this.totalLoaded = $('[id*=stillsImage]').length;
// }
// 
// Carousel.prototype.loadLeft = function () {
//     console.log('load left event');
//     var _stillsPage = Page.findPage(this.id);
//     if (!_stillsPage.hasAllData) {
//         var _images = this.images;
//         if (_images[0] !== undefined) {
//             var _name = _images[0][0];
//             var _imgAmount = _images[0][1];
//             var _start = 1;
//             // console.log(_last + " " + _name + " " + _imgAmount);
            
//             if(_name === "media"){
//                 _start = 4
//             }

//             appendImagesTo(this.id + " #imageContainer", "img/photos/" + _name + "/", _name, ".jpg", _start, _imgAmount);
//             this.setLoadLeftIndex(_imgAmount);
//             this.images.splice(0, 1);
//             this.updateTotalLoaded();

//             return;
//         } else {
//             _stillsPage.hasAllData = true;
//             return;
//         }
//     }
// }

// Carousel.prototype.loadRight = function () {
//     console.log('load right event');
//     var _stillsPage = Page.findPage(this.id);
//     if (!_stillsPage.hasAllData) {
//         var _images = this.images;
//         if (_images[0] !== undefined) {
//             var _last = _images.length - 1;
//             var _name = _images[_last][0];
//             var _imgAmount = _images[_last][1];
//             var _start = 1;
            
//             if(_name === "media"){
//                 _start = 4
//             }
//             appendImagesTo(this.id + " #imageContainer", "img/photos/" + _name + "/", _name, ".jpg", _start, _imgAmount);
//             this.setLoadRightIndex(_imgAmount);
//             this.images.splice(_last, 1);
//             this.updateTotalLoaded();

//             return;
//         } else {
//             _stillsPage.hasAllData = true;
//             return;
//         }
//     }
// }

// Carousel.prototype.setLoadRightIndex = function (_n) {
//     if (this.images[0] !== undefined) {
//         this.indexLoadRight -= _n - this.loadOffset;
//     } else {
//         this.hasAllData = true;
//     }
// }

// Carousel.prototype.setLoadLeftIndex = function (_n) {
//     if (this.images[0] !== undefined) {
//         this.indexLoadLeft += _n;
//     } else {
//         this.hasAllData = true;
//     }
// }









$('.carousel').on('slid.bs.carousel', function () {
    // tie this event to a custom event so you can turn it off after it's done
    // this might help if you apply it to the carousel event https://learn.jquery.com/events/introduction-to-custom-events/
    // $( document ).trigger( "myCustomEvent", [ "bim", "baz" ] );

    if (pages[7].hasAllData === true) {
        // console.log('not loading any more images');
        return;
    } else {
        const index = $('.carousel .active').index('.carousel .item');
            console.log('index = ' + index);
        if (index + 1 === 9) {
            // console.log('9th image loaded, loading new set');
            appendImagesTo("#diaryCarouselInner", "img/photos/diary/", "diary", ".jpg", 11, 21);
            return;
        } else if (index + 1 === 20) {
            // console.log('20th image loaded, loading new set');
            appendImagesTo("#diaryCarouselInner", "img/photos/diary/", "diary", ".jpg", 22, 32);
            return;
        } else if (index + 1 === 30) {
            // console.log('30th image loaded, loading rest of diary');
            appendImagesTo("#diaryCarouselInner", "img/photos/diary/", "diary", ".jpg", 33, 63);
            pages[7].hasAllData = true;
            return;
        }
    }
});


