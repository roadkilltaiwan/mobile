"use strict";
var baseURL = "http://roadkill.tw/phone/drupalgap/";
var rkAuth = {
    "db": localStorage,
    "init": function(storage) {
        var ready = false;
        if(storage) this.db = storage;
        this.setSession();
        return this.hasAuth();
    },
    "hasAuth": function() {
        if(!this.isOnline()) return !!this.db.sessName;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', baseURL+'system/connect', false);
        //xhr.setRequestHeader('X-CSRF-Token', this.db.CSRF_token);
        //xhr.setRequestHeader('Cookie', this.db.sessName+'='+this.db.sessId);
        xhr.withCredentials = true;
        xhr.send();
        return JSON.parse(xhr.responseText).user.uid>0;
    },
    "setSession": function(session_name, sessid) {
        if(session_name && sessid) {
            this.db.setItem("sessName", session_name);
            this.db.setItem("sessId", sessid);
        }
        var fbAppId = '255369314650200';
        var redirectURL = 'http://roadkill.tw/phone/oauthcallback.html';
        openFB.init(fbAppId, redirectURL, this.db);
    },
    "removeSession": function() {
        this.db.removeItem('sessName');
        this.db.removeItem('sessId');
        this.db.removeItem('CSRF_token');
        this.db.removeItem('uid');
        openFB.revokePermissions(
            function() {
                alert('FB permossion revoked');
            },
            function(err) {
                alert('error: '+err.error_description);
                openFB.logout();
            }
        );
    },
    "isSessExpired": function() {
        return !this.db.expTime || this.db.expTime<new Date().getTime();
    },
    "loginDrupal": function(name, pwd, done, fail) {
        var dataUse = { username: name, password: pwd };
        var url = baseURL + "user/login";
        $.ajax({
            beforeSend: function (xhr){
                xhr.setRequestHeader(
                    'Content-Type',
                    'application/x-www-form-urlencoded'
                );
            },
            type: "POST",
            dataType: "json",
            url: url,
            data: dataUse,
            success: $.proxy(function(result) {
                this.db.setItem("CSRF_token", result.token);
                this.db.setItem("uid", result.user.uid);
                this.setSession(result.session_name, result.sessid, 21);

                done("success");
            }, this),
            error: function(jqXHR, textStatus, errorThrown){
                alert(JSON.stringify(jqXHR));
                alert(JSON.stringify(textStatus));
                fail(errorThrown);
            }
        });
    },
    "logoutDrupal": function(done, fail) {
        var url = baseURL + "user/logout";
        $.ajax({
            url: url,
            type: 'POST',
            dataType: 'json',
            beforeSend: $.proxy(function (xhr) {
                xhr.setRequestHeader('X-CSRF-Token', this.db.CSRF_token);
            }, this),
            success: $.proxy(function(result) {
                this.removeSession();
                done("success");
            }, this),
            error: function(jqXHR, textStatus, errorThrown){
                alert(JSON.stringify(jqXHR));
                alert(JSON.stringify(textStatus));
                fail(errorThrown);
            }
        });
    },
    "loginFB": function() {
        var permissions = 'user_groups,email';
        openFB.login(permissions,
            function() {
                alert('Facebook login succeeded\n');
            },
            function(error) {
                alert('Facebook login failed: ' + error.error_description);
            }
        );
    },
    "isOnline": function() {
        try {
            var networkState = navigator.connection.type;
            var states = {};
            states[Connection.UNKNOWN] = 'Unknown connection';
            states[Connection.ETHERNET] = 'Ethernet connection';
            states[Connection.WIFI] = 'WiFi connection';
            states[Connection.CELL_2G] = 'Cell 2G connection';
            states[Connection.CELL_3G] = 'Cell 3G connection';
            states[Connection.CELL_4G] = 'Cell 4G connection';
            states[Connection.NONE] = 'No network connection';
            if (states[networkState] == 'No network connection') {
              return false;
            }
            else {
              return true;
            }
            return states[networkState];
        }
        catch (error) { alert('drupalgap_check_connection - ' + error); }
    }
};