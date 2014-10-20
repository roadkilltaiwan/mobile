var rkSetting = {};
(function() {
    // model
    var db = localStorage;
    rkSetting = {
        license: db.license||'by-sa',
        fbPostId: db.fbPostId||'0'
    };
    $(document).on("pagecreate", "#setting", function(event) {
        var licenseSelect = $('#select-cc');
        var fbPostIdSelect = $('#select-fbPostId');
        licenseSelect.on('change', function() {
            rkSetting.license = $(this).find("option:selected").val();
            db['license'] = rkSetting.license;
        });
        fbPostIdSelect.on('change', function() {
            rkSetting.fbPostId = $(this).find("option:selected").val();
            db['fbPostId'] = rkSetting.fbPostId;
        });
        // view
        licenseSelect.find('option').filter(function() {
            return $(this).val()===rkSetting.license;
        }).prop('selected', true);
        licenseSelect.selectmenu('refresh');

        fbPostIdSelect[0].selectedIndex = rkSetting.fbPostId;
        fbPostIdSelect.selectmenu('refresh');
        // control
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
        var logoutDrupal = function() {
            $.mobile.loading("show", {
                text: "正在登出…",
                textVisible: true,
                theme: "c"
            });
            $('#logout').prop('disabled', true).addClass('ui-disabled');
            rkAuth.logoutDrupal(onLogout, onFail);
        };
        $('#logout').click(logoutDrupal);
    });
})();
