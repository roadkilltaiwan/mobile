$(document).on("pagecreate", "#logon", function(event) {
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
            rkAuth.loginDrupal(id, pass, onLogin, onFail);
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
		window.open('http://roadkill.tw/user/register', '_blank', 'location=yes');
	});
	lnkForget.click(function() {
		window.open('http://roadkill.tw/user/password', '_blank', 'location=yes');
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

