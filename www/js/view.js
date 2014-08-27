"use strict";
var rkView = (function() {
    var db = localStorage;
    var index = db.index? JSON.parse(db.index): [];
    var maxEntries = 20;
    var add = function(rec) {
        try {
        var ts = new Date().getTime();
        // [TODO] gen photo thumbnail, update rec
        db.setItem(ts, JSON.stringify(rec));
        if(index.length>=maxEntries) {
            // [TODO] remove the oldest photo thumbnail
            db.removeItem(index.pop());
        }
        index.unshift(ts);
        db.setItem('index', JSON.stringify(index));
        }catch(err) {alert(err); }
    };
    var clear = function() {
        index.forEach(function(e, i, arr) {
            //delete photo thumbnails
            db.removeItem(e);
        });
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
    return {
        "index": index,
        "add": add,
        "clear": clear,
        "getView": getView
    };
})();

$(document).on("pagebeforeshow", "#view", function(){
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
        var key = ev.shortAddress+' '+ev.desc;
        var list = $('<li data-filtertext="'+evDate+' '+key+
                    '"><img src="'+ev.photoURL+'"></img>'+
                    '<h4>['+ev.shortAddress+']</h4><p>'+ev.desc+' - 攝於'+
                    new Date(ev.time).toLocaleDateString()+'</p></li>');
        //append to the bottom of the ul in container;
        csPtr.children('[data-role="listview"]').append(list);
        csPtr.attr('data-filtertext', csPtr.attr('data-filtertext')+' '+key);
    });
    /*container.find('div ul').each(function() {
        $(this).listview();
    });*/
    //container.collapsibleset("refresh");
    container.children(':first').attr('data-collapsed', 'false');
    container.trigger('create');
});

$(document).on("pagebeforehide", "#view", function(){
    $('#view #csfilter').empty();
});
