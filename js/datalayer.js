
    // FusionTable ID
    var FTID = '1sShz8nYsrUu4NSG4hb-_vPTK4xCIYbCWNN-fAmJ2';
    
    var FTMARKER_ICON = 'placemark_circle_highlight';
    var MY_FTMARKER_ICON = 'capital_big_highlight';

    var filter = null;

    var ftlayer = null;


	function initFusionTable() {

        var userid = $('#user_id').val();

	    ftlayer = new google.maps.FusionTablesLayer({
	        query: {
	          select: "'Location'",
	          from: FTID
	        },
	        map: map,
	        options: {
	            suppressInfoWindows: true
	        },
	        styles: [{
	        	where: "'UserId' = '" + userid + "'",
	          	markerOptions: {
	            	iconName: MY_FTMARKER_ICON
	          	}
	        }, {
	        	where: "'UserId' NOT EQUAL TO '" + userid + "'",
	          	markerOptions: {
	            	iconName: FTMARKER_ICON
	          	}
	        }]
	    });		

		google.maps.event.addListener(ftlayer, 'click', showInfoWindowOnClick);
	}

	function setFilter(where) {
		filter = where;
		refreshFTLayer();
	}

    // dummy where clause is needed for proper refresh
    // after item has been added
    function refreshFTLayer(pos, row) {
        setTimeout(function() {

        	var where = "'Helper' < " + (1000000 + Math.floor(Math.random() * 100));
        	if (filter !== null) {
        		where += " AND " + filter;
        	}
            
            console.log(where);
		    
            ftlayer.setOptions({
                query: {
                    select: "'Location'",
                    from: FTID,
                    where: where
                }
            }); 

            if (pos !== undefined && row !== undefined) {
                showInfoWindow(pos, row);
            }
        }, 500);
    }