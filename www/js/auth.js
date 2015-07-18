"use strict";
var host = 'http://go.roadkill.tw';
var baseURL = host+"/drupalgap/";
var rkAuth = {
    "db": localStorage,
    "checkAuth": function(done, fail, forceUpdate) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', baseURL+'system/connect');
        xhr.withCredentials = true;
        xhr.timeout = 10000;
        xhr.setRequestHeader('X-CSRF-Token', this.db.CSRF_token);
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
    "loginDrupalFBOAuth": function(done, fail) {
        $.ajax(baseURL+'fboauth/connect.json', {
            'method': 'POST',
            'data': { 'access_token': this.db.fbtoken },
            'success': function(response) {
                console.log('FBOAuth Success!!');
                rkAuth.setSession(response);
                done();
            },
            'error': function(err) {
                console.log('FBOAuth failed');
                fail(err);
            }
        });
    },
    "loginFB": function(done, fail) {
        var that = this;
        facebookConnectPlugin.login(
            ['email'],
            function(response) {
                if(response.status=="connected" && response.authResponse) {
                    // check if token permission has email?
                    //yes->proceed to Drupal fboauth
                    //no->fail
                    facebookConnectPlugin.api(
                        "/me/permissions",
                        [],
                        function(result) {
                            if(result.data.some(function(e) {
                                return e.status==="granted" &&
                                    e.permission==="email";
                                })) {
                                that.db.setItem("fbtoken", response.authResponse.accessToken);
                                that.db.setItem("fbuid", response.authResponse.userID);
                                console.log('Facebook login success');
                                if(done) done(response);
                            }else {
                                console.log('Permissions not granted');
                                if(fail) fail(result);
                            }
                        },
                        function(err) {
                            console.log('Error checking granted permissions');
                            if(fail) fail(err);
                        }
                    );
                }else {
                    console.log('Facebook disconnected');
                    if(fail) fail(response);
                }
            },
            function(error) {
                console.log('Facebook login failed: '+error);
                if(fail) fail('無法登入臉書:(');
            }
        );
    }
};
