var LOCATION_SERVICE_TIMEOUT = 10000;
var HTTP_REQUEST_TIMEOUT = 10000;
var GOOGLE_MAPS_API_URL = "http://maps.googleapis.com/maps/api/geocode/json?language=zh-TW&sensor=true&latlng=";
var CAMERA_IMAGE = "./assets/img/camera.png";
var DEFAULT_MAP_CENTER = {lat: 23.97565, lng: 120.973882};
var LOCATION_ERROR_MESSAGE = "無法定位";
var LOCATION_SERVICE_INTERRUPTED = "請手動標記位置";
var GETTING_LOCATION_MESSAGE = "定位中...";
var LOCATION_SERVICE_UNAVAILABLE = "手機或瀏覽器不具備定位功能，或定位功能尚未啟用";
var GEOCODING_SERVICE_UNAVAILABLE = "無法取得地址";
var PHOTO_UNAVAILABLE = "請先拍照記錄";
var LOCATION_SERVICE_DENIED = "請允許網站使用定位服務";
var CHINESE_DIGITS = ['一', '二', '三'];
var UPLOAD_DONE = "上傳成功!";
var UPLOAD_FAILED = "無法上傳，請稍後再試";
var UPLOADING = "上傳中..."; 
var PICK_LOCATION = "請點選地點";
var PICK_DATE = "請選拍攝日期"; 
var PROCESSING = "處理中...";
var PARSE_GEOCODING_RESULT_FAILED = "無法解析地址資訊";
var GEOCODING_SERVICE_ERROR = "地址查詢產生錯誤";

/* ui elements */
var btnUpload;
var editPopup;
var imgPopup;
var uiReady = false;

/* views */
var eventRows = [];
var mapView = null;

/* models */
var rkreport = null;

function Lightbox(element) {
    this.element = $(element);
    this.image = this.element.find("#lightboxImg");
}

Lightbox.prototype.setImageSrc = function(src) {
    this.image.attr("src", src);
};

Lightbox.prototype.open = function() {
    this.element.popup("open", {positionTo: "window"});
};

function LocationManager() {
}
LocationManager.PERMISSION_DENIED = 1;
LocationManager.POSITION_UNAVAILABLE = 2;
LocationManager.TIMEOUT = 3;
LocationManager.LOCATION_SERVICE_UNAVAILABLE = 996;
LocationManager.GEOCODING_REQUEST_FAILED = 998;

LocationManager.prototype.getAddress = function(lat, lng, callback) {
    var fullURL = GOOGLE_MAPS_API_URL + lat + "," + lng;
    var request = $.ajax({
        url: fullURL,
        type: "GET",
        timeout: HTTP_REQUEST_TIMEOUT
    });
    
    var requestDone = function(geocodingResponse) {
        if (geocodingResponse.status=="OK" && geocodingResponse.results.length>0) {
            var address = parseGeocodingResult(geocodingResponse);
            if(address!=null) {
                $.proxy(callback.handleAddress, callback)(address);
            }
            else {
                $.proxy(callback.handleLocationError, callback)({code: 995, message: PARSE_GEOCODING_RESULT_FAILED});
            }
        }
        else {
            $.proxy(callback.handleLocationError, callback)({code: 994, message: GEOCODING_SERVICE_ERROR});
        }
    };
    
    var requestFailed = function(xhr, status) {
        var error = {code: 998, message: GEOCODING_SERVICE_UNAVAILABLE};
        $.proxy(callback.handleLocationError, callback)(error);
    };
     
    request.done(requestDone);
    request.fail(requestFailed);
    
};

LocationManager.prototype.getLocation = function(callback) {
    if (navigator.geolocation) {
        if(callback.locationRequestStarted!=null) {
            callback.locationRequestStarted();
        }
        navigator.geolocation.getCurrentPosition(
            $.proxy(callback.handleLocation, callback), 
            $.proxy(callback.handleLocationError, callback), 
            {enableHighAccuracy: true, maximumAge: 0, timeout: LOCATION_SERVICE_TIMEOUT}
        );
    }   
    else {
        var error = {code: 996, message: LOCATION_SERVICE_UNAVAILABLE};
        $.proxy(callback.handleLocationError, callback)(error); 
    }
};

