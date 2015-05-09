(function() {

var LOCATION_SERVICE_TIMEOUT = 10000;
var LOCATION_TEST_TIMEOUT = 5000;
var HTTP_REQUEST_TIMEOUT = 10000;
var GOOGLE_MAPS_API_URL = "http://maps.googleapis.com/maps/api/geocode/json?language=zh-TW&sensor=true&latlng=";
var CAMERA_IMAGE = "./img/camera.png";
var DEFAULT_MAP_CENTER = {lat: 23.97565, lng: 120.973882};
var LOCATION_ERROR_MESSAGE = "無法定位";
var LOCATION_SERVICE_INTERRUPTED = "請手動標記位置";
var GETTING_LOCATION_MESSAGE = "定位中...";
var LOCATION_SERVICE_UNAVAILABLE = "手機不具備定位功能，或定位功能尚未啟用";
var GEOCODING_SERVICE_UNAVAILABLE = "無法取得地址";
var PHOTO_UNAVAILABLE = "請先拍照記錄";
var LOCATION_SERVICE_DENIED = "請允許使用定位服務";
var LOCATION_SOURCE_ENABLE = '請啟用裝置定位';
var LOCATION_USE_CURRENT = '照片未含定位資訊，是否使用現在位置？';
var CHINESE_DIGITS = ['一', '二', '三'];
var UPLOAD_DONE = "上傳成功!";
var UPLOAD_FAILED = "無法上傳，請稍後再試";
var UPLOAD_ABORT = "上傳已中斷";
var UPLOADING = "上傳中..."; 
var PICK_LOCATION = "請點選地點";
var PICK_DATE = "請選拍攝日期"; 
var PROCESSING = "處理中...";
var PARSE_GEOCODING_RESULT_FAILED = "無法解析地址資訊";
var GEOCODING_SERVICE_ERROR = "地址查詢產生錯誤";
var EMPTY_ADDRESS = "N/A";
var REGAIN_SESSION = "驗證時效已過，請重新登入";
var FB_VERIFYING = "準備中...";
var FB_STATUS_ERROR = '檢查臉書連線時發生錯誤';
var FB_PERMISSION_ERROR = "您尚未完成帳戶授權，想以公用帳戶發布FB社團嗎？";
var APP_VERSION = 'V0.4.6_ANDROID';

/* ui elements */
var btnUpload;
var editPopup;
var imgPopup;
var uploadPopup;
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
LocationManager.GEOCODING_PARSING_FAILED = 995;
LocationManager.LOCATION_SERVICE_UNAVAILABLE = 996;
LocationManager.GEOCODING_SERVICE_ERROR = 997;
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
            $.proxy(callback.handleLocationError, callback)({code: 997, message: GEOCODING_SERVICE_ERROR});
        }
    };
    
    var requestFailed = function(xhr, status) {
        var error = {code: 998, message: GEOCODING_SERVICE_UNAVAILABLE};
        $.proxy(callback.handleLocationError, callback)(error);
    };
     
    request.done(requestDone);
    request.fail(requestFailed);
    
};

LocationManager.prototype.testGPS = function() {
    var that = this;
    navigator.geolocation.getCurrentPosition(
        function() {
            that.hasAccessToGPS = true;
            console.log('GPS test success');
        },
        function() {
            that.hasAccessToGPS = false;
            console.log('GPS test failed');
        },
        {enableHighAccuracy: false, maximumAge: 0, timeout: LOCATION_TEST_TIMEOUT}
    );
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
    this.descElement = this.rowElement.find(".photoDesc");
    this.descElement.on("change", $.proxy(function() {
        this.event.desc = this.descElement.val();
        rkreport.updateStorage();
    }, this));
    this.locationElement = this.rowElement.find(".location");
    this.btnEdit = this.rowElement.find(".btnEdit");
    this.btnEdit.on("click", $.proxy(this.btnEditPressed, this));
    this.rowNumber = rowNumber;
    this.image = null;
    this.desc = null;
    this.hasImage = false;
}

RkEventRow.prototype.updateLocation = function() {
    mapView.delegate = this;
    mapView.show({location: this.event.location, address: this.event.address, time: new Date(this.event.time)});
};

