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

function defaultIconUrl(userId) {
	return $('#user_id').val() == userId ? 
		MY_DEFAULT_ICON_URL : DEFAULT_ICON_URL;	
}

function initFusionTable() {
	fetchData();
}

function fetchData() {

	// Construct a query to get data from the Fusion Table
	var query = 'SELECT '
				+ latitudeColumn + ','
				+ longitudeColumn + ','
				+ iconUrlColumn + ','
				+ userIdColumn + ','
				+ dataColumns.join(',') + ' FROM '
				+ FTID;
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
	 for (var i in rows) {
	  	 latLng = new google.maps.LatLng(rows[i][0],rows[i][1]);
	     iconUrl = rows[i][2] ? rows[i][2] : defaultIconUrl(rows[i][3]);
	  	 content = {
			 title: rows[i][4],
			 url: rows[i][5],
			 type: rows[i][6],
			 description: rows[i][7],
			 details: rows[i][8],
			 image: rows[i][9],
			 userId: rows[i][3]
		 };
		 
		 var marker = createMarker(latLng, iconUrl, content);
		 markers.push(marker);
	  }
 }

function createMarker (latLng, url, content) {
	var marker = new google.maps.Marker({
		map: map,
		position: latLng,
		icon: new google.maps.MarkerImage(url),
		title: content.title
	});
	
	google.maps.event.addListener(marker, 'click', function(event) {
		var e = {
			latLng: latLng,
			row: content
		};
		showInfoWindowOnClick(e);
	});
	
	return marker;
}

function addMarker(row) {
	var iconUrl = row.marker ? 
		row.marker : defaultIconUrl(row.userId);
	var latLng = new google.maps.LatLng(row.lat, row.lng);
	var marker = createMarker(latLng, iconUrl, row);
	markers.push(marker);
}

function refreshMarkers() {
	fetchData();
}