var sharedLocationManager = new LocationManager();
var mapLocationManager = new LocationManager();

function RkEventRow(rowNumber, rowElement, rkevent) {
    this.rowElement = $(rowElement);
    this.event = rkevent;
    this.photoElement = this.rowElement.find(".photo");
    this.photoElement.on("click", $.proxy(this.photoPressed, this));
    this.photoElement.on("load", $.proxy(this.photoLoaded, this));
    this.photoPicker = this.rowElement.find(".photoPicker");
    //this.photoPicker.on("change", $.proxy(this.photoPickerChanged, this));
    this.descElement = this.rowElement.find(".photoDesc");
    this.locationElement = this.rowElement.find(".location");
    this.licenseSelect = $("#select-cc");
    this.fbPostSelect = $("#select-fbPost");
    this.btnEdit = this.rowElement.find(".btnEdit");
    this.btnEdit.on("click", $.proxy(this.btnEditPressed, this));
    this.rowNumber = rowNumber;
    this.image = null;
    this.desc = null;
    this.hasImage = false;
}

/*
RkEventRow.prototype.photoPickerChanged = function(event) {
    var file = event.target.files[0];
    if(file!=null) {
        this.displayPhoto(file, 0);
        this.getLocation(true);
        this.hasImage = true;
    }
};
*/

RkEventRow.prototype.updateLocation = function() {
    mapView.delegate = this;
    mapView.show({location: this.event.location, address: {longaddress: this.event.address, shortaddress: this.event.shortAddress}, time: new Date(this.event.time)});
};

RkEventRow.prototype.handleAddress = function(address) {
    this.event.address = address.longaddress;
    this.event.shortAddress = address.shortaddress;
    this.locationElement.html(address.shortaddress);
    hidePageBusy();
};

RkEventRow.prototype.locationRequestStarted = function() {
    this.locationElement.html(GETTING_LOCATION_MESSAGE);
    showPageBusy(GETTING_LOCATION_MESSAGE);
};

RkEventRow.prototype.handleLocation = function(location) {
    this.event.location = location.coords;
    sharedLocationManager.getAddress(this.event.location.latitude, this.event.location.longitude, this);
};

RkEventRow.prototype.handleLocationError = function(error) {
    this.locationElement.html(LOCATION_ERROR_MESSAGE);
    hidePageBusy();
    if(error.code==LocationManager.PERMISSION_DENIED) {
        alert(LOCATION_SERVICE_DENIED);
    }
};

RkEventRow.prototype.deletePhoto = function() {
    this.photoElement.attr("src", CAMERA_IMAGE);
    this.photoElement.removeProp("exifdata");
    this.photoElement.css({
        "-webkit-transform": "",
        "transform:rotate": ""
    });
    //this.photoPicker.val("");
    //this.photoPicker.on("change", $.proxy(this.photoPickerChanged, this));
};

RkEventRow.prototype.clear = function() {
    if(this.hasImage) {
        this.deletePhoto();
    }
    this.locationElement.html("");
    this.descElement.val("");
    this.hasImage = false;
};

RkEventRow.prototype.retakePhoto = function() {
    editPopup.on("popupafterclose", $.proxy(function(event, ui) {
        editPopup.off("popupafterclose");
        this.takePicture();
    }, this));
    editPopup.popup("close");
    this.clear();
};

RkEventRow.prototype.displayPhoto = function(imgURI/*file*/, rotation) {
    //var baseurl = window.URL ? window.URL : window.webkitURL;
    var imgSrc = imgURI;//baseurl.createObjectURL(file);
    this.photoElement.attr("src", imgSrc);
    
    var transform = "rotate(" + rotation + "deg)";
    this.photoElement.css({
        "-webkit-transform": transform,
        "transform:rotate": transform,
    });
    //hidePageBusy();
};

/*
RkEventRow.prototype.photoLoaded = function(event) {
    if(!this.hasImage) return;
    var img = this.photoElement[0];
    EXIF.getData(img, function() {
        var lat = EXIF.getTag(img, "GPSLatitude");
        //alert(EXIF.pretty(img));
    });
};
*/

