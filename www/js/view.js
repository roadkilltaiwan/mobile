"use strict";
var rkView = (function() {
    var db = localStorage;
    var index = db.index? JSON.parse(db.index): [];
    var maxEntries = 20;
    var add = function(rec, done) {
        var ts = new Date().getTime();
        // [TODO] gen photo thumbnail
        function copy(cwd, src, dest) {
            window.resolveLocalFileSystemURL(src, function(fileEntry) {
                cwd.getDirectory(dest, {}, function(dirEntry) {
                    fileEntry.copyTo(dirEntry,
                        'image_'+ts+'.jpg',
                        function(f) {
                            rec.photoURL = f.toURL();
                            db.setItem(ts, JSON.stringify(rec));
                            rec.photoURL = src;
                            if(done) done();
                            if(index.length>=maxEntries) {
                                removeRec(index.pop());
                            }
                            index.unshift(ts);
                            db.setItem('index', JSON.stringify(index));
                        }
                    );
                }, errorHandler);
            }, errorHandler);
        }
        var errorHandler = function(err) {
            alert('儲存紀錄時發生錯誤:(');
            console.log(JSON.stringify(err));
        };
        window.requestFileSystem(window.PERSISTENT, 1024*1024,
            function(fs) {
                copy(fs.root, rec.photoURL, '');
            },
            errorHandler
        );
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
        window.resolveLocalFileSystemURL(obj.photoURL, function(fileEntry) {
            fileEntry.remove(function() {
                console.log('Rec file '+key+' removed.');
            }, function(err) { console.log('Rec file '+key+' removal error: '+err); });
        });
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
        var key = ev.shortAddress+' '+ev.desc;
        var list = $('<li data-filtertext="'+evDate+' '+key+
                    '"><img class="vcenter" src="'+ev.photoURL+'"></img>'+
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
