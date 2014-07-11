
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
            localStorage.setItem("uid", result.user.uid);
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
            localStorage.removeItem("uid");
            callback("success");
        },
        error:function(err){
            console.log(err);
        }
    });
}

function postToDrupal(callback) {
    // exception handling to be improved
    if(localStorage.getItem("sessName") === null) {
        callback("Please log in first.");
        return;
    }
    var img = document.getElementById("smallImage");
    if(img.src.search('data')<0) {
        callback("No image.");
        return;
    }

    // upload image first
    $.ajax({
        url: "http://roadkill.tw/testbed/drupalgap/file",
        type: "POST",
        dataType: "json",
        data: {
            "file": {
                "file": img.src.replace("data:image/jpeg;base64,", ""),
                "filename": "image.jpg",
                "uid": localStorage.getItem("uid")
            }
        },
        beforeSend: function (xhr){
            xhr.setRequestHeader('X-CSRF-Token',
                                localStorage.getItem("token"));
            xhr.setRequestHeader('Content-type',
                                'application/x-www-form-urlencoded');
        },
        success: function(result) {
            formToFieldHandler(result, callback);
        },
        error: function(err){
            console.log(err);
        }
    });
}

function formToFieldHandler(result, callback){
    var fid = result.fid;
    // post article
    $.ajax({
        url: "http://roadkill.tw/testbed/drupalgap/node",
        type: 'POST',
        dataType: 'json',
        data: {"nid":"","title":"test","type":"article","language":"und","body":{"und":[{"value":"AJAX auto post!"}]},"field_image":{"und":[{"fid":fid}]},"field_placename":{"und":[{"value":""}]},"field_taxon_name":{"und":[{"value":""}]},"field_license_text":{"und":{"value":"1"}},"field_geo":{"und":[{"geom":{"lat":"43.465187","lon":"-80.522372"}}]}},
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
}
