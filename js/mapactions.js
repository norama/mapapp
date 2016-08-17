
var BROWSER_KEY = 'AIzaSyByn9Vgz7NismQookdlaSpVAl4nPuk8a94';

var FTID = '1sShz8nYsrUu4NSG4hb-_vPTK4xCIYbCWNN-fAmJ2';


function deleteItem(e) {
	var latLng = e.data.itemLatLng;
	var title = e.data.itemTitle;
	if (confirm('Delete item: '+title+'?')) {
		hideInfoWindow();
		doWithROWID(latLng.lat(), latLng.lng(), doDeleteItem)
	}
}

function doDeleteItem(rowid) {
	console.log('Deleting item with rowid: '+rowid);


    $.ajax({
     
        // The URL for the request
        //url: mapappUrl('/insert'),
        url: mapappUrl('/delete'),
     
        // The data to send (will be converted to a query string)
        data: {'rowid': rowid},
     
        // Whether this is a POST or GET request
        type: "POST",
     
        // The type of data we expect back
        dataType : "json",


    })
    .done(function( json ) {
        
        console.log("------> SUCCESS")
        console.log(JSON.stringify(json, null, 2));

        var randomRowid = Math.floor(Math.random() * 100000)
        refreshFTLayer(randomRowid);

    })
    .fail(function( xhr, status, errorThrown ) {
        
        initErrorWithText("Error deleting item: " + errorThrown + '<br/>' + xhr.responseText);

        console.log( "Error: " + errorThrown );
        console.log( "Status: " + status );
        console.dir( xhr );
    });

}



// See http://stackoverflow.com/questions/26936287/google-maps-api-v3-fusion-layers-get-row-data
// callback: function taking rowid parameter
function doWithROWID(lat, lng, callback){
    var queryStr = [];
    queryStr.push("SELECT rowid ");
    queryStr.push("FROM " + FTID);
    // set coordinates and tolerance radius
    queryStr.push("WHERE ST_INTERSECTS(Latitude, CIRCLE(LATLNG("+lat+", "+lng+"), 10))");

    var sql = encodeURIComponent(queryStr.join(" "));
    $.ajax({
        url: "https://www.googleapis.com/fusiontables/v2/query?sql="+sql+"&key="+BROWSER_KEY,
        dataType: "json"
    })
    .done(function (response) {
    	console.log(JSON.stringify(response, null, 2));
    	if ('rows' in response) {
    		var rowid = response.rows[0][0];
    		callback(rowid);
    	} else {
    		initErrorWithText('No item around ('+lat+',' +lng+')');
    	}
    })
    .fail(function( xhr, status, errorThrown ) {
        
        initErrorWithText("Error getting rowid: " + errorThrown + '<br/>' + xhr.responseText);

        console.log( "Error: " + errorThrown );
        console.log( "Status: " + status );
        console.dir( xhr );
    });;
}