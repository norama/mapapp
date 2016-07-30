    //
    // https://developers.google.com/maps/documentation/javascript/examples/places-searchbox
    // https://developers.google.com/maps/documentation/javascript/examples/map-geolocation
    //

    // This example adds a search box to a map, using the Google Place Autocomplete
    // feature. People can enter geographical searches. The search box will return a
    // pick list containing a mix of places and predicted search terms.

    // This example requires the Places library. Include the libraries=places
    // parameter when you first load the API. For example:
    // <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

    // FusionTable ID
    var FTID = '10c-6Dlo_vM54czB5e4kzTJoc6BoUciLTYbfHixH7';

    var itemMarker = null;

    function initMap() {

        map = new google.maps.Map(document.getElementById('gmap'), {
            center: {lat: -33.8688, lng: 151.2195},
            zoom: 13,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        addMapClickListener();

        initLocation();
        initAutocomplete();
        initFusionTable();
    }

    function initLocation() {

        // Try HTML5 geolocation.
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
              var pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
              };

              setItemMarker(pos);
              
              map.setCenter(pos);
            }, function(error) {
                handleLocationError(true, error);
            });
        } else {
            // Browser doesn't support Geolocation
            handleLocationError(false, '');
        }
    }


    function handleLocationError(browserHasGeolocation, error) {
        var infoWindow = new google.maps.InfoWindow({map: map});
        infoWindow.setPosition(map.getCenter());
        infoWindow.setContent(browserHasGeolocation ?
                            'Error: The Geolocation service failed: ' + error.code +" : "+error.message :
                            'Error: Your browser doesn\'t support geolocation.');
    }

    function initAutocomplete() {

        // Create the search box and link it to the UI element.
        var input = document.getElementById('pac-input');
        var searchBox = new google.maps.places.SearchBox(input);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

        // Bias the SearchBox results towards current map's viewport.
        map.addListener('bounds_changed', function() {
            searchBox.setBounds(map.getBounds());
        });

        var markers = [];

        // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.
        searchBox.addListener('places_changed', function() {
            var places = searchBox.getPlaces();

            if (places.length == 0) {
                return;
            }

            // Clear out the old markers.
            markers.forEach(function(marker) {
                marker.setMap(null);
            });
            markers = [];

            // For each place, get the icon, name and location.
            var bounds = new google.maps.LatLngBounds();
            places.forEach(function(place) {
                if (!place.geometry) {
                    console.log("Returned place contains no geometry");
                    return;
                }
                var icon = {
                    url: place.icon,
                    size: new google.maps.Size(71, 71),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17, 34),
                    scaledSize: new google.maps.Size(25, 25)
                };

                var marker = new google.maps.Marker({
                    map: map,
                    icon: icon,
                    title: place.name,
                    position: place.geometry.location,
                    draggable: true
                });


                // Create a marker for each place.
                markers.push(marker);

                if (place.geometry.viewport) {
                    // Only geocodes have viewport.
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }
            });
            map.fitBounds(bounds);
        });

    }

    function hideMapform() {
        var mapform = document.getElementById('mapform');
        mapform.style.display = 'none';
    }

    function showhideMapform() {
        var mapform = document.getElementById('mapform');
        mapform.style.display = mapform.style.display == 'none' ? 'block' : 'none';
        if (mapform.style.display == 'block') {
            storePosition();
        }
    }

    function initFusionTable() {
        var layer = new google.maps.FusionTablesLayer({
            query: {
              select: '\'Location\'',
              from: FTID
            }
        });
        layer.setMap(map);
    }

    function setItemMarkerOnClick(e) {
        setItemMarker(e.latLng);
    }

    function setItemMarker(pos) {
        if (itemMarker == null) {
            createItemMarker(pos);
        } else {
            itemMarker.setPosition(pos);
        }
    }

    function createItemMarker(pos) {
        itemMarker = new google.maps.Marker({             
            map: map,
            position: pos,
            title: 'Add new item',
            draggable: true,
            animation: google.maps.Animation.DROP
        });

        itemMarker.addListener('click', function() { 
            showhideMapform(); 
        });

        itemMarker.addListener('dragend', function() { 
            storePosition();
        });
    }

    function storePosition() {
        if (itemMarker == null) {
            return;
        }
        var lat = itemMarker.getPosition().lat();
        var lng = itemMarker.getPosition().lng();
        console.log(lat + ", " + lng);

        document.getElementById('lat').value = lat;
        document.getElementById('lng').value = lng;
    }

    function addMapClickListener() {        
        map.addListener('click', function(e) { 
          setItemMarkerOnClick(e); 
          hideMapform(); 
        });
    }

    function removeMapClickListener() {
        google.maps.event.clearListeners(map, 'click');
    }