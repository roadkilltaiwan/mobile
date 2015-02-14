"use strict";
var rkView = (function() {
    var db = localStorage;
    var index = db.index? JSON.parse(db.index): [];
    var maxEntries = 20;
    var add = function(rec, done) {
        var ts = new Date().getTime();
        var oldURL = rec.photoURL;
        rec.photoURL = getThumbnail(oldURL);
        db.setItem(ts, JSON.stringify(rec));
        rec.photoURL = oldURL;
        if(done) done();
        if(index.length>=maxEntries) {
            removeRec(index.pop());
        }
        index.unshift(ts);
        db.setItem('index', JSON.stringify(index));
    };
    var clear = function() {
        index.forEach(removeRec);
        db.removeItem('index');
        index = [];
    };
    var getView = function(reqLen) {
        if(!reqLen || reqLen>index.length)
            reqLen = index.length;
        return index.slice(0, reqLen).map(function(e) {
            return JSON.parse(db.getItem(e));
        });
    };
    var removeRec = function(key) {
        var obj = JSON.parse(db[key]);
        db.removeItem(key);
        console.log('Rec '+key+' removed.');
    };
    var getThumbnail = function(imgURL) {
        var img = $('#eventRow img[src="'+imgURL+'"]').get(0);
        var ratio = img.width>img.height? 200/img.width: 200/img.height;
        var targetWidth = img.width*ratio;
        var targetHeight = img.height*ratio;
        var canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        var ctx = canvas.getContext('2d');
        ctx.scale(ratio, ratio);
        ctx.drawImage(img, 0, 0, img.width, img.height);
        return canvas.toDataURL();
    };
    return {
        "index": index,
        "add": add,
        "clear": clear,
        "getView": getView
    };
})();

$(document).on("pagebeforeshow", "#view", function() {
    var myView = rkView.getView();
    var container = $('#view #csfilter');
    var csRef = $('<div data-role="collapsible"><h3></h3><ul data-role="listview"></ul></div>');
    var csPtr = csRef;
    myView.forEach(function(ev, i, arr) {
        var csDate = csPtr.children('h3').html();
        var evDate = new Date(rkView.index[i]).toLocaleDateString();
        if(csDate!==evDate) {
            csPtr = csRef.clone().appendTo(container);
            csPtr.attr('data-filtertext', evDate);
            csPtr.children('h3').html(evDate);
        }
        //create a li of this ev;
        var key = ev.address.shortaddress+' '+ev.desc;
        var list = $('<li data-filtertext="'+evDate+' '+key+
                    '"><img class="vcenter" src="'+ev.photoURL+'"></img>'+
                    '<h4>['+ev.address.shortaddress+']</h4><p>'+ev.desc+' - 攝於'+
                    new Date(ev.time).toLocaleDateString()+'</p></li>');
        // The following external browser code is for Android
        //list.click(function() { navigator.app.loadUrl(ev.location, { openExternal:true }); });
        list.click(function() { window.open(ev.location, '_blank', 'location=yes'); });
        //append to the bottom of the ul in container;
        csPtr.children('[data-role="listview"]').append(list);
        csPtr.attr('data-filtertext', csPtr.attr('data-filtertext')+' '+key);
    });
    container.children(':first').attr('data-collapsed', 'false');
    container.trigger('create');
});

$(document).on("pagebeforehide", "#view", function() {
    $('#view #csfilter').empty();
});

$(document).on("pagecreate", "#view", function() {
    $('#view #clearHistory').click(function() {
        rkView.clear();
        $('#view #csfilter').empty();
        $(document).trigger('pagebeforeshow', "#view");
    });
});
