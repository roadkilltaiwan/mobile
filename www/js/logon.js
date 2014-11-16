$(document).on("pagecreate", "#logon", function(event) {
    var btnLogin = $('#login');
    var onLogin = function(result) {
        $(document).on("pageshow", "#home", function(event) {
            $(document).off("pageshow", "#home");
            btnLogin.prop('disabled', false).removeClass('ui-disabled');
            var options = {
                y: "50"
            };
            window.setTimeout(function() {
                $('#eduPopup').popup("open", options);
            }, 1000);
        });
        $.mobile.loading('hide');
        window.location.replace('#home');
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
    $('#logon div h1 a').click(function(e) {
        e.preventDefault();
        e.target.blur();
        navigator.app.loadUrl(e.target.href, { openExternal:true });
    });
});

