$(document).on("pagecreate", "#logon", function(event) {
    var onLogin = function(result) {
        $(document).on("pageshow", "#home", function(event) {
            $(document).off("pageshow", "#home");
            $('#login').prop('disabled', false).removeClass('ui-disabled');
            $.mobile.loading('hide');
            var options = {
                y: "50"
            };
            window.setTimeout(function() {
                $('#eduPopup').popup("open", options);
            }, 300);
        });
        window.location.replace('#home');
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

