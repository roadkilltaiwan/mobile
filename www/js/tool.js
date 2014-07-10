
function loginToDrupal(req, callback){
    console.log(req);
    if(localStorage.getItem("sessName")){
        console.log(localStorage.getItem("sessName"));
        callback("success");
        return;
    }


    // var dataUse = {username:'root', password:'drupalej03xu35k3'};
    //var dataUse = {username:'man27382210', password:'larry432'};
    var dataUse = {username:'man27382210', password:'test'};
    var url = "http://roadkill.tw/testbed/drupalgap/user/login";
    $.ajax({
        beforeSend: function (xhr){
                // xhr.setRequestHeader("Authorization", authenticationRequestHeader);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            },
        type: "POST",
        dataType: "json",
        url: url,
        data: dataUse,
        success: function(result){
            localStorage.setItem("sessName", result.session_name);
            localStorage.setItem("sessId", result.sessid);
            localStorage.setItem("token", result.token);
            $.cookie(result.session_name, result.sessid);

            console.log(localStorage.getItem("sessName"));
            console.log(localStorage.getItem("sessId"));
            console.log(localStorage.getItem("token"));
            callback("success");
        },
        error: function(err){
            console.log(err);
        }
    });
}

function logoutToDrupal(callback){
    $.ajax({
        url:"http://roadkill.tw/testbed/drupalgap/user/logout",
        type: 'POST',
        dataType: 'json',
        beforeSend: function (xhr){
            xhr.setRequestHeader('X-CSRF-Token',
                                localStorage.getItem("token"));
        },
        success: function(result){
            localStorage.removeItem("sessName");
            localStorage.removeItem("sessId");
            localStorage.removeItem("token");
            callback("success");
        },
        error:function(err){
            console.log(err);
        }
    });
}

function postToDrupal(callback) {
    if(localStorage.getItem("sessName")) {
        $.ajax({
            url: "http://roadkill.tw/testbed/drupalgap/node",
            type: 'POST',
            dataType: 'json',
            data: {"nid":"","title":"test","type":"article","language":"und","body":{"und":[{"value":"AJAX auto post!"}]},"field_image":{"und":[{"value":""}]},"field_placename":{"und":[{"value":""}]},"field_taxon_name":{"und":[{"value":""}]},"field_license_text":{"und":{"value":"1"}},"field_geo":{"und":[{"geom":{"lat":"43.465187","lon":"-80.522372"}}]}},
            beforeSend: function (xhr){
                xhr.setRequestHeader('X-CSRF-Token',
                                    localStorage.getItem("token"));
            },
            success: function(result){
                callback("success");
            },
            error: function(err){
                console.log(err);
            }
        });
    } else {
        callback("Please log in first.");
    }
}
