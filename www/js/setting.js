$(document).on("pagecreate", "#setting", function(event) {
    var onLogout = function(result) {
        $.mobile.loading('hide');
        $(document).on("pagehide", "#setting", function(event) {
            $('#logout').prop('disabled', false).removeClass('ui-disabled');
            $(document).off("pagehide", "#setting");
        });
        window.location.replace('#logon');
    };
    var onFail = function(message) {
        alert('錯誤: ' + message);
        $.mobile.loading('hide');
        $('#logout').prop('disabled', false).removeClass('ui-disabled');
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

