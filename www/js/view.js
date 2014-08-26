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

$(document).on("pagebeforeshow","#view",function(){
    var myView = rkView.getView();
    var container = $('#csfilter');
    var csPtr = container.children('li:first').clone();
    container.append(csPtr);
    myView.forEach(function(ev, i, arr) {
        var csDate = csPtr.children('#csdate').html();
        var evDate = new Date(rkView.index[i]).toDateString();
        if(csDate!==evDate) {
            csPtr = csPtr.clone();
            csPtr.children('#csdate').html(evDate);
            csPtr.attr('data-filtertext', evDate);
            container.append(csPtr);
        }
        //create a li of this ev;
        var list = document.createElement('li');
        var img = document.createElement('img');
        //append to the bottom of the ul in container;
    });
});
