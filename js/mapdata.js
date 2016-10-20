// Fusion table data with custom marker icons
//
// Based on:
// http://codepen.io/anon/pen/waaEJG

// FusionTable ID
var FTID = '1sShz8nYsrUu4NSG4hb-_vPTK4xCIYbCWNN-fAmJ2';

var apiKey = 'AIzaSyByn9Vgz7NismQookdlaSpVAl4nPuk8a94';

var DEFAULT_ICON_URL = 'http://maps.google.com/mapfiles/ms/icons/blue.png';
var MY_DEFAULT_ICON_URL = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';

var latitudeColumn = 'Latitude';
var longitudeColumn = 'Longitude';
var iconUrlColumn = 'Marker';
var userIdColumn = 'UserId';

var dataColumns = ['Title', 'URL', 'Type', 'Description', 'Details', 'Image'];

var markers = [];

var baseFilter = ['Helper = 0'];
var userFilter = [];

function filter() {
	var filter = baseFilter.join(' AND ');
	if (userFilter.length > 0) {
		filter += ' AND ' + userFilter.join(' AND ');
	}
	return filter;
}

function typeFilter(types) {
	return "Type IN ('" + types.join("','") + "')";
}

function setUserFilter(filter) {
	if (filter == null) {
		userFilter = [];
	} else if (typeof filter === "string") {
		userFilter = [filter];
	} else if (filter.constructor === Array) {
		userFilter = filter;
	} else {
		console.log('setUserFilter cannot be applied to type: '+(typeof filter));
	}	
	fetchData();
}

function defaultIconUrl(userId) {
	return $('#user_id').val() == userId ? 
		MY_DEFAULT_ICON_URL : DEFAULT_ICON_URL;	
}

function initFusionTable() {
	baseFilter = [ typeFilter(types(true)) ];
	fetchData();
}

function fetchData() {

	// Construct a query to get data from the Fusion Table
	var query = 'SELECT '
				+ latitudeColumn + ','
				+ longitudeColumn + ','
				+ iconUrlColumn + ','
				+ userIdColumn + ','
				+ dataColumns.join(',') 
				+ ' FROM '
				+ FTID
				+ ' WHERE '
				+ filter();
	console.log('DATA: ' + query);
	var encodedQuery = encodeURIComponent(query);

	// Construct the URL
	var url = ['https://www.googleapis.com/fusiontables/v2/query'];
		url.push('?sql=' + encodedQuery);
		url.push('&key=' + apiKey);
		url.push('&callback=?');

	// Send the JSONP request using jQuery
	$.ajax({
		url: url.join(''),
		dataType: 'jsonp',
		success: onDataFetched
	});
 }

 function onDataFetched(data) {
	 var rows = data['rows'];
	 var iconUrl;
	 var content;
	 var latLng;
	 
	 $.each(markers, function(index, marker) { 
		 marker.setMap(null); 
	 });
	 markers = [];

	 // Copy each row of data from the response into variables.
	 // Each column is present in the order listed in the query.
	 // Starting from 0.
	 $.each(rows, function(index, row) { 
	     iconUrl = row[2] ? row[2] : defaultIconUrl(row[3]);
	  	 content = {
			 lat: row[0],
			 lng: row[1],
			 title: row[4],
			 url: row[5],
			 type: row[6],
			 description: row[7],
			 details: row[8],
			 image: row[9],
			 userId: row[3]
		 };
		 
		 var marker = createMarker(content, iconUrl);
		 markers.push(marker);
	  });
 }

function createMarker(content, iconUrl) {
	var marker = new google.maps.Marker({
		map: map,
		position: new google.maps.LatLng(content.lat, content.lng),
		icon: new google.maps.MarkerImage(iconUrl),
		title: content.title
	});
	
	google.maps.event.addListener(marker, 'click', function(event) {
		showInfoWindowOnClick(content);
	});
	
	return marker;
}

function addMarker(row) {
	var iconUrl = row.marker ? 
		row.marker : defaultIconUrl(row.userId);
	var marker = createMarker(row, iconUrl);
	markers.push(marker);
}

function refreshMarkers() {
	fetchData();
}
