Solstice.Thumbnail = function() {};
Solstice.Thumbnail.Queue = [];
Solstice.Thumbnail.OriginalSrc = null;

/*
 * This function searches the a portion of the document for elements
 * which will be converted to thumbnails, and adds each matching 
 * element's id to the Queue array. If any are found,
 * the conversion process is started by calling Solstice.Thumbnail.fetch()
 */
Solstice.Thumbnail.loadQueue = function(root) {
    if (!root) {
        root = Solstice.getAppFormID();
    }
    var images = YAHOO.util.Dom.getElementsByClassName('sol-file-image-thumbnail', 'img', root);
    for ( var i = 0, img; img = images[i]; i++ ) {
        var src = img.getAttribute('src');
        if (!src.match(/file_thumbnail\.cgi/)) {
            Solstice.Thumbnail.Queue.push(img);
        }
    }
    if (Solstice.Thumbnail.Queue.length) Solstice.Thumbnail.fetch();
};

/**
* @function Solstice.Thumbnail.fetch
* @description Serially loads all thumbnails in the queue  
*/
Solstice.Thumbnail.fetch = function() {
    if (!Solstice.Thumbnail.Queue.length) {
        return; // We're done.
    }
    var img = Solstice.Thumbnail.Queue.shift();
    Solstice.Thumbnail.OriginalSrc = img.getAttribute('src');
    YAHOO.util.Event.addListener(img, 'load', Solstice.Thumbnail.fetch);
    YAHOO.util.Event.addListener(img, 'error', Solstice.Thumbnail.error, img, true);

    var params = Solstice.Thumbnail.OriginalSrc.split('?')[1];
    img.setAttribute('src', Solstice.getDocumentBase() + 'file_thumbnail.cgi?' + params);
};

/**
* @function Solstice.Thumbnail.error
* @description Onerror handler for thumbnail loading
*/
Solstice.Thumbnail.error = function() {
    this.setAttribute('src', Solstice.Thumbnail.OriginalSrc);
    YAHOO.util.Event.removeListener(this, 'error', Solstice.Thumbnail.error);
    Solstice.Thumbnail.fetch();
};
