$(document).on("pagecreate", "#userInit", function(event) {
    var btnFbLogin = $('#fbLogin');
    var btnUtilLogin = $('#utilLogin');
    var onLogin = function(result) {
        console.log(result);
        if(result && result.status === 'connected') {
            rkSetting.setFbPostId('0');
        }else {
            rkSetting.setFbPostId('1');
        }
        $(document).on("pageshow", "#home", function(event) {
            $(document).off("pageshow", "#home");
            btnFbLogin.prop('disabled', false).removeClass('ui-disabled');
            btnUtilLogin.prop('disabled', false).removeClass('ui-disabled');
            var options = {
                y: "50"
            };
            window.setTimeout(function() {
                $('#eduPopup').popup("open", options);
            }, 1000);
        });
        window.location.replace('#home');
    };
    var loginFB = function(e) {
        e.preventDefault();
        btnFbLogin.prop('disabled', true).addClass('ui-disabled');
        btnUtilLogin.prop('disabled', true).addClass('ui-disabled');
        rkAuth.loginFB(onLogin, onLogin);
    };
    btnFbLogin.click(loginFB);
    btnUtilLogin.click(function(e) {
        rkSetting.setFbPostId('1');
        onLogin();
    });
});
