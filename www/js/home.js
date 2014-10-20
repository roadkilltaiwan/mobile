(function() {

var LOCATION_SERVICE_TIMEOUT = 10000;
var HTTP_REQUEST_TIMEOUT = 10000;
var GOOGLE_MAPS_API_URL = "http://maps.googleapis.com/maps/api/geocode/json?language=zh-TW&sensor=true&latlng=";
var CAMERA_IMAGE = "./img/camera.png";
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
var UPLOAD_ABORT = "上傳已中斷";
var UPLOADING = "上傳中..."; 
var PICK_LOCATION = "請點選地點";
var PICK_DATE = "請選拍攝日期"; 
var PROCESSING = "處理中...";
var PARSE_GEOCODING_RESULT_FAILED = "無法解析地址資訊";
var GEOCODING_SERVICE_ERROR = "地址查詢產生錯誤";
var FB_VERIFYING = "準備中...";
var FB_PERMISSION_ERROR = "請重新上傳並同意路殺社APP使用您的帳號發文，或至[選項]>[在路殺社臉書社團…]，選擇以公用帳號發佈或不要發佈。";

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
    mapView.show({location: this.event.location, address: {longaddress: this.event.address, shortaddress: this.event.shortAddress}, time: new Date(this.event.time)});
};

RkEventRow.prototype.handleAddress = function(address) {
    this.event.address = address.longaddress;
    this.event.shortAddress = address.shortaddress;
    this.locationElement.html(address.shortaddress);
    rkreport.updateStorage();
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
    }else console.log(error.code+': '+error.message);
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
                    foundLocationInPhoto = true;
                    sharedLocationManager.getAddress(exifData.location.latitude, exifData.location.longitude, this);
                }
            }
        }
        if(!foundLocationInPhoto) {
            sharedLocationManager.getLocation(this);
        }
    }, this));
};


RkEventRow.prototype.mapViewConfirmed = function(options) {
    this.event.location = options.location.coords;
    this.event.address = options.location.address.longaddress;
    this.event.shortAddress = options.location.address.shortaddress;
    this.event.time = options.time.getTime();
    this.locationElement.html(options.location.address.shortaddress);
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
        imgPopup.popup("close");
        var option = {
            destinationType: navigator.camera.DestinationType.FILE_URI,
            sourceType: navigator.camera.PictureSourceType[e.target.id],
            //saveToPhotoAlbum: true,
            correctOrientation: true
        };
        navigator.camera.getPicture(
            $.proxy(function(imgURI) {
                this.hasImage = true;
                var that = this;
                function copy(cwd, src, dest) {
                    window.resolveLocalFileSystemURL(src, function(fileEntry) {
                        cwd.getDirectory(dest, {create: !!dest}, function(dirEntry) {
                            var d = new Date();
                            d.setTime(d.getTime()-d.getTimezoneOffset()*60*1000);
                            fileEntry.copyTo(dirEntry,
                                'IMG_'+(/[^\.]*/.exec(d.toISOString())[0].replace(/:/g, '-'))+'.jpg',
                                function(f) {
                                    that.displayPhoto(f.toURL());
                                    that.event.photoURL = f.toURL();
                                    rkreport.updateStorage();
                                    if(option.sourceType===navigator.camera.PictureSourceType.CAMERA) {
                                        fileEntry.remove(function() {
                                          console.log('File removed - '+src);
                                        }, errorHandler);
                                    }
                                },
                                errorHandler
                            );
                        }, errorHandler);
                    }, errorHandler);
                }
                var errorHandler = function(err) {
                    that.hasImage = false;
                    console.log(JSON.stringify(err));
                };
                if(option.sourceType!==navigator.camera.PictureSourceType.CAMERA) {
                    window.requestFileSystem(window.TEMPORARY, 1024*1024,
                        function(fs) {
                            copy(fs.root, imgURI, '');
                        },
                        errorHandler
                    );
                }else {
                    var sd = cordova.file.externalRootDirectory;
                    if(sd) {
                        window.resolveLocalFileSystemURL(sd,
                            function(dirEntry) {
                                copy(dirEntry, imgURI, 'DCIM/Roadkill');
                            },
                            errorHandler
                        );
                    }else {
                        window.requestFileSystem(window.PERSISTENT, 1024*1024,
                            function(fs) {
                                copy(fs.root, imgURI, 'DCIM/Roadkill');
                            },
                            errorHandler
                        );
                    }
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
    this.shortAddress = null;
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
    this.shortAddress = null;
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
    var country = null, city = null, locality = null, sublocality = null,
        route = null, poi = null;
    var found = false;
    for(var r in response.results) {
        var result = response.results[r];
        for (var ac in result.address_components) {
            var addressComponent = result.address_components[ac];               
            var types = addressComponent.types;
            for(var t in types) {
                var type = types[t];
                if (city==null && (type=="administrative_area_level_2" ||
                    type=="administrative_area_level_1")) { //e.g. Taipei,Tainan
                    city = addressComponent.long_name;
                    break;
                }
                else if (locality==null && type=="administrative_area_level_3") {
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
        if(poi!=null) {
            longAddress += poi;
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

function upload(events, done, fail) {
    var meter = uploadPopup.find('div.meter>span');
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
            options.params = {
                'form_build_id': form['form_build_id'].value,
                'form_token': form['form_token'].value,
                'form_id': form['form_id'].value,
                'title': '['+ev.shortAddress+'] '+sDate,
                'field_app_post_type[value]': ev.fbPostId,
                'field_data_res[value]': '323',
                'field_imagefield[0][fid]': '0',
                'field_imagefield[0][list]': '1',
                'body': ev.desc,
                'field_location_img[0][name]': ev.address,
                'field_location_img[0][locpick][user_latitude]': ev.location.latitude,
                'field_location_img[0][locpick][user_longitude]': ev.location.longitude,
                'field_img_date[0][value][date]': /[\d-]*/.exec(new Date(ev.time-sDate.getTimezoneOffset()*60*1000).toISOString())[0],
                'field_access_token[0][value]': rkAuth.db.fbtoken,
                'creativecommons[select_license_form][cc_license_uri]': ccOpt.querySelector('option[value*="'+ev.license+'/"]').value,
                'field_author[0][value]': form["field_author[0][value]"]? form["field_author[0][value]"].value: '?',
                'name': rkAuth.db.name,
                'status': '1',
                'promote': '1'
            };

            var success = function (result) {
                //var sDate = new Date(ev.time);
                //var container = form.querySelector('#edit-field-imagefield-0-ahah-wrapper');
                //container.outerHTML = JSON.parse(result.response.replace(/\\x3c/g, '<').replace(/\\x3e/g, '>')).data;

                /*form['title'].value = '['+ev.shortAddress+'] '+sDate;
                form['body'].value = ev.desc;
                //form['field_app_post_type[value]'][ev.fbPostId].checked = true;
                //form['field_data_res[value]'][1].checked = true;
                //console.log(form['field_data_res[value]']);
                form['field_location_img[0][name]'].value = ev.address;
                form['field_location_img[0][locpick][user_latitude]'].value = ev.location.latitude.toFixed(6);
                form['field_location_img[0][locpick][user_longitude]'].value = ev.location.longitude.toFixed(6);
                form['field_img_date[0][value][date]'].value = /[\d-]*////.exec(new Date(ev.time-sDate.getTimezoneOffset()*60*1000).toISOString())[0];
                /*form['field_access_token[0][value]'].value = rkAuth.db.fbtoken;
                form['creativecommons[select_license_form][cc_license_uri]'].value = ccOpt.querySelector('option[value*="'+ev.license+'/"]').value;
                if(form['field_data_res[value]']) {
                    form['field_data_res[value]'][1].checked = true;
                }
                var formData = new FormData(form);
                if(!form['field_data_res[value]']) {
                    formData.append('field_data_res[value]', 323);
                }
                formData.append('field_app_post_type[value]', ev.fbPostId);
                $.ajax({
                    type: 'POST',
                    url: uploadEndpoint,
                    data: formData,
                    dataType: 'xml',
                    contentType: false,
                    processData: false,
                    beforeSend: addAbortListener
                }).done(function (response, textStatus, jqXHR) {*/
                    // This is a hack. Some alternative source should fit better e.g. Service3.
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(result.response, "text/xml");
                    var nodeURL = doc.getElementById('fbconnect-autoconnect-form').getAttribute('action').match(/\/(image|node)\/[0-9]*/)[0];
                    ev.location = host+nodeURL; // data field abusement :P
                    if(i<events.length) {
                        formPoster(events[i], i+1);
                        rkView.add(ev);
                    }else {
                        state.html(UPLOAD_DONE);
                        rkView.add(ev, done);
                    }
                /*}).fail(function(jqXHR, textStatus, errorThrown) {
                    state.html(UPLOAD_ABORT);
                    console.log('Form posting '+jqXHR.status+': '+errorThrown);
                    trimReport(i-1);
                    if(errorThrown!=="abort" && errorThrown!=="canceled") {
                        fail();
                    }
                });*/
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
                ft.upload(fileURL, encodeURI(uploadEndpoint/*host+'/filefield/ahah/image/field_imagefield/0'*/), success, error, options);
            }else {
                error({ code: FileTransferError.ABORT_ERR, exception: 'early abort' });
            }
        };
        formPoster(events[0], 1);
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
        alert(UPLOAD_DONE);
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
        var recheck=true;
        if(!rkAuth.hasAuth(recheck)) {
            cancel(UPLOAD_FAILED);
            console.log('invalid session or connection');
        }else {
            facebookConnectPlugin.api(
                "/me/permissions",
                ["user_groups"],
                function(result) {
                    if(result.data.some(function(e) {
                        return e.status==="granted" &&
                            e.permission==="user_groups";
                    })) {
                        facebookConnectPlugin.api(
                            "/me/permissions",
                            ["publish_actions"],
                            function(result) {
                                if(result.data.some(function(e) {
                                    return e.status==="granted" &&
                                        e.permission==="publish_actions";
                                    }) &&
                                    result.data.some(function(e) {
                                    return e.status==="granted" &&
                                        e.permission==="user_groups";
                                })) {
                                    facebookConnectPlugin.getLoginStatus(
                                        function(response) {
                                            rkAuth.db['fbtoken'] = response.authResponse.accessToken;
                                            success();
                                        },
                                        function(err) {
                                            console.log(err);
                                            cancel(UPLOAD_FAILED);
                                        }
                                    );
                                }else cancel(FB_PERMISSION_ERROR);
                            },
                            function(err) {
                                console.log(err);
                                cancel(UPLOAD_FAILED);
                            }
                        );
                    }else cancel(FB_PERMISSION_ERROR);
                },
                function(err) {
                    console.log(err);
                    if(!err || err.search('session that has been closed')<0) {
                        cancel(UPLOAD_FAILED);
                    }else {
                        // workaround for not raising error on user cancel
                        window.setTimeout(cancel, 5000);
                        facebookConnectPlugin.login(
                            ["user_groups"],
                            function(response) {
                                verifyPost(success, cancel);
                            },
                            function(err) {
                                console.log(err);
                                cancel(UPLOAD_FAILED);
                            }
                        );
                    }
                }
            );
        }
    };
    var cancelUpload = function(msg) {
        btnUpload.prop('disabled', false).removeClass('ui-disabled');
        if(msg) alert(msg);
    };
    var startUpload = function() {
        if(confirm("確定開始上傳？")) {
            btnUpload.prop('disabled', true).addClass('ui-disabled');
            upload(events, done, fail);
        }else cancelUpload();
    };

    btnUpload.prop('disabled', true).addClass('ui-disabled');
    var publish = events.some(function(ev, i, arr) { return ev.fbPostId==0; });
    if(publish) {
        verifyPost(startUpload, cancelUpload);
    }else {
        startUpload();
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
        if(rkevent.shortAddress) {
            newRow.locationElement.html(rkevent.shortAddress);
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
}

$(document).on("pagecreate", "#home", init);
$(document).on("pagecreate", "#map", initGmap);
})();
