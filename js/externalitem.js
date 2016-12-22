function initExternalItemForm() {
	
	$('#externalItemForm').jsonForm({
		schema: {
		  url: {
			type: 'url',
			title: 'URL',
			format: 'url',
			required: true
		  },
		  multiple: {
			type: 'boolean',
			title: 'Multiple'
		  },
		  type: {
			type: 'string',
			title: 'Type',
			enum: _.without(types(), ''),
			required: true
		  }
		},
		"form": [
			{
				"key": "url",
				"value": ''
			},
			{
				"key": "multiple",
				"inlinetitle": "Item URLs selected by 'item' selector"
			},
			{
				"key": "type",
				"type": "radios",
				"titleMap": titles()
			},
			{
			  "type": "actions",
			  "items": externalItemButtonPanel()
			}
		  ],
		  onSubmit: function (errors, values) {
			  
			// some dummy errors exist here 
			// therefore onSubmit instead of onSubmitValid
			if (errors) {
				console.log('errors: ');
				for (var error in errors) {
					console.log(error);
				}
			}

			hideExternalItemForm(); 
			hideInfoWindow();
			clearItemMarker(); 
			console.log(JSON.stringify(values, null, 4));

			submitExternal(values);
		  }
	  });
}

function externalItemButtonPanel() {
    var buttons = [];
	buttons.push({
		"type": "submit",
		"title": "Import / Update"
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


function submitExternal(values) {
    
	var center = map.getCenter();
    
    showWait(center.lat(), center.lng());

    $.ajax({
     
        // The URL for the request
        url: mapappUrl('/external'),
     
        // The data to send (will be converted to a query string)
        data: values,
     
        // Whether this is a POST or GET request
        type: "POST",
     
        // The type of data we expect back
        dataType : "json",


    })
    .done(function(row) {
        
        console.log("------> SUCCESS")
        console.log(JSON.stringify(row, null, 4));
		if ('rowid' in row) {
			console.log('rowid: '+row.rowid);

			console.log('lat: '+row.lat+', lng: '+row.lng);

			map.setCenter({lat: row.lat, lng: row.lng}); 
			addMarker(row);
			showInfoWindow(row);
		} else { // multiple
			refreshMarkers();
			alert(JSON.stringify(row, null, 4));
		}

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
