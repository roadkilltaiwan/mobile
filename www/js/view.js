"use strict";
var rkView = (function() {
    var db = localStorage;
    var index = db.index? JSON.parse(db.index): [];
    var maxEntries = 20;
    var add = function(rec) {
        var ts = new Date().getTime();
        // [TODO] gen photo thumbnail, update rec
        db.setItem(ts, rec);
        if(index.length>=maxEntries) {
            // [TODO] remove the oldest photo thumbnail
            db.removeItem(index.pop());
        }
        index.unshift(ts);
        db.setItem('index', JSON.stringify(index));
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
        if(reqLen>index.length)
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
//[TODO] on page load/visit reload view