/*
RkEventRow.prototype.photoPickerChanged = function(event) {
    if(event.target.files.length==0) {
        return;
    }
    
    showPageBusy("處理中...");
    var photoRow = this;
    var originalPhotoElement = this.photoElement;
    var file = event.target.files[0];
    this.hasImage = true;
    this.event.time = new Date().getTime();
    this.event.photoFile = file;
    photoRow.displayPhoto(file, 0);
    sharedLocationManager.getLocation();
};
*/


//RkEventRow.prototype.photoPickerChanged = function(/*event*/imgData) {
RkEventRow.prototype.photoLoaded = function() {
    if(!this.hasImage) {
        return;
    }
    var img = this.photoElement.get(0);
    this.event.photoFile = img;
    this.event.time = new Date().getTime();
    EXIF.getData(img, $.proxy(function() {
        var foundLocationInPhoto = false;
        if (img.exifdata) {
            var exifData = null;
            try {
                console.log(img.exifdata);
                exifData = parseExif(img.exifdata);
            }
            catch(err) {
                alert("unable to parse exif location");
            }
            if(exifData!=null) {
                if(exifData.time!=null) {
                    this.event.time = exifData.time.getTime();
                }
                if(exifData.location!=null) {
                    this.event.location = exifData.location;
                    foundLocationInPhoto = true;
                    sharedLocationManager.getAddress(exifData.location.latitude, exifData.location.longitude, this);
                }
            }
        }
       
        if(!foundLocationInPhoto) {
            sharedLocationManager.getLocation(this);
        }
        //hidePageBusy();
    }, this));
};


RkEventRow.prototype.mapViewConfirmed = function(options) {
    this.event.location = options.location.coords;
    this.event.address = options.location.address.longaddress;
    this.event.shortAddress = options.location.address.shortaddress;
    this.event.time = options.time.getTime();
    this.locationElement.html(options.location.address.shortaddress);
};

RkEventRow.prototype.mapViewCancelled = function() {
    
};

RkEventRow.prototype.btnEditPressed = function(event) {
    event.preventDefault();
    if(this.hasImage) {
        editPopup.find("#btnRetakePhoto").off("click").on("click", $.proxy(this.retakePhoto, this)); 
        editPopup.find("#btnUpdateLocation").off("click").on("click", $.proxy(this.updateLocation, this));
        editPopup.popup("open");
    }
    else {
        alert(PHOTO_UNAVAILABLE);
    }
};

RkEventRow.prototype.takePicture = function() {
    imgPopup.find('a').off("click").on("click", $.proxy(function(e) {
        imgPopup.popup("close");
        var option = {
            destinationType: navigator.camera.DestinationType.FILE_URI,
            sourceType: navigator.camera.PictureSourceType[e.target.id],
            saveToPhotoAlbum: true,
            correctOrientation: true
        };
        navigator.camera.getPicture(
            $.proxy(function(imgURI) {
                this.displayPhoto(imgURI);
                this.hasImage = true;
            }, this),
            function(msg) {
                alert("Camera Failed: "+msg);
            },
            option
        );
        //showPageBusy(PROCESSING);
    }, this));
    imgPopup.popup("open");
};

RkEventRow.prototype.showPhotoLightbox = function() {
    var image = $(this).attr("src");
    $("#lightboxImg").attr("src", image);   
    $("#lightbox").popup("open", {positionTo: "window"});
};

RkEventRow.prototype.photoPressed = function(event) {
    if(!this.hasImage) {
        this.takePicture();
    }
};

function RkEvent() {
    this.photoFile = null;
    this.time = null;
    this.location = null;
    this.desc = null;   
    this.address = null;
    this.shortAddress = null;
    this.license = null;
    this.fbPost = null;
}

RkEvent.prototype.clear = function() {
    this.photoFile = null;
    this.time = null;
    this.location = null;
    this.desc = null;   
    this.address = null;
    this.shortAddress = null;
    this.license = null;
    this.fbPost = null;
};

function RkReport() {
    this.events = [];
}

RkReport.prototype.createEvent = function(address) {
    var newEvent = new RkEvent();
    this.events.push(newEvent);
    return newEvent;
};

