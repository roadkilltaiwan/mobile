
function loginToDrupal(req, callback){
    console.log(req);
    if(localStorage.getItem("SESS02294f16834559861ab86ca612e7e0a8")){
        console.log(localStorage.getItem("SESS02294f16834559861ab86ca612e7e0a8"));
        callback("success");
        return;
    }


    // var dataUse = {username:'root', password:'drupalej03xu35k3'};
    var dataUse = {username:'man27382210', password:'larry432'};
    var url = "http://roadkill.tw/drupalgap/user/login";
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
            localStorage.setItem("SESS02294f16834559861ab86ca612e7e0a8", result.sessid);
            callback(result);
        },
        error: function(err){
            console.log(err);
        }
    });
}

function logoutToDrupal(callback){
    $.ajax({
        url:"http://roadkill.tw/logout",
        success: function(result){
            callback("success");
        },
        error:function(err){
            console.log(err);
        }
    });
}