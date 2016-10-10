
function initLoginForm() {

	$('#loginItemForm').empty();
    $('#loginItemForm').jsonForm({
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
                    hideLoginForm();    
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

function itemAction(e) {
    var formItem = e.data.item;
    var action = e.data.action;
    clearItemMarker();
    fillItemForm(formItem, action);
    showItemForm();
}

var emptyItem = {
    title: '',
	url: '',
	config: '',
    description: '',
	details: '',
	image: '',
    lat: '',
    lng: ''
}

var itemHeaders = {
    'add': 'Add Item',
    'view': 'View Item',
    'edit': 'Edit Item',
    'delete': 'Delete Item'
}

var submitLabels = {
    'add': 'Store',
    'edit': 'Change',
    'delete': 'Delete'
}

var cancelLabels = {
    'add': 'Cancel',
    'view': 'Close',
    'edit': 'Cancel',
    'delete': 'Cancel'
}

function fillItemForm(formItem, action) {

    $('#itemHeader').empty();
    $('#itemHeader').append(itemHeaders[action])

    $('#itemForm').empty();
    initItemForm(formItem, action);
    
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
}

function initItemForm(formItem, action) {

    var readonly = (action == 'view') || (action == 'delete');

      $('#itemForm').jsonForm({
        schema: {
          title: {
            type: 'string',
            title: 'Title',
            required: true,
            readonly: readonly
          },
		  url: {
			type: 'url',
            title: 'URL',
			format: 'url',
			readonly: readonly
		  },
          description: {
            type: 'string',
            title: 'Short description',
            readonly: readonly
          },
          image: {
            type: 'string',
            title: 'Image',
            maxFileSize: 1000000,
            readonly: readonly
          },
		  details: {
            type: 'string',
            title: 'More details',
            readonly: readonly
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
		
				{
					"key": "title",
					"value": formItem['title']
				}, 
				{
					"key": "url",
					"value": formItem['url']
				}, 
				{
					"type": "fieldset",
					"expandable": true,
					"title": "Details",
					"items": [
					{
						"key": "description",
						"type": "textarea",
						"height": "80px",
						"width": "230px",
						"value": formItem['description']
					},
					{
						"key": "details",
						"type": "wysihtml5",
						"width": "230px",
						"value": formItem['details']
					}
					]
				},		
				{
					"key": "image",
					"type": "fileupload",
					//"prepend": "(gif, jpg, png), max 1MB",
					"value": formItem['image']
        		},
		
			{
             	"key": "lat",
             	"type": "hidden",
				"value": formItem['lat']
        	},
			{
             	"key": "lng",
             	"type": "hidden",
				"value": formItem['lng']
        	},
            {
              "type": "actions",
              "items": itemButtonPanel(action)
            }
          ],
          onSubmitValid: function (values) {
              
            // var img = $("#itemForm [name='image']");
            // console.log(img.val());
          
            hideItemForm(); 
            hideInfoWindow();
            clearItemMarker(); 
            console.log(JSON.stringify(values, null, 4));
            
            submit(values, action);

        }
      });

}

function itemButtonPanel(action) {
    var buttons = [];
    if (action in submitLabels) {
        buttons.push({
            "type": "submit",
            "title": submitLabels[action]
        });
    }
    if (action in cancelLabels) {
        buttons.push({
            "type": "button",
            "title": cancelLabels[action],
            "onClick": function (evt) {
                evt.preventDefault();
                hideItemForm();   
                clearItemMarker();    
            }
        });
    }
    return buttons;
}


function submit(values, action) {
    
    console.log('IMAGE: ' + values['image']);

    var lat = Number(values['lat']);
    var lng = Number(values['lng']);

    showWait(lat, lng);

    $.ajax({
     
        // The URL for the request
        //url: mapappUrl('/insert'),
        url: mapappUrl('/' + action),
     
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
        console.log('rowid: '+json.rowid);

        var pos = new google.maps.LatLng(json.lat, json.lng);
        var row = json;

        console.log('lat: '+pos.lat()+', lng: '+pos.lng());

        if (action == 'delete') {
            refreshFTLayer();
        } else {
            refreshFTLayer(pos, row);
        }

    })
    .fail(function( xhr, status, errorThrown ) {
        
        initErrorWithText("Error processing item: " + errorThrown + '<br/>' + xhr.responseText);

        console.log( "Error: " + errorThrown );
        console.log( "Status: " + status );
        console.dir( xhr );
    })
    .always(function() {
        hideWait(lat, lng);
    });
}


function timestamp() {
	  var now = new Date();
	  return now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate()+" "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
}


