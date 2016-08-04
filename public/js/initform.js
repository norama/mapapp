

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