"use strict";
var host = 'http://roadkill.tw';
var baseURL = host+"/drupalgap/";
var rkAuth = {
    "db": localStorage,
    "checkAuth": function(done, fail, forceUpdate) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', baseURL+'system/connect');
        xhr.withCredentials = true;
        xhr.timeout = 10000;
        xhr.onreadystatechange = function() {
            if(this.readyState===4) {
                try {
                    if(this.status===200) {
                        JSON.parse(this.responseText).user.uid? done(): fail('not login');
                    }else throw this.status+this.statusText;
                }catch(err) {
                    console.log('Checking session failed: '+err);
                    !forceUpdate? done(): fail();
                }
            }
        };
        xhr.send();
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
        if(!this.db.loginTime) {
            return true;
        }else {
            var expTime = (this.db.loginTime+duration*86400)*1000;
            return expTime<new Date().getTime();
        }
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
