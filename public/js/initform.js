

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
            //testCall('/store');
            addItem(values);

        }
      });

      //console.dir(window.location);

      //$('#addItemForm').find('label').addClass('control-label');	
}

function testCall(uri) {


    $.ajax({

        url: mapappUrl(uri),

        type: "POST",

        dataType: "json",



    })
    .done(function( json ) {
        alert("Result: "+JSON.stringify(json));
        
    })
    .fail(function( xhr, status, errorThrown ) {
        alert( "Sorry, there was a problem!" );
        console.log( "Error: " + errorThrown );
        console.log( "Status: " + status );
        console.dir( xhr );
    });

}


function addItem(values) {

    $.ajax({
     
        // The URL for the request
        url: mapappUrl('/insert'),
     
        // The data to send (will be converted to a query string)
        data: values,
     
        // Whether this is a POST or GET request
        type: "POST",
     
        // The type of data we expect back
        dataType : "json"

    })
    .done(function( json ) {
        alert("Success!");
        console.log("------> SUCCESS")
        console.dir(json);
    })
    .fail(function( xhr, status, errorThrown ) {
        alert( "Sorry, there was a problem!" );
        console.log( "Error: " + errorThrown );
        console.log( "Status: " + status );
        console.dir( xhr );
    });
}



function mapappUrl(uri) {
    var loc = window.location;
    return loc.protocol + '//' + loc.host + '/app' + uri;
}

function timestamp() {
	var now = new Date();
	return now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate()+" "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
}