RkEventRow.prototype.handleAddress = function(address) {
    this.event.address = address;
    var d = new Date(this.event.time);
    this.locationElement.html(address.shortAddress+'('+(d.getMonth()+1)+'/'+d.getDate()+')');
    rkreport.updateStorage();
    hidePageBusy();
};

RkEventRow.prototype.locationRequestStarted = function() {
    this.locationElement.html(GETTING_LOCATION_MESSAGE);
    showPageBusy(GETTING_LOCATION_MESSAGE);
};

RkEventRow.prototype.handleLocation = function(location) {
    this.event.location = location.coords;
    rkreport.updateStorage();
    sharedLocationManager.getAddress(this.event.location.latitude, this.event.location.longitude, this);
};

RkEventRow.prototype.handleLocationError = function(error) {
    hidePageBusy();
    switch (error.code) {
        case LocationManager.POSITION_UNAVAILABLE:
            this.locationElement.html(LOCATION_SERVICE_INTERRUPTED);
            break;
        case LocationManager.PERMISSION_DENIED:
        case LocationManager.TIMEOUT:
            this.locationElement.html(LOCATION_ERROR_MESSAGE);
            break;
        case LocationManager.GEOCODING_PARSING_FAILED:
		case LocationManager.GEOCODING_SERVICE_ERROR:
        case LocationManager.GEOCODING_REQUEST_FAILED:
			//this.locationElement.html(this.event.location.latitude.toFixed(6)+', '+this.event.location.longitude.toFixed(6));
			this.handleAddress({
				shortAddress: EMPTY_ADDRESS,
				longAddress: EMPTY_ADDRESS
			});
			return;
    }
    var d = new Date(this.event.time);
    this.locationElement.html(this.locationElement.html()+'('+(d.getMonth()+1)+'/'+d.getDate()+')');
    console.log(error.code+': '+error.message);
};

RkEventRow.prototype.deletePhoto = function() {
    this.photoElement.attr("src", CAMERA_IMAGE);
    this.photoElement.removeProp("exifdata");
    this.photoElement.css({
        "-webkit-transform": "",
        "transform:rotate": ""
    });
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
    this.event.clear();
    rkreport.updateStorage();
};

RkEventRow.prototype.displayPhoto = function(imgSrc, rotation) {
    this.photoElement.attr("src", imgSrc);
    
    var transform = "rotate(" + rotation + "deg)";
    this.photoElement.css({
        "-webkit-transform": transform,
        "transform:rotate": transform,
    });
};

RkEventRow.prototype.photoLoaded = function() {
    if(!this.hasImage || this.event.address!==null) {
        return;
    }
    if(this.location && this.location.latitude && this.location.longitude) {
        sharedLocationManager.getAddress(this.location.latitude, this.location.longitude, this);
        return;
    }

    var img = this.photoElement.get(0);
    this.event.time = new Date().getTime();
    EXIF.getData(img, $.proxy(function() {
        var foundLocationInPhoto = false;
        if (img.exifdata) {
            var exifData = null;
            try {
                exifData = parseExif(img.exifdata);
            }
            catch(err) {
                console.log("unable to parse exif location");
            }
            if(exifData!=null) {
                if(exifData.time!=null) {
                    this.event.time = exifData.time.getTime();
                }
                if(exifData.location!=null) {
                    this.event.location = exifData.location;
                    this.event.location.exifLat = exifData.location.latitude;
                    this.event.location.exifLng = exifData.location.longitude;
                    foundLocationInPhoto = true;
                    sharedLocationManager.getAddress(exifData.location.latitude, exifData.location.longitude, this);
                }
            }
        }
        if(!foundLocationInPhoto) {
            if(window.confirm(LOCATION_USE_CURRENT)) {
                sharedLocationManager.getLocation(this);
            }else {
                this.handleLocationError({
                    code: LocationManager.POSITION_UNAVAILABLE,
                    message: 'No position due to user decline'
                });
            }
        }
    }, this));
};


