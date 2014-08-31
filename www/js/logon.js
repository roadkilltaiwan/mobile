$(document).on("pagecreate", "#logon", function(event) {
    var onLogin = function(result) {
        if(result === "success") {
            try {
                if(!rkAuth.db.fbtoken) {
                    rkAuth.loginFB(function() {
                        document.location.href = '#home';
                        $(document).on("pageshow", "#home", function() {
                            $.mobile.loading('hide');
                            var options = {
                                y: "50"
                            };
                            $('#eduPopup').popup("open", options);
                            $(document).off("pageshow", "#home");
                        });
                    });
                }
            }catch(err) {
                console.log(JSON.stringify(err));
            }
        }
    }
    function loginDrupal(e){
        e.preventDefault();
        if(!rkAuth.isOnline()) {
            onFail('請檢查網路連線');
            return;
        }
        $.mobile.loading("show", {
            text: "正在登入…",
            textVisible: true,
            theme: "c"
        });
        rkAuth.loginDrupal($('#username').val(), $('#password').val(), onLogin, onFail);
    }
    var onFail = function(message) {
        alert('錯誤：' + message);
    }
    $('#login').click(loginDrupal);
});

