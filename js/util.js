
var USER_TYPES_BASE_URL = 'https://storage.cloud.google.com/rich-tribute-135219.appspot.com/types/';

// http://stackoverflow.com/a/1144788/6686659

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}




function mapappUrl(uri) {
    var loc = window.location;
    //return loc.protocol + '//' + loc.host + '/app' + uri;
    return loc.protocol + '//' + loc.host + uri;
}

var waitMap = new Map();

function inProgress() {
	return (waitMap.size > 0);
}

function showWait(lat, lng) {
	var pos = new google.maps.LatLng({lat: lat, lng: lng}); 
	var key = pos.toString();
	var marker=new google.maps.Marker({
  		position: pos,
  		icon: '/img/processing.gif',
  		title: 'In progress ...',
  		map: map,
  		draggable: false,
  		optimized: false
  	});
  	waitMap.set(key, marker);

	// $("body").css("cursor", "progress");
	// map.setOptions({draggableCursor: 'wait'});
}

function hideWait(lat, lng) {
	var pos = new google.maps.LatLng({lat: lat, lng: lng}); 
	var key = pos.toString();
	if (waitMap.has(key)) {
		var marker = waitMap.get(key);
		marker.setMap(null);
		waitMap.delete(key);
	}

	
	// $("body").css("cursor", "auto");
	// map.setOptions({draggableCursor: null});
}

config = null;

function loadConfig(callback) {
	
		$.getJSON( "/config/external/styles.json", function( styles ) {
			$.getJSON( "/config/external/titles.json", function( titles ) {		
				$.getJSON( "/config/external/markers.json", function( markers ) {

					config = {
						"types": _userTypes(),
						"titles": titles,
						"markers": markers,
						"styles": styles
					};
					
					console.log("----> types: " + JSON.stringify(config.types));

					callback();

				});

			});

		});

}

function _userTypes() {
	return $('#user_types').val().split(',');
}

function types() {
	return config.types;
}

function titles(emptyTitle=' ') {
	var _titles = {};
	$.each(config.titles, function(_type, _title) {
		_titles[_type] = '<img src="'+config.markers[_type]+'">&nbsp;' + _title;
	});
	_titles[''] = emptyTitle;
	return _titles;
}

