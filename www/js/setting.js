var rkSetting = {};
(function() {
    // model
    $(document).ready(function() {
        rkSetting.db = localStorage;
        rkSetting.licenseSelect = $('#select-cc');
        rkSetting.fbPostIdSelect = $('#select-fbPostId');
        rkSetting.license = rkSetting.db.license||$('#select-cc').find('option:selected').val();
        rkSetting.fbPostId = rkSetting.db.fbPostId||$('#select-fbPostId').find('option:selected').val();
        rkSetting.setLicense = function(param) {
            if(param) this.license = param;
            this.licenseSelect.find('option').filter(function() {
                return $(this).val()===rkSetting.license;
            }).prop('selected', true);
            if(this.init) this.licenseSelect.selectmenu('refresh');
            this.db['license'] = this.license;
        };
        rkSetting.setFbPostId = function(param) {
            if(param) this.fbPostId = param;
            this.fbPostIdSelect[0].selectedIndex = this.fbPostId;
            if(this.initialized) this.fbPostIdSelect.selectmenu('refresh');
            this.db['fbPostId'] = this.fbPostId;
        };
    });
    $(document).on("pagecreate", "#setting", function(event) {
        rkSetting.initialized = true;
        rkSetting.licenseSelect.on('change', function() {
            rkSetting.license = $(this).find("option:selected").val();
            rkSetting.db['license'] = rkSetting.license;
        });
        rkSetting.fbPostIdSelect.on('change', function() {
            rkSetting.fbPostId = $(this).find("option:selected").val();
            rkSetting.db['fbPostId'] = rkSetting.fbPostId;
        });
        // view
        rkSetting.setLicense();
        rkSetting.setFbPostId();
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

