$(document).on("pagecreate", "#logon", function(event) {
    var onLogin = function(result) {
        if(result === "success") {
            try {
                if(!rkAuth.db.fbtoken) rkAuth.loginFB();
            }catch(err) {
                console.log(JSON.stringify(err));
            }
            document.location.href = '#home';
        }
    }
    function loginDrupal(e){
        e.preventDefault();
        if(!rkAuth.isOnline()) {
            onFail('請檢查網路連線');
            return;
        }
        rkAuth.loginDrupal($('#username').val(), $('#password').val(), onLogin, onFail);
    }
    var onFail = function(message) {
        alert('錯誤：' + message);
    }
    $('#login').click(loginDrupal);
});

