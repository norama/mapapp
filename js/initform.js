
function initLoginForm() {
    $('#addItemForm').before('<p>To add items you have to log in.</p>');
    $('#addItemForm').jsonForm({
    "form": [
            
            {
              "type": "actions",
              "items": [
              
              {
                "type": "submit",
                "title": "Login"
              },
              {
                "type": "button",
                "title": "Cancel",
                "onClick": function (evt) {
                    evt.preventDefault();
                    $( '#mapform' ).hide();    
                    clearItemMarker();
                }
              }]
            }
          ],
          onSubmitValid: function (values) {

            $('#loginForm').submit();   

          }
      });

}

var emptyItem = {
    title: '',
    description: '',
    lat: '',
    lng: ''
}

function fillItemForm(formItem) {

    $('#itemForm').empty();
    initItemForm(formItem);
    
    // $('#itemForm').find('input[name="title"]').attr('value', formItem['title']);
    // $('#itemForm').find('input[name="description"]').attr('value', formItem['description']);    

    // $('#itemForm').find('input[name="lat"]').val(formItem['lat']);
    // $('#itemForm').find('input[name="lng"]').val(formItem['lng']);    

    // storePosition();
}

function storePosition() {
    if (itemMarker == null) {
        return;
    }
    if ($( '#mapform' ).css('display') == 'none') {
        return;
    }

    var lat = itemMarker.getPosition().lat();
    var lng = itemMarker.getPosition().lng();

    $('#itemForm').find('input[name="lat"]').val(lat);
    $('#itemForm').find('input[name="lng"]').val(lng);

    
    console.log(lat + ", " + lng);

    // document.getElementById('lat').value = lat;
    // document.getElementById('lng').value = lng;
}

function initItemForm(formItem) {

      $('#itemForm').jsonForm({
        schema: {
          title: {
            type: 'string',
            title: 'Title',
            default: formItem['title'],
            required: true
          },
          description: {
            type: 'string',
            title: 'Description',
            default: formItem['description']
          },
          lat: {
            type: 'hidden',
            title: 'Lat',
            default: formItem['lat']
          },
          lng: {
            type: 'hidden',
            title: 'Lng',
            default: formItem['lng']
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
              },
              {
                "type": "button",
                "title": "Cancel",
                "onClick": function (evt) {
                  	evt.preventDefault();
                  	hideMapform();   
                    clearItemMarker();    
                }
              }]
            }
          ],
          onSubmitValid: function (values) {
          
            hideMapform(); 
            clearItemMarker(); 
            console.log(values);
            
            addItem(values);

        }
      });

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
        //url: mapappUrl('/insert'),
        url: mapappUrl('/insert'),
     
        // The data to send (will be converted to a query string)
        data: values,
     
        // Whether this is a POST or GET request
        type: "POST",
     
        // The type of data we expect back
        dataType : "json",


    })
    .done(function( json ) {
        
        console.log("------> SUCCESS")
        console.log(JSON.stringify(json, null, 2));
        console.log('rowid: '+json.rowid)

        refreshFTLayer(json.rowid);
        var randomRowid = Math.floor(Math.random() * 100000)
        refreshFTLayer(randomRowid);

        var mev = {
            stop: null,
            latLng: new google.maps.LatLng(json.lat, json.lng),
            row: json
        }

        showInfoWindow(mev);

    })
    .fail(function( xhr, status, errorThrown ) {
        
        initErrorWithText("Error adding item: " + errorThrown + '<br/>' + xhr.responseText);

        console.log( "Error: " + errorThrown );
        console.log( "Status: " + status );
        console.dir( xhr );
    });
}


function timestamp() {
	  var now = new Date();
	  return now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate()+" "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
}


