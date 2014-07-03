function loginToDrupal(req, callback){
	console.log();
	var dataUse = {"username":"root", "password":"drupalej03xu35k3"};
	var url = "http://roadkill.tw/drupalgap/user/login";
    $.ajax({
		type: "POST",
		url: url,
		data: dataUse,
		success: function(result){
			alert(result);
			callback(result);
		},
		dataType: json
    });
}