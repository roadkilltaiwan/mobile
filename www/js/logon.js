$(document).on("pagecreate", "#logon", function(event) {
    var onLogin = function(result) {
        $(document).on("pagebeforeshow", "#home", function(event) {
            $(document).off("pagebeforeshow", "#home");
            $('#login').prop('disabled', false).removeClass('ui-disabled');
            try {
                if(!rkAuth.db.fbtoken) {
                    rkAuth.loginFB(function() {
                        $.mobile.loading('hide');
                        var options = {
                            y: "50"
                        };
                        window.setTimeout(function() {
                            $('#eduPopup').popup("open", options);
                        }, 300);
                    });
                }
            }catch(err) {
                console.log(JSON.stringify(err));
            }
        });
        document.location.href = '#home';
    };
    function loginDrupal(e){
        e.preventDefault();
        $.mobile.loading("show", {
            text: "正在登入…",
            textVisible: true,
            theme: "c"
        });
        $('#login').prop('disabled', true).addClass('ui-disabled');
        if(!rkAuth.isOnline()) {
            onFail('請檢查網路連線');
            return;
        }
        rkAuth.loginDrupal($('#username').val(), $('#password').val(), onLogin, onFail);
    }
    var onFail = function(message) {
        alert('錯誤：' + message);
        $.mobile.loading('hide');
        $('#login').prop('disabled', false).removeClass('ui-disabled');
    };
    $('#login').click(loginDrupal);
});