RkReport.prototype.validEvents = function() {
    var list = [];
    for(var i=0; i<this.events.length; i++) {
        if(this.events[i].photoFile!=null) {
            list.push(this.events[i]);
        }
    }
    return list;
};

RkReport.prototype.validEventCount = function() {
    var count = 0;
    for(var i=0; i<this.events.length; i++) {
        if(this.events[i].photoFile!=null) {
            count++;
        }
    }
    return count;
};

function MapView(mapCanvas) {
    this.delegate = null;
    this.location = null;
    this.address = null;
    this.time = null;
    this.locationLabel = $("#selectedMapLocation");
    this.dateLabel = $("#selectedDate");
    this.btnConfirmLocation = $("#btnConfirmLocation");
    this.btnConfirmLocation.on("click", $.proxy(this.btnConfirmLocationPressed, this));
    this.btnCancelMapView = $("#btnCancelMapView");
    this.btnCancelMapView.on("click", $.proxy(this.btnCancelMapViewPressed, this));
    this.btnPickDateTime = $("#btnPickDateTime");
    this.btnPickDateTime.on("click", $.proxy(this.btnPickDateTimePressed, this));
    this.datePicker = $("#datePicker");
    this.datePicker.bind("datebox", $.proxy(this.datePickerChanged, this));
    this.marker = null;
}

MapView.prototype.init = function(mapCanvas) {
    this.canvas = mapCanvas;
    var center = null;
    if(this.location!=null) {
        center = new google.maps.LatLng(this.location.latitude, this.location.longitude);
    }
    else {
        center = new google.maps.LatLng(DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng);
    }
    
    if(this.address!=null) {
        this.locationLabel.html(this.address.shortaddress);
    }
    
    if(this.time!=null) {
        this.dateLabel.html(this.time.toLocaleDateString());
    }
    
    var mapOptions = {
        center: center,
        zoom: 10,
        panControl: false,
        zoomControl: false,
        streetViewControl: false,
        draggableCursor:'crosshair'
    };
    this.map = new google.maps.Map(this.canvas, mapOptions);
    google.maps.event.addListener(this.map, 'click', $.proxy(this.mapClicked, this));
    
    if(this.location!=null) {
        this.placeMarker(center);
    }
};

MapView.prototype.placeMarker = function(latlng) {
    if(this.marker==null) {
        this.marker = new google.maps.Marker({
            position: latlng
        }); 
    }
    else {
        this.marker.setPosition(latlng);
    }
    this.marker.setMap(null);
    this.marker.setMap(this.map);
    this.map.panTo(latlng);
};

MapView.prototype.mapClicked = function(event) {
    var latlng = event.latLng;
    this.placeMarker(latlng);
    this.address = null;
    mapLocationManager.getAddress(latlng.lat(), latlng.lng(), this);
};

MapView.prototype.resize = function(width, height) {
    $(this.canvas).css({
        height: height
    });
};

MapView.prototype.getSelectedLocation = function() {
    var latlng = this.marker.getPosition();
    var coords = {
        latitude: latlng.lat(),
        longitude: latlng.lng(),
        altitude: null
    };
    return {coords: coords, address: this.address};
};

MapView.prototype.show = function(options) {
    if(options.location!=null) {
        this.location = options.location;
        this.address = options.address;
        this.time = options.time;
        if(this.map!=null) {
            var center = new google.maps.LatLng(this.location.latitude, this.location.longitude);
            this.map.panTo(center);
        }
    }
    else {
        this.locationLabel.html(GETTING_LOCATION_MESSAGE);
        mapLocationManager.getLocation(this);
    }
    var options = {
        transition: 'slide'
    };
    $.mobile.pageContainer.pagecontainer("change", "#map", options);
};

MapView.prototype.dismiss = function() {
    var options = {
        transition: "slide",
        reverse: true
    };
    $.mobile.pageContainer.pagecontainer("change", "#home", options);
};

MapView.prototype.btnConfirmLocationPressed = function(event, ui) {
    event.preventDefault();
    if(this.marker==null) {
        alert(PICK_LOCATION);
        return;
    }
    if(this.time==null) {
        alert(PICK_DATE);
        return;
    }
    this.dismiss();
    if(this.delegate==null) {
        return;
    }
    var location = this.getSelectedLocation();
    this.delegate.mapViewConfirmed({location: location, time: this.time});
};

