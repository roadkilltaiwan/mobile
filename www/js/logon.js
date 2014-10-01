$(document).on("pagecreate", "#logon", function(event) {
    var onLogin = function(result) {
        $(document).on("pageshow", "#home", function(event) {
            $(document).off("pageshow", "#home");
            $('#login').prop('disabled', false).removeClass('ui-disabled');
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
    function loginDrupal(e){
        e.preventDefault();
        $.mobile.loading("show", {
            text: "正在登入…",
            textVisible: true,
            theme: "c"
        });
        $('#login').prop('disabled', true).addClass('ui-disabled');
        rkAuth.loginDrupal($('#username').val(), $('#password').val(), onLogin, onFail);
    }
    var onFail = function(jqXHR, textStatus, errorThrown) {
        if(jqXHR.status===0) {
            alert('請檢查網路連線');
        }else {
            alert('無法登入，請稍候再試');
        }
        console.log('Drupal login error: '+textStatus);
        $.mobile.loading('hide');
        $('#login').prop('disabled', false).removeClass('ui-disabled');
    };
    $('#login').click(loginDrupal);
});

