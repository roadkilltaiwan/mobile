// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require jquery.mobile
//= require turbolinks
//= require facebook

jQuery.fn.center = function () {
	this.css("position","absolute");
	this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2.0) + $(window).scrollTop() * 0) + "px");
 	this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2.0) + $(window).scrollLeft() * 0) + "px");
 	return this;
};

jQuery.fn.bottom = function () {
	this.css("margin-top", $(window).height() + "px");
 	return this;
};