MapView.prototype.btnCancelMapViewPressed = function(event, ui) {
    event.preventDefault();
    this.dismiss();
    if(this.delegate.mapViewCancelled==null) {
        return;
    }
    this.delegate.mapViewCancelled();
};

MapView.prototype.btnPickDateTimePressed = function(event, ui) {
    event.preventDefault();
    this.datePicker.datebox("open");
};

MapView.prototype.handleLocation = function(location) {
    var center = new google.maps.LatLng(location.latitude, location.longitude);
    this.map.panTo(center);
};

MapView.prototype.handleAddress = function(address) {
    this.locationLabel.html(address.longaddress);
    this.address = address;
};

MapView.prototype.handleLocationError = function(location) {
    this.locationLabel.html(LOCATION_ERROR_MESSAGE);
};

MapView.prototype.datePickerChanged = function(event, passed) {
    if(passed.method=='set') {
        this.time = new Date(passed.value);
        this.time.setHours(0);
        this.time.setMinutes(0);
        this.time.setSeconds(0);
        this.time.setMilliseconds(0);
        this.dateLabel.html(this.time.toLocaleDateString());
    }
    else if(passed.method=='postrefresh') {
        var calendar = $('.ui-datebox-container');
        var calendarWidth = calendar.outerWidth();
        var calendarHeight = calendar.outerHeight();
        var windowHeight = $(window).height();
        var windowWidth = $(window).width();
        var mapToolbar = $('#mapToolbar');
        var mapToolbarHeight = mapToolbar.height();
        var top = (windowHeight - mapToolbarHeight - calendarHeight) / 2;
        var left = (windowWidth - calendarWidth) / 2;
        calendar.css({
            top: top,
            left: left
        });
    }
};

function showPageBusy(label) {
  $.mobile.loading('show', {
      text: label,
      textVisible: true,
      theme: 'c'
  });
}

function hidePageBusy() {
  $.mobile.loading('hide');
}

function parseExif(exif) {
    exifData = {};
    
    var latRef = exif.GPSLatitudeRef; //exif[0x0001];
    var lngRef = exif.GPSLongitudeRef; //exif[0x0003];
    var latValues = exif.GPSLatitude; //exif[0x0002];
    var lngValues = exif.GPSLongitude; //exif[0x0004];
    if(latRef!=null && lngRef!=null && latValues!=null && lngValues!=null) {
        var altitudeRef = exif.GPSAltitudeRef; //exif[0x0005]==0 ? 1 : -1;
        var altitude = exif.GPSAltitude; //exif[0x0006];
        var latSign = (latRef=="S" ? -1 : 1);
        var latitude = (latValues[0] + latValues[1] / 60.0 + latValues[2] / 3600.0) * latSign;
        var lngSign = (lngRef=="W" ? -1 : 1);
        var longitude = (lngValues[0] + lngValues[1] / 60.0 + lngValues[2] / 3600.0) * lngSign;
        var exifLocation = {latitude: latitude, longitude: longitude, altitude: altitude};
        exifData.location = exifLocation;
    }

    var dateTimeOriginal = exif.DateTimeOriginal; //exif[0x9003];
    if(dateTimeOriginal!=null) {
        var pos = dateTimeOriginal.indexOf(" ");
        var dateString = dateTimeOriginal.substring(0, pos);
        dateString = dateString.replace(/:/g, '/');
        var timeString = dateTimeOriginal.substring(pos + 1);
        var time = new Date(dateString + " " + timeString);
        exifData.time = time;
    }
    
    return exifData;
    
}

