"use strict";
var baseURL = "http://roadkill.tw/phone/drupalgap/";
var rkAuth = {
    "db": localStorage,
    "init": function(storage) {
        var ready = false;
        if(storage) this.db = storage;
        return this.hasAuth();
    },
    "hasAuth": function(recheck) {
        var xhr = new XMLHttpRequest();
        try {
            xhr.open('POST', baseURL+'system/connect', false);
            xhr.withCredentials = true;
            xhr.send();
            return JSON.parse(xhr.responseText).user.uid>0;
        }catch(err) {
            console.log('Checking session failed: '+err);
            return !recheck && !this.isSessExpired();
        }
    },
    "setSession": function(result) {
        this.db.setItem("CSRF_token", result.token);
        this.db.setItem("uid", result.user.uid);
        this.db.setItem("name", result.user.name);
        this.db.setItem("loginTime", result.user.login);
        this.db.setItem("sessName", result.session_name);
        this.db.setItem("sessId", result.sessid);
    },
    "removeSession": function() {
        this.db.removeItem('sessName');
        this.db.removeItem('sessId');
        this.db.removeItem('CSRF_token');
        this.db.removeItem('uid');
        this.db.removeItem('name');
        this.db.removeItem('loginTime');
    },
    "isSessExpired": function() {
        var duration = 21; // roughly days
        var expTime = (this.db.loginTime+duration*86400)*1000;
        return !this.db.loginTime || expTime<new Date().getTime();
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
                this.setSession(result);
                done();
                this.loginFB(/*done, function(err) {
                    if(err) alert(err);
                    done();
                }*/);
            }, this),
            error: fail 
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
                facebookConnectPlugin.logout(done, done);
            }, this),
            error: fail
        });
    },
    "loginFB": function(done, fail) {
        facebookConnectPlugin.login(
            ['user_groups'],
            function(response) {
                console.log('Facebook login succeeded\n');
                if(done) done(response);
            },
            function(error) {
                console.log('Facebook login failed: '+error);
                if(fail) fail('無法登入臉書:(');
            }
        );
    }
};
