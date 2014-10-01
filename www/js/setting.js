$(document).on("pagecreate", "#setting", function(event) {
    var onLogout = function(result) {
        $.mobile.loading('hide');
        $(document).on("pagehide", "#setting", function(event) {
            $('#logout').prop('disabled', false).removeClass('ui-disabled');
            $(document).off("pagehide", "#setting");
        });
        window.location.replace('#logon');
    };
    var onFail = function(jqXHR, textStatus, errorThrown) {
        console.log('Drupal logout error: ' + textStatus);
        $.mobile.loading('hide');
        $('#logout').prop('disabled', false).removeClass('ui-disabled');
        if(jqXHR.status===406) { // not logged in
            window.location.replace('#logon');
        }else if(jqXHR.status===0) {
            alert('請檢查網路連線');
        }else {
            alert('登出時遇到問題，請稍候再試');
        }
    };
    function logoutDrupal() {
        $.mobile.loading("show", {
            text: "正在登出…",
            textVisible: true,
            theme: "c"
        });
        $('#logout').prop('disabled', true).addClass('ui-disabled');
        rkAuth.logoutDrupal(onLogout, onFail);
    }
    $('#logout').click(logoutDrupal);
});