function parseGeocodingResult(response) {
    var country, city = null, locality = null, sublocality = null, route;
    var found = false;
    for(var r in response.results) {
        var result = response.results[r];
        for (var ac in result.address_components) {
            var addressComponent = result.address_components[ac];               
            var types = addressComponent.types;
            for(var t in types) {
                var type = types[t];
                if (city==null && type=="administrative_area_level_2") {
                    city = addressComponent.long_name;
                    break;
                }
                else if (locality==null && type=="locality") {
                    locality = addressComponent.long_name;
                    break;
                }
                else if (sublocality==null && type=="sublocality") {
                    sublocality = addressComponent.long_name;
                    break;
                }
                else if (country==null && type=="country") {
                    country = addressComponent.short_name;
                }
                else if (route==null && type=="route") {
                    route = addressComponent.short_name;
                }
            }
        }
    }
    
    found = city!=null && locality!=null;

    var address = null;
    result = null;
    if (found) {
        shortAddress = city + locality;
        longAddress = shortAddress; 
        result = {shortaddress: shortAddress};
        if (sublocality!=null) {
            longAddress = longAddress + sublocality;
        }
        if (route!=null) {
            longAddress = longAddress + route;
        }
        result.longaddress = longAddress;
    }
    return result;
}

function btnGetLocationPressed(event, ui) {
    event.preventDefault();
    getLocation(true);
};


function viewWidth() {
    return $(window).width() - 40;
}

function btnTakePicturePressed(event, ui) {
    photoPicker.trigger('click');
    return false;       
}

function upload(events, done, fail) {
    var ev = events[0];
    var xhr = new XMLHttpRequest();
    var reader = new FileReader();
    xhr.open('GET', ev.photoFile.src, true);
    xhr.responseType = 'blob';
    xhr.onload = function() {
        if (this.status == 200) {
            var myBlob = this.response;
            // myBlob is now the blob that the object URL pointed to.
            reader.onload = function () {
                ev.photoFile = this.result.replace(/data:\S*;base64,/, '');

                $.ajax({
                    url: "http://roadkill.tw/phone/drupalgap/file",
                    type: "POST",
                    dataType: "json",
                    data: {
                        "file": {
                            "file": ev.photoFile,
                            "filename": "image.jpg",
                            "uid": localStorage.getItem("uid")
                        }
                    },
                    beforeSend: function (xhr){
                        xhr.setRequestHeader('X-CSRF-Token', 
                                            rkAuth.db.CSRF_token);
                        xhr.setRequestHeader('Content-type',
                                            'application/x-www-form-urlencoded');
                    },
                    success: function(result) {
                        var sDate = new Date(ev.time);
                        var data = {
                            "type": "image",
                            "status": "1",
                            "promote": "0",
                            "title": '['+ev.shortAddress+'] '+sDate,
                            "body": ev.desc,
                            "field_imagefield": [{"fid": result.fid}],
                            "field_location_img": [{
                                "name": ev.address,
                                "latitude": ev.location.latitude,
                                "longitude": ev.location.longitude
                            }],
                            "field_img_date": [{
                                "value": {
                                    "date": /[\d-]*/.exec(sDate.toISOString())[0],
                                    "time": /\S*/.exec(sDate.toTimeString())[0]
                                }
                            }],
                            "field_data_res": [{"value": "323"}],
                            //"fb token":[{"value": rkAuth.db.fbtoken}],
                            "field_app_post_type": [{"value": ev.fbPost}]//,
                            //"cc": {"type": "!"}
                        };
                        if(ev.license!=="") data["cc"] = {};
                        $.ajax({
                            url: "http://roadkill.tw/phone/drupalgap/node",
                            type: 'POST',
                            dataType: 'json',
                            data: //{"nid":"","title":'['+events[0].shortAddress+'] '+(new Date(events[0].time)),"type":"article","language":"und","body":{"und":[{"value":events[0].desc}]},"field_image":{"und":[{"fid":result.fid}]},"field_placename":{"und":[{"value":events[0].address}]},"field_license_text":{"und":{"value":events[0].license}},"field_source":{"und":{"value":"1"}},"field_geo":{"und":[{"geom":{"lat":events[0].location.latitude,"lon":events[0].location.longitude}}]}},
                            data,
                            beforeSend: function (xhr){
                                xhr.setRequestHeader('X-CSRF-Token', 
                                                    rkAuth.db.CSRF_token);
                            },
                            success: function(result){
                                alert(JSON.stringify(result));
                                done();
                            },
                            error: function(err){
                                fail();
                                alert(JSON.stringify(err));
                            }
                        });

                    },
                    error: function(err){
alert(JSON.stringify(err));
                        fail();
                        console.log(err);
                    }
                });
            };
            reader.readAsDataURL(myBlob);
        }
    };
    xhr.send();
}

