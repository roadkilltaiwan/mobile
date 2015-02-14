$(document).on("pagecreate", "#userInit", function(event) {
    var btnFbLogin = $('#fbLogin');
    var btnUtilLogin = $('#utilLogin');
    var onLogin = function(result) {
        console.log(result);
        rkSetting.setFbPostId((result && result.status==='connected')? '0': '1');
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
    var onFail = function(err) {
        alert(err);
        btnFbLogin.prop('disabled', false).removeClass('ui-disabled');
        btnUtilLogin.prop('disabled', false).removeClass('ui-disabled');
    };
    var loginFB = function(e) {
        e.preventDefault();
        btnFbLogin.prop('disabled', true).addClass('ui-disabled');
        btnUtilLogin.prop('disabled', true).addClass('ui-disabled');
        rkAuth.loginFB(onLogin, onFail);
    };
    btnFbLogin.click(loginFB);
    btnUtilLogin.click(function(e) {
        e.preventDefault();
        onLogin();
    });
});
