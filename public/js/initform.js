

function initForm() {
      $('#addItemForm').jsonForm({
        schema: {
          title: {
            type: 'string',
            title: 'Title',
            required: true
          },
          description: {
            type: 'string',
            title: 'Description'
          },
          lat: {
            type: 'string',
            title: 'Lat'
          },
          lng: {
            type: 'string',
            title: 'Lng'
          }
        },
        "form": [
            "title", 
            {
             	"key": "description",
             	"type": "textarea"
        	},
            {
            	"type": "section",
                "items": {
                	"type": "section",
                	"title": "Location",
                	"items": [
            			"lat", 
            			"lng"
            		]
            	}
        	},
            {
              "type": "actions",
              "items": [
              {
                "type": "submit",
                "title": "Submit"
              }
              ,
              {
                "type": "button",
                "title": "Cancel",
                "onClick": function (evt) {
                  	evt.preventDefault();
                  	$( '#mapform' ).hide();      
                }
              }
              ]
            }
          ],
          onSubmitValid: function (values) {
          
            console.log(values);
            addItem(values);

        }
      });

      //console.dir(window.location);

      //$('#addItemForm').find('label').addClass('control-label');	
}

function addItem(values) {

$.ajax({
 
    // The URL for the request
    url: "https://www.googleapis.com/fusiontables/v2/query",
 
    // The data to send (will be converted to a query string)
    data: {

        sql: "INSERT INTO "+FTID+" (Title, Description, Latitude, Longitude, Timestamp) VALUES ('" + 
			values['title']+"', '" +
			values['description']+"', '" +
			values['lat']+"', '" +
			values['lng']+"', '" +
			timestamp()+"')"
    },
 
    // Whether this is a POST or GET request
    type: "POST",
 
    // The type of data we expect back
    dataType : "json",

    beforeSend : function( xhr ) {
        xhr.setRequestHeader( "Authorization", "Bearer " + ACCESS_TOKEN );
    },

    statusCode: {
    	401: function() {
            alert('Login failed');

            refreshTokens(addItem, values);
        }
    }

})
  // Code to run if the request succeeds (is done);
  // The response is passed to the function
  .done(function( json ) {
 		alert("Success!");
 		console.dir(json);
  })
  // Code to run if the request fails; the raw request and
  // status codes are passed to the function
  .fail(function( xhr, status, errorThrown ) {
	    alert( "Sorry, there was a problem!" );
	    console.log( "Error: " + errorThrown );
	    console.log( "Status: " + status );
	    console.dir( xhr );
  })
  // Code to run regardless of success or failure;
  .always(function( xhr, status ) {
    	alert( "The request is complete!" );
  });
}


function timestamp() {
	var now = new Date();
	return now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate()+" "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
}

function refreshTokens(callback, values) {
	$.ajax({
 
    	// The URL for the request
    	//url: "https://www.googleapis.com/oauth2/v4/token",
    	url: "https://accounts.google.com/o/oauth2/token",
 
    	// The data to send (will be converted to a query string)
    	data: {
    		refresh_token: REFRESH_TOKEN,
    		client_id: OAUTH_CLIENT_ID,
    		client_secret: OAUTH_CLIENT_SECRET,
    		grant_type: 'refresh_token'
    	},

		xhrFields: {
		    // The 'xhrFields' property sets additional fields on the XMLHttpRequest.
		    // This can be used to set the 'withCredentials' property.
		    // Set the value to 'true' if you'd like to pass cookies to the server.
		    // If this is enabled, your server must respond with the header
		    // 'Access-Control-Allow-Credentials: true'.
		    withCredentials: false
		},

		headers: {
		    // Set any custom headers here.
		    // If you set any non-simple headers, your server must include these
		    // headers in the 'Access-Control-Allow-Headers' response header.
		},

	    // Whether this is a POST or GET request
	    type: "POST",
	 
	    // The type of data we expect back
	    dataType : "json",

	    beforeSend: function(jqXHR, settings) {
      		console.log(settings.url);
      		console.dir(settings);
  		}
    })
	.done(function( json ) {
 		alert("refreshTokens(): Success!");
 		console.dir(json);
 		ACCESS_TOKEN = json.access_token;
 		console.log('Setting ACCESS_TOKEN: '+ACCESS_TOKEN);
 		if (json.refresh_token != 'undefined') {
 			REFRESH_TOKEN = json.refresh_token;
 			console.log('Setting REFRESH_TOKEN: '+REFRESH_TOKEN);
 		} 
  	}) 
  	.fail(function( xhr, status, errorThrown ) {
  		alert( "refreshTokens(): Sorry, there was a problem!" );
	    console.log( "Error: " + errorThrown );
	    console.log( "Status: " + status );
	    console.dir( xhr );
  	}) 
  	.always(function( xhr, status ) {
  	});
}