RkEventRow.prototype.mapViewConfirmed = function(options) {
    this.event.location = options.location.coords;
    this.event.address = options.location.address;
    this.event.time = options.time.getTime();
    var d = new Date(this.event.time);
    this.locationElement.html(this.event.address.shortAddress+'('+(d.getMonth()+1)+'/'+d.getDate()+')');
    rkreport.updateStorage();
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
        var src = navigator.camera.PictureSourceType[e.target.id];
        if(src === navigator.camera.PictureSourceType.CAMERA &&
            !sharedLocationManager.hasAccessToGPS && window.confirm(LOCATION_SOURCE_ENABLE)) {
            window.plugins.webintent.startActivity({
                action: 'android.settings.LOCATION_SOURCE_SETTINGS'},
                function() { console.log('Start location source setting intent.')},
                function() { console.log('Failed to start location source setting intent.'); }
            );
            sharedLocationManager.hasAccessToGPS = true; // no bother as user chose a setting
            return;
        }
        imgPopup.popup("close");
        var option = {
            destinationType: navigator.camera.DestinationType.FILE_URI,
            sourceType: src,
            saveToPhotoAlbum: true,
            correctOrientation: true
        };
        navigator.camera.getPicture(
            $.proxy(function(imgURI) {
                this.hasImage = true;
                var that = this;
                var cachePhoto = function(src) {
                    window.requestFileSystem(window.TEMPORARY, 1024*1024,
                        function(fs) {
                            window.resolveLocalFileSystemURL(src, function(fileEntry) {
                                var d = new Date();
                                fileEntry.copyTo(fs.root,
                                    d.getTime()+'.jpg',
                                    function(f) {
                                        that.displayPhoto(f.toURL());
                                        that.event.photoURL = f.toURL();
                                        rkreport.updateStorage();
                                    },
                                    errorHandler
                                );
                            }, errorHandler);
                        },
                        errorHandler
                    );
                };
                var errorHandler = function(err) {
                    that.hasImage = false;
                    console.log(JSON.stringify(err));
                };
                if(option.sourceType!==navigator.camera.PictureSourceType.CAMERA) {
                    cachePhoto(imgURI);
                }else {
                    var sd = cordova.file.externalRootDirectory;
                    var internal = imgURI.substr(0, imgURI.lastIndexOf('DCIM/'));
                    var cwd = imgURI.substr(0, imgURI.lastIndexOf('/')+1);
                    console.log(sd);
                    console.log(internal);
                    console.log(cwd);
                    window.resolveLocalFileSystemURL(sd||internal||cwd,
                        function(root) {
                            window.resolveLocalFileSystemURL(imgURI, function(fileEntry) {
                                root.getDirectory('DCIM/Roadkill', {create: true}, function(dirEntry) {
                                    var d = new Date();
                                    d.setTime(d.getTime()-d.getTimezoneOffset()*60*1000);
                                    fileEntry.moveTo(dirEntry,
                                        'IMG_'+(/[^\.]*/.exec(d.toISOString())[0].replace(/:/g, '-'))+'.jpg',
                                        function(f) {
                                            cachePhoto(f.toURL());
                                        },
                                        errorHandler
                                    );
                                }, errorHandler);
                            }, errorHandler);
                        },
                        errorHandler
                    );
                }
            }, this),
            function(msg) {
                console.log("Camera Failed: "+msg);
            },
            option
        );
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
    this.photoURL = null;
    this.time = null;
    this.location = null;
    this.desc = null;   
    this.address = null;
    this.license = null;
    this.fbPostId = null;
}

RkEvent.prototype.clear = function() {
    if(this.photoURL!==null && this.photoURL.search('cache')>=0) {
        var url = this.photoURL;
        window.resolveLocalFileSystemURL(url, function(fileEntry) {
            fileEntry.remove(function() {
              console.log('File removed - '+url);
            }, function(err) { console.log('File removal error: '+err); });
        });
    }
    this.photoURL = null;
    this.time = null;
    this.location = null;
    this.desc = null;   
    this.address = null;
    this.license = null;
    this.fbPostId = null;
    rkreport.updateStorage();
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
        if(this.events[i].photoURL!=null) {
            list.push(this.events[i]);
        }
    }
    return list;
};

RkReport.prototype.validEventCount = function() {
    var count = 0;
    for(var i=0; i<this.events.length; i++) {
        if(this.events[i].photoURL!=null) {
            count++;
        }
    }
    return count;
};

RkReport.prototype.updateStorage = function() {
    localStorage.setItem('rkevents', JSON.stringify(this.events));
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
        this.locationLabel.html(this.address.longAddress);
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
    return {
		coords: coords,
		address: this.address? this.address: {shortAddress: EMPTY_ADDRESS, longAddress: EMPTY_ADDRESS}
    };
};

MapView.prototype.show = function(options) {
    if(options.location!=null) {
        this.location = options.location;
        this.address = options.address;
        this.time = options.time;
        this.dateLabel.html(this.time.toLocaleDateString());
        if(this.map!=null) {
            var center = new google.maps.LatLng(this.location.latitude, this.location.longitude);
            this.map.panTo(center);
            this.placeMarker(center);
        }
        if(!this.address) {
            mapLocationManager.getAddress(this.location.latitude, this.location.longitude, this);
        }else {
			this.locationLabel.html(this.address.longAddress);
        }
    }else {
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
        changeHash: false,
        transition: "slide",
        reverse: true
    };
    $.mobile.pageContainer.pagecontainer("change", "#home", options);
    window.history.back();
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
    this.locationLabel.html(address.longAddress);
    this.address = address;
};

