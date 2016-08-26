
    // FusionTable ID
    var FTID = '1sShz8nYsrUu4NSG4hb-_vPTK4xCIYbCWNN-fAmJ2';
    
    var FTMARKER_ICON = 'placemark_circle_highlight';

    var filter = null;


	function initFusionTable() {
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
            
            var where = (filter !== null) ?
            	filter :
            	"ROWID <> '" + Math.floor(Math.random() * 1000000) + "'";
   
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