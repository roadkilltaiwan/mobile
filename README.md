# Roadkill Report, a mobile Phonegap app

## Setup

Install SDKs of each targeting mobile platform.
Also follow [this guide](https://cordova.apache.org/docs/en/edge/guide_cli_index.md.html) to setup Cordova CLI.

When you are ready, in the project root
```
cordova platform add android/ios
cordova plugin add org.apache.cordova.camera org.apache.cordova.file org.apache.cordova.file-transfer org.apache.cordova.geolocation org.apache.cordova.inappbrowser https://github.com/Initsogar/cordova-webintent.git
cordova plugin add com.phonegap.plugins.facebookconnect --variable APP_ID="123456" --variable APP_NAME="..."
cordova prepare
```

Now for each targeting platform
* Android:

    cordova run / open Android project (platform/android) in Eclipse and run

* iOS:

    open iOS project in Xcode (platforms/iOS)

    run on device

* Chrome:

    lanuch apache

    run on google chrome plugin ripple