MapView.prototype.handleLocationError = function(error) {
	switch (error.code) {
        case LocationManager.GEOCODING_PARSING_FAILED:
		case LocationManager.GEOCODING_SERVICE_ERROR:
        case LocationManager.GEOCODING_REQUEST_FAILED:
			this.handleAddress({
				shortAddress: EMPTY_ADDRESS,
				longAddress: EMPTY_ADDRESS
			});
			break;
		case LocationManager.POSITION_UNAVAILABLE:
        case LocationManager.PERMISSION_DENIED:
        case LocationManager.TIMEOUT:
		default:
            this.locationLabel.html(LOCATION_ERROR_MESSAGE);
    }
    console.log(error.code+': '+error.message);
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
    var exifData = {};
    
    var latRef = exif.GPSLatitudeRef; //exif[0x0001];
    var lngRef = exif.GPSLongitudeRef; //exif[0x0003];
    var latValues = exif.GPSLatitude; //exif[0x0002];
    var lngValues = exif.GPSLongitude; //exif[0x0004];
    if(latRef && lngRef && latValues && lngValues) {
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
    if(dateTimeOriginal) {
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
    var country = null, province = null, locality = null, sublocality = null,
        route = null, poi = null;
    var found = false;
    for(var r in response.results) {
        var result = response.results[r];
        for (var ac in result.address_components) {
            var addressComponent = result.address_components[ac];               
            var types = addressComponent.types;
            for(var t in types) {
                var type = types[t];
                if (province==null && (type=="administrative_area_level_2" ||
                    type=="administrative_area_level_1")) { //e.g. Taipei,Tainan
                    province = addressComponent.long_name;
                    break;
                }
                else if ((locality==null && type=="locality") || type=="administrative_area_level_3") {
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
                else if (poi==null && type=="point_of_interest") {
                    poi = addressComponent.short_name;
                }
            }
        }
    }
    
    found = province!=null && locality!=null;

    var address = null;
    result = null;
    if (found) {
        shortAddress = province + locality;
        longAddress = shortAddress; 
        result = {
            name: '',
            province: province,
            city: locality,
            shortAddress: shortAddress
        };
        if (sublocality!=null) {
            longAddress = longAddress + sublocality;
            result.name += sublocality;
        }
        if (route!=null) {
            longAddress = longAddress + route;
            result.name += route;
        }
        if(poi!=null) {
            longAddress += poi;
            result.name += route;
        }
        result.longAddress = longAddress;
    }
    return result;
}

function viewWidth() {
    return $(window).width() - 40;
}

function upload(events, done, fail) {
    var meter = uploadPopup.find('div.meter>span');
    meter.width('0%');
    var state = uploadPopup.find('h3');
    state.html(UPLOADING);
    var progress = uploadPopup.find('p');
    progress.html('('+1+'/'+events.length+')');
    var btnCancel = uploadPopup.find('a');
    uploadPopup.off("popupafterclose").on("popupafterclose", function() {
        btnUpload.prop('disabled', false).removeClass('ui-disabled');
    });

    var addAbortListener = function (req) {
        if(btnCancel.abort) return false;
        btnCancel.off('click').on('click', function() {
            btnCancel.abort = true;
            req.abort();
        });
        return true;
    };
    uploadPopup.popup("open");
    var uploadEndpoint = host+'/node/add/image';
    $.ajax({
        url: uploadEndpoint,
        type: 'GET',
        dataType: 'xml',
        beforeSend: addAbortListener,
    }).done(function(response) {
        var form = response.getElementById('node-form');
        var ccOpt = form['creativecommons[select_license_form][cc_license_uri]'];
        var provinceSet = Array.prototype.slice.call(form['field_location_img[0][province]'].querySelectorAll('option'));
        var formPoster = function(ev, i) {
            meter.width('0%');
            progress.html('('+i+'/'+events.length+')');

            var fileURL = ev.photoURL;
            var options = new FileUploadOptions();
            options.fileKey = "files[field_imagefield_0]";
            options.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1);
            var suffix = fileURL.substr(fileURL.lastIndexOf('.') + 1);
            options.mimeType = 'image/' + ((suffix=='jpg'||suffix=='JPG')? 'jpeg': suffix);
            options.httpMethod = "POST";
            var sDate = new Date(ev.time);
			if(ev.address==null) {
				ev.address = {shortAddress: EMPTY_ADDRESS, longAddress: EMPTY_ADDRESS};
			}
            options.params = {
                'form_build_id': form['form_build_id'].value,
                'form_token': form['form_token'].value,
                'form_id': form['form_id'].value,
                'title': '['+ev.address.shortAddress+'] '+sDate,
                'field_app_post_type[value]': ev.fbPostId,
                'field_data_res[value]': '323',
                'field_imagefield[0][fid]': '0',
                'field_imagefield[0][list]': '1',
                'body': ev.desc,
                'field_location_img[0][locpick][user_latitude]': ev.location.latitude.toFixed(6),
                'field_location_img[0][locpick][user_longitude]': ev.location.longitude.toFixed(6),
                'field_img_date[0][value][date]': /[\d-]*/.exec(new Date(ev.time-sDate.getTimezoneOffset()*60*1000).toISOString())[0],
                'field_access_token[0][value]': rkAuth.db.fbtoken,
                'creativecommons[select_license_form][cc_license_uri]': ev.license? ccOpt.querySelector('option[value*="'+ev.license+'/"]').value: "",
                'field_author[0][value]': form["field_author[0][value]"]? form["field_author[0][value]"].value: '?',
                'name': rkAuth.db.name,
                'status': '1',
                'promote': '1',
                'field_app_mobile_type[0][value]': APP_VERSION
            };
            if(ev.location.exifLat && ev.location.exifLng) {
                options.params['field_location_img[0][latitude]'] = ev.location.exifLat.toFixed(6);
                options.params['field_location_img[0][longitude]'] = ev.location.exifLng.toFixed(6);
            }
            if(sharedLocationManager.uploadCoords) {
                var coords = sharedLocationManager.uploadCoords;
                options.params['field_app_longitude[0][value]'] = coords.longitude.toFixed(6);
                options.params['field_app_latitude[0][value]'] = coords.latitude.toFixed(6);
            }
            var j = -1;
            if(provinceSet.some(function(e){ j++; return e.innerHTML===ev.address.province; })) {
                options.params['field_location_img[0][province]'] = provinceSet[j].value;
                options.params['field_location_img[0][city]'] = ev.address.city;
                options.params['field_location_img[0][name]'] = ev.address.name;
            }else {
                options.params['field_location_img[0][name]'] = ev.address.longAddress;
                options.params['field_location_img[0][country]'] = 'xx';
            }
            var success = function (result) {
                // This is a hack. Some alternative source should fit better e.g. Service3.
                var parser = new DOMParser();
                var doc = parser.parseFromString(result.response, "text/xml");
                //var nodeURL = doc.getElementById('fbconnect-autoconnect-form').getAttribute('action').match(/\/(image|node)\/[0-9]*/)[0];
                var nodeURL = doc.getElementById('comment-form').getAttribute('action');
                nodeURL = '/node'+nodeURL.substr(nodeURL.lastIndexOf('/'));
                ev.location = host+nodeURL; // data field abusement :P
                if(i<events.length) {
                    formPoster(events[i], i+1);
                    rkView.add(ev);
                }else {
                    state.html(UPLOAD_DONE);
                    rkView.add(ev, done);
                }
            };
            var error = function(err) {
                state.html(UPLOAD_ABORT);
                console.log('Form posting '+err.code+': '+err.exception);
                trimReport(i-1);
                if(err.code!==FileTransferError.ABORT_ERR) {
                    fail(err.http_status);
                }
            };

            var ft = new FileTransfer();
            ft.onprogress = function(progressEvent) {
                if(progressEvent.lengthComputable) {
                    meter.width((progressEvent.loaded/progressEvent.total*100)+'%');
                }
            };
            if(addAbortListener(ft)) {
                ft.upload(fileURL, encodeURI(uploadEndpoint), success, error, options);
            }else {
                error({ code: FileTransferError.ABORT_ERR, exception: 'early abort' });
            }
        };
		try {
			formPoster(events[0], 1);
		} catch(error) {
			fail('Exception!!');
			console.log(error);
		}
    }).fail(function(jqXHR, textStatus, errorThrown) {
        state.html(UPLOAD_ABORT);
        console.log('Form retrieval '+jqXHR.status+': '+errorThrown);
        if(errorThrown!=="abort") {
            fail(jqXHR.status);
        }
    });
}

function clearReport(report) {
    for(var i=0; i<report.events.length; i++) {
        var eventRow = eventRows[i];
        var event = report.events[i];
        eventRow.clear();
        event.clear();
    }
}

function trimReport(trimSize) {
    for(var i=0, t=0; i<eventRows.length && t<trimSize; i++) {
        var eventRow = eventRows[i];
        if(eventRow.hasImage) {
            eventRow.clear();
            eventRow.event.clear();
            t++;
        }
    }
}

function prepareReport(report) {
    for(var i=0; i<report.events.length; i++) {
        var eventRow = eventRows[i];
        var event = report.events[i];
        if(eventRow.hasImage) {
            var desc = eventRow.descElement.val();
            event.desc = desc;
            event.license = rkSetting.license;
            event.fbPostId = rkSetting.fbPostId;
        }
    }
    return null;
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
    prepareReport(rkreport);
    var events = rkreport.validEvents();
    var error = validateEvents(events);
    if(error!=null) {
        alert(error.message);
        return;
    }

    var done = function(resp) {
        clearReport(rkreport);
        uploadPopup.popup("close");
        //alert(UPLOAD_DONE);
    };
    var fail = function(code) {
        uploadPopup.popup("close");
        if(code===406) {
            window.location.replace('#logon');
        }else {
            alert(UPLOAD_FAILED);
        }
    };

    var verifyPost = function(success, cancel) {
        showPageBusy(FB_VERIFYING);
        var graphCheckPermissions = function() {
            facebookConnectPlugin.getLoginStatus(
                function(result) {
                    if(result.status === 'connected') { // check if the access token has publish_actions
                        facebookConnectPlugin.api(
                            "/me/permissions",
                            [],
                            function(result) {
                                if(result.data.some(function(e) {
                                    return e.status==="granted" &&
                                        e.permission==="publish_actions";
                                    })) {
                                    facebookConnectPlugin.getAccessToken(
                                        function(token) {
                                            rkAuth.db['fbtoken'] = token;
                                            success();
                                        },
                                        onCheckPermissionFail
                                    );
                                }else {
                                    console.log(result);
                                    facebookConnectPlugin.login(
                                        ["publish_actions"],
                                        function(response) {
                                            facebookConnectPlugin.api(
                                                "/me/permissions",
                                                [],
                                                function(result) {
                                                    if(result.data.some(function(e) {
                                                        return e.status==="granted" &&
                                                            e.permission==="publish_actions";
                                                        })) {
                                                        facebookConnectPlugin.getAccessToken(
                                                            function(token) {
                                                                rkAuth.db['fbtoken'] = token;
                                                                success();
                                                            },
                                                            onCheckPermissionFail
                                                        );
                                                    }else {
                                                        console.log(result);
                                                        if(confirm(FB_PERMISSION_ERROR)) {
                                                            rkSetting.setFbPostId('1');
                                                            success();
                                                        }else cancel();
                                                    }
                                                },
                                                onCheckPermissionFail
                                            );
                                        },
                                        onCheckPermissionFail
                                    );
                                }
                            },
                            onCheckPermissionFail
                        );
                    }else { // app unauthenticated or user logout, login 
                        console.log(result);
                        rkAuth.loginFB(graphCheckPermissions, cancel);
                    }
                },
                onCheckPermissionFail
            );
            var onCheckPermissionFail = function(err) {
                console.log(err);
                if(err && err.errorCode === '190') {
                    //Error validating access token: The user has not authorized application
                    rkAuth.loginFB(graphCheckPermissions, cancel);
                }else if(err === 'Session: an attempt was made to request new permissions for a session that has a pending request.') {
                    rkAuth.loginFB(graphCheckPermissions, cancel);
                }else {
                    cancel(FB_STATUS_ERROR);
                }
            };
        };
        var forceUpdate = true;
        rkAuth.checkAuth(graphCheckPermissions, cancel, forceUpdate);
    };
    var cancelUpload = function(msg) {
        hidePageBusy();
        btnUpload.prop('disabled', false).removeClass('ui-disabled');
        if(msg) alert(msg);
    };
    var startUpload = function() {
        hidePageBusy();
        upload(events, done, fail);
    };
    var getUserUploadLocation = function() {
        showPageBusy(PROCESSING);
        navigator.geolocation.getCurrentPosition(
            function(response) { 
                sharedLocationManager.uploadCoords = response.coords;
                startUpload();
            },
            function(err) {
                console.log('Location error: '+err.code);
                startUpload();
            }, 
            {enableHighAccuracy: false, maximumAge: 0, timeout: LOCATION_TEST_TIMEOUT}
        );
    };

    btnUpload.prop('disabled', true).addClass('ui-disabled');
    var publish = events.some(function(ev, i, arr) { return ev.fbPostId==0; });
    if(publish) {
        verifyPost(getUserUploadLocation, cancelUpload);
    }else {
        getUserUploadLocation();
    }
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
    editPopup = $("#editPopup");    
    imgPopup = $("#imgPopup");
    uploadPopup = $("#uploadPopup");    
    var elements = $("[id=eventRow]");
    for(var row=0; row<elements.length; row++) {
        var element = elements[row];
        var rkevent = rkreport.events[row] || rkreport.createEvent();
        var newRow = new RkEventRow(row, element, rkevent);
        if(rkevent.address) {
            var d = new Date(rkevent.time);
            newRow.locationElement.html(rkevent.address.shortAddress+'('+(d.getMonth()+1)+'/'+d.getDate()+')');
        }
        if(rkevent.photoURL) {
            newRow.displayPhoto(rkevent.photoURL);
            newRow.hasImage = true;
        }
        if(rkevent.desc) {
            newRow.descElement.html(rkevent.desc);
        }
        eventRows.push(newRow);
    }
    
    mapView = new MapView();
    uiReady = true;
}
 
function initModels() {
    if(rkreport!=null) {
        return;
    }
    rkreport = new RkReport();
    var rkStr = localStorage.getItem('rkevents');
    if(rkStr) {
        var rec = JSON.parse(rkStr);
        rec.forEach(function(ev, i, arr) {
            var rkEv = rkreport.createEvent();
            for(var key in ev) {
                if (ev.hasOwnProperty(key)) {
                    rkEv[key] = ev[key];
                }
            }
        });
        console.log('Loaded: '+rkStr);
    }
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
    sharedLocationManager.testGPS();
    window.setInterval(function(){sharedLocationManager.testGPS();}, 60000);
}

$(document).on("pagecreate", "#home", init);
$(document).on("pagecreate", "#map", initGmap);
})();
