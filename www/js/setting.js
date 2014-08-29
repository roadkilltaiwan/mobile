$(document).on("pagecreate", "#setting", function(event) {
    var onLogout = function(result) {
        if(result === "success") {
            document.location.href = '#logon';
        }
    }
    var onFail = function(message) {
        alert('錯誤: ' + message);
    }
    function logoutDrupal() {
        rkAuth.logoutDrupal(onLogout, onFail);
    }
    $('#logout').click(logoutDrupal);
});

