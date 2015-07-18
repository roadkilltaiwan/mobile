$(document).on("pagecreate", "#logon", function(event) {
    var btnFBSiginin = $('#fbSignin');
    var toggleLogin = $('#toggleLogin');
    var onFail = function(err, status) {
        $('#logon').find('a').prop('disabled', false).removeClass('ui-disabled');
        console.log('Error Status: ' + status)
        console.log(err);
    };
    var onLogin = function(response) {
        window.location.replace('#home');
        $('#logon').find('a').prop('disabled', false).removeClass('ui-disabled');
    };
	var fbLoginSuccess = function (userData) {
        rkAuth.checkAuth(
            onLogin,
            function() {
                rkAuth.loginDrupalFBOAuth(
                    onLogin,
                    function(err) {
                        onFail(err, 'FBOAuth failed');
                    }
                );
            },
            true
        );
    };
    var signinFacebook = function(e) {
        // lock ui
        $('#logon').find('a').prop('disabled', true).addClass('ui-disabled');
        rkAuth.loginFB(
            fbLoginSuccess,
            function (error) { onFail(error, 'Failed to get FB access token'); }
        );
    };
    btnFBSiginin.click(signinFacebook);
    toggleLogin.click(function(e) {
        $.mobile.changePage("#logonDrupal", {transition: 'none'});
        $('#logonDrupal input#username').focus();
    });
});
$(document).on("pagecreate", "#logonDrupal", function(event) {
    var btnLogin = $('#login');
    var lnkRegister = $('#register');
	var lnkForget = $('#forget');
    var onLogin = function(result) {
        $.mobile.loading('hide');
        window.location.replace('#home');
        btnLogin.prop('disabled', false).removeClass('ui-disabled');
    };
    function loginDrupal(e) {
        e.preventDefault();
        var id = $('#username').val();
        var pass = $('#password').val();
        if(!id || !pass) {
            alert('請輸入帳號密碼');
        }else {
            $.mobile.loading("show", {
                text: "正在登入…",
                textVisible: true,
                theme: "c"
            });
            btnLogin.prop('disabled', true).addClass('ui-disabled');
            rkAuth.checkAuth(
                onLogin,
                function() {
                    rkAuth.loginDrupal(id, pass, onLogin, onFail);
                },
                true
            );
        }
    }
    var onFail = function(jqXHR, textStatus, errorThrown) {
        var code = jqXHR.status;
        if(code===0) {
            alert('請檢查網路連線');
        }else if(code===401) {
            alert('帳號或密碼錯誤');
        }else {
            alert('無法登入，請稍候再試');
        }
        console.log('Drupal login error '+code+': '+errorThrown);
        $.mobile.loading('hide');
        btnLogin.prop('disabled', false).removeClass('ui-disabled');
    };
    btnLogin.click(loginDrupal);
	lnkRegister.click(function() {
		window.open(host+'/user/register', '_blank', 'location=yes');
	});
	lnkForget.click(function() {
		window.open(host+'/user/password', '_blank', 'location=yes');
	});
    $('#password').keydown(function(event) {
        if(event.which == 13) {
            event.preventDefault();
            btnLogin.click();
        }
    });
    $('#logon div h1 a').click(function(e) {
        e.preventDefault();
        e.target.blur();
        navigator.app.loadUrl(e.target.href, { openExternal:true });
    });
});

