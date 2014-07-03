
function loginToDrupal(req, callback){
    console.log(req);
    var dataUse = {username:'root', password:'drupalej03xu35k3'};
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
            callback(result);
        },
        error: function(err){
            console.log(err);
        }
    });
}