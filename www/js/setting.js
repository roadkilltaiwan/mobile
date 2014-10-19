var rkSetting = {};
(function() {

    $(document).on("pagecreate", "#setting", function(event) {
        // model
        var db = localStorage;
        var licenseSelect = $('#select-cc');
        var fbPostIdSelect = $('#select-fbPostId');
        rkSetting = {
            license: db.license || licenseSelect.find("option:selected").val(),
            fbPostId: db.fbPostId || fbPostIdSelect.find("option:selected").val()
        };
        licenseSelect.on('change', function() {
            rkSetting.license = licenseSelect.find("option:selected").val();
            db['license'] = rkSetting.license;
        });
        fbPostIdSelect.on('change', function() {
            rkSetting.fbPostId = fbPostIdSelect.find("option:selected").val();
            db['fbPostId'] = rkSetting.fbPostId;
        });

        // view
        licenseSelect.find('option').filter(function() {
            return $(this).val()===rkSetting.license;
        }).prop('selected', true);
        licenseSelect.selectmenu('refresh');//trigger('create');

        fbPostIdSelect.find('option').filter(function() {
            return $(this).val()===rkSetting.fbPostId;
        }).prop('selected', true);
        fbPostIdSelect.selectmenu('refresh');//trigger('create');
    });

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

})();
