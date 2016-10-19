function initExternalItemForm() {
	
	$('#externalItemForm').jsonForm({
		schema: {
		  url: {
			type: 'url',
			title: 'URL',
			format: 'url',
			required: true
		  },
		  type: {
			type: 'string',
			title: 'Type',
			enum: types(false),
			required: true
		  }
		},
		"form": [
			{
				"key": "url",
				"value": ''
			},
			{
				"key": "type",
				"titleMap": config.titles
			},
			{
			  "type": "actions",
			  "items": externalItemButtonPanel()
			}
		  ],
		  onSubmitValid: function (values) {

			hideExternalItemForm(); 
			hideInfoWindow();
			clearItemMarker(); 
			console.log(JSON.stringify(values, null, 4));

			submitExternalItem(values);
		  }
	  });
}

function externalItemButtonPanel() {
    var buttons = [];
	buttons.push({
		"type": "submit",
		"title": "Add"
	});

	buttons.push({
		"type": "button",
		"title": "Cancel",
		"onClick": function (evt) {
			evt.preventDefault();
			clearUrlField();
			hideExternalItemForm();   
		}
	});

    return buttons;
}


function submitExternalItem(values) {
    
	var center = map.getCenter();
    
    showWait(center.lat(), center.lng());

    $.ajax({
     
        // The URL for the request
        url: mapappUrl('/externalitem'),
     
        // The data to send (will be converted to a query string)
        data: values,
     
        // Whether this is a POST or GET request
        type: "POST",
     
        // The type of data we expect back
        dataType : "json",


    })
    .done(function(row) {
        
        console.log("------> SUCCESS")
        console.log(JSON.stringify(row, null, 2));
        console.log('rowid: '+row.rowid);

        console.log('lat: '+row.lat+', lng: '+row.lng);

        map.setCenter({lat: row.lat, lng: row.lng}); 
		addMarker(row);
        showInfoWindow(row);

    })
    .fail(function( xhr, status, errorThrown ) {
        
        initErrorWithText("Error processing item: " + errorThrown + '<br/>' + xhr.responseText);

        console.log( "Error: " + errorThrown );
        console.log( "Status: " + status );
        console.dir( xhr );
    })
    .always(function() {
        hideWait(center.lat(), center.lng());
    });
}

function clearUrlField() {
	$('#externalItemForm input[name="url"]').val('');
}