function clearReport(report) {
    for(var i=0; i<report.events.length; i++) {
        var eventRow = eventRows[i];
        var event = report.events[i];
        eventRow.clear();
        event.clear();
    }
}

function prepareReport(report) {
    for(var i=0; i<report.events.length; i++) {
        var eventRow = eventRows[i];
        var event = report.events[i];
        if(eventRow.hasImage) {
            //var file = eventRow.photoPicker.prop("files")[0];
            //var file = eventRow.photoElement.attr('src');
            var desc = eventRow.descElement.val();
            event.desc = desc;
            var license = eventRow.licenseSelect.find("option:selected").val();
            event.license = license;
            var fbPost = eventRow.fbPostSelect.find("option:selected").val();
            event.fbPost = fbPost;
        }
    }
    return null;
}

function setBase64FromURL(event, url) {
    var xhr = new XMLHttpRequest();
    var reader = new FileReader();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.onload = function() {
        if (this.status == 200) {
            var myBlob = this.response;
            // myBlob is now the blob that the object URL pointed to.
            reader.onload = function (e) {
                event.photoFile = e.target.result.replace(/data:\S*;base64,/, '');
            };
            reader.readAsDataURL(myBlob);
        }
    };
    xhr.send();
}

function validateEvents(events) {
    for(var i=0; i<events.length; i++) {
        var event = events[i];
        if(event.location==null || event.time==null) {
            return {
                eventid: i,
                message: "請為第" + CHINESE_DIGITS[i] + "筆紀錄標定日期與位置"
            };
        }       
    }
    return null;
}

function btnUploadPressed(event, ui) {
    event.preventDefault();
    
    var validEventCount = rkreport.validEventCount();
    if(validEventCount==0) {
        alert(PHOTO_UNAVAILABLE);
        return;
    }
    
    var done = function(resp) {
        clearReport(rkreport);
        hidePageBusy();
        alert(UPLOAD_DONE);
    };
    var fail = function(xhr, status) {
        hidePageBusy();
        alert(UPLOAD_FAILED);
    };
    
    prepareReport(rkreport);
    var events = rkreport.validEvents();
    var error = validateEvents(events);
    if(error!=null) {
        alert(error.message);
        return;
    } 
    showPageBusy(UPLOADING);
    upload(events, done, fail); 
}

function numberToString(number) {
    var s = "" + number;
    if (s.length < 2) {
        s = "0" + s;
    }
    return s;
}

function currentTimestampString() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var date = now.getDate();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var timestampString = now.getFullYear() + "/" + numberToString(month) + "/" + numberToString(date) + " " + numberToString(hour) + ":" + numberToString(minute);
    return timestampString; 
}

function initUI() {
    if(uiReady) {
        return;
    }
    btnUpload = $("#btnUpload");
    btnUpload.on("click", btnUploadPressed);
    photoPicker = $('#photoPicker');
    editPopup = $("#editPopup");    
    //editPopup.popup( "option", "transition", "pop" );
    imgPopup = $("#imgPopup");    
    //imgPopup.popup( "option", "transition", "pop" );
    $('#bottomContainer').bottom();
    var elements = $("[id=eventRow]");
    for(var row=0; row<elements.length; row++) {
        var element = elements[row];
        var rkevent = rkreport.createEvent();
        var newRow = new RkEventRow(row, element, rkevent);
        eventRows.push(newRow);
    }
    
    mapView = new MapView();
    uiReady = true;
}
 
function initModels() {
    if(rkreport!=null) {
        return;
    }
    // [TODO] Load previous progress here
    rkreport = new RkReport();
}

function initGmap(event, ui) {
    if(mapView.map!=null) {
        return;
    }
    var mapCanvas = $("#gmapCanvas")[0];
    var windowHeight = $(window).height();
    var toolbarHeight = $('#mapToolbar').height();
    var mapHeight = windowHeight - toolbarHeight;
    $(mapCanvas).css({
        height: mapHeight + "px"
    });
    mapView.init(mapCanvas);
}

function init(event, ui) {
    console.log("init()");
    initModels();
    initUI();
}

$(document).on("pagecreate", "#home", init);
$(document).on("pagecreate", "#map", initGmap);

