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

    var itemMarker = null;

    var infoWindow = null;

    function clearItemMarker() {
        if (itemMarker != null) {
            itemMarker.setMap(null);
            itemMarker = null;
            map.setOptions({ draggableCursor: null });
        }
    }


    var defconf = {
        'center_lat': '-33.8688',
        'center_lng': '151.2195',
        'zoom': '13',
        'mapTypeId': 'ROADMAP'
    };


    function initMap() {
        var initloc = false;
        if ($('#center_lat').val().length == 0) {
            initloc = true;
            $('#center_lat').val(defconf['center_lat']);
            $('#center_lng').val(defconf['center_lng']);
            $('#zoom').val(defconf['zoom']);
            $('#mapTypeId').val(defconf['mapTypeId']);
        }
        var lat = parseFloat($('#center_lat').val());
        var lng = parseFloat($('#center_lng').val());
        var zoom = parseInt($('#zoom').val());
        var mapTypeId = google.maps.MapTypeId[$('#mapTypeId').val()];

        map = new google.maps.Map(document.getElementById('gmap'), {
            center: {lat: lat, lng: lng},
            zoom: zoom,
            mapTypeId: mapTypeId,
			mapTypeControlOptions: {
				position:google.maps.ControlPosition.TOP_CENTER
			}
        });

        infoWindow = new google.maps.InfoWindow();

        addMapClickListener();

        if (initloc) {
            initLocation();
        } else if ($('#item_lat').val().length != 0 && $('#item_lng').val().length != 0) {
             var pos = {
                  lat: parseFloat($('#item_lat').val()),
                  lng: parseFloat($('#item_lng').val())
             };
             setItemMarker(pos);
        }

        var state = $('#state').val();
        if (state == 'init') {
            initLogin();
        } else {
            initAvatar();
            initLogout();
        }
        if ($('#error').val().length > 0) {
            initError();
        }
        initMenu();
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
        var msg = browserHasGeolocation ?
                            'Error: The Geolocation service failed: ' + error.code +" : "+error.message :
                            'Error: Your browser doesn\'t support geolocation.';

        console.warn(msg);
    }

    function setConfOnSubmit() {
        var center = map.getCenter();
        $('#center_lat').val(center.lat());
        $('#center_lng').val(center.lng());
        $('#zoom').val(map.getZoom());
        $('#mapTypeId').val(map.getMapTypeId());
        var pos = itemMarker != null ? itemMarker.getPosition() : null;
        $('#item_lat').val(pos != null ? pos.lat() : '');
        $('#item_lng').val(pos != null ? pos.lng() : '');
        return true;
    }

    function initLogin() {
        var form = $('#loginForm');
        form.attr('action', mapappUrl('/login'))
        $('<input>', {
            id: 'login',
            'class': 'login',
            value: 'Login',
            type: 'submit'
        }).appendTo('#loginForm');
        form.submit(setConfOnSubmit);

        map.controls[google.maps.ControlPosition.TOP_RIGHT].push(form.get(0));
    }

    function initLogout() {
        var form = $('#loginForm');
        form.attr('action', mapappUrl('/logout'))
        $('<input>', {
            id: 'logout',
            'class': 'logout',
            value: 'Logout',
            type: 'submit'
        }).appendTo('#loginForm');
        form.submit(setConfOnSubmit);

        map.controls[google.maps.ControlPosition.RIGHT_TOP].push(form.get(0));
    }

    function initAvatar() {
        var avatar = $('<img/>', {
            'class': 'avatar',
            width: 42,
            height: 42,
            src: $('#user_avatar').val(),
            title: $('#user_name').val()
        });

        map.controls[google.maps.ControlPosition.TOP_RIGHT].push(avatar.get(0));
    }

    function initErrorWithText(text) {
        $('#error').val(text);
        initError();
    }

    function initError() {
        var error = $('<div/>', {

            'class': 'error',
            html: $('#error').val(),
            title: 'Click to hide error.',
            click: function() {
                $(this).remove();
                $('#error').val('');
            }
        });

        map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(error.get(0));
    }

    function initMenu() {

        var menu = $('#menu').append($('<img>', {
            id:'menu-button',
            'class': 'menuButton',
            src:'/img/menu.png',
            title: 'Menu',
            width: '26px',
            height: '26px'
        }));
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(menu.get(0));

        menu.sidr({
            displace: false,
            renaming: false,
            name: 'sidr-main',
            source: '#sidr',
            onOpen: function() {
                clearItemMarker();
                hideItemForm();
                hideFilterForm();
            }
        });

    }

    function showMenu() {
         $.sidr('open', 'sidr-main');
    }

    function hideMenu() {
         $.sidr('close', 'sidr-main');
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
                    position: place.geometry.location
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

    function hideItemForm() {
        $( '#itemMapForm' ).hide();
    }

    function showItemForm() {
        hideMenu();
        hideFilterForm();
        $( '#itemMapForm' ).show();
    }

    function hideFilterForm() {
        $( '#filterMapForm' ).hide();
    }

    function showFilterForm() {
        hideMenu();
        clearItemMarker();
        hideItemForm();
        $( '#filterMapForm' ).show();
    }

    function hideInfoWindow() {
        infoWindow.close();
    }

    function showInfoWindowOnClick(e) {
        if (inProgress()) {
            return;
        }
        clearItemMarker();
        hideItemForm();
        showInfoWindow(e.latLng, e.row);
    }

    function showInfoWindow(pos, row) {
        console.log('lat: '+pos.lat()+', lng: '+pos.lng());
        console.log(JSON.stringify(row, null, 2));
        infoWindow.setContent(format(row));
        infoWindow.setPosition(pos);
        infoWindow.open(map);

        item = {
            title: row.Title.value,
			url: row.URL.value,
            description: row.Description.value,
			details: row.Details.value,
			image: row.Image.value,
            lat: pos.lat(),
            lng: pos.lng()
        }
        // $('#deleteItem').on(
        //     'click',
        //     { 'itemLatLng': pos, 'itemTitle': row.Title.value },
        //     deleteItem);
        $('#editItem').on(
            'click',
            { 'item': item, 'action': 'edit' },
            itemAction);
        $('#deleteItem').on(
            'click',
            { 'item': item, 'action': 'delete' },
            itemAction);
        $('#viewItem').on(
            'click',
            { 'item': item, 'action': 'view' },
            itemAction);
    }

    function format(row) {
        return '<div class="googft-info-window">'+
            '<b>'+row.Title.value+'</b><br/>'+
			
			(row.URL.value.trim() !== "" ? '<a href="'+ row.URL.value.trim() +'" title="'+row.URL.value.trim() +'" target="_blank">Open Home Page</a><br/>' : '')+'<br/>'+
			
			(row.Image.value.trim() !== "" ? '<img src="'+ row.Image.value.trim() +'" style="vertical-align: top; height: 90px"/>' : '')+'<br/><br/>'+
			
            '<p>'+replaceAll(row.Description.value, '\n', '<br/>')+'</p>'+
			
            '<table class="itemEditDelete"><tr>'+
			'<td><img id="viewItem" src="/img/view.png" alt="View" title="View" height="16" width="16"/></td>'+
            ($('#user_id').val() == row.UserId.value ?
                '<td><img id="editItem" src="/img/edit.png" alt="Edit" title="Edit" height="16" width="16"/></td>'+
                '<td><img id="deleteItem" src="/img/delete.png" alt="Delete" title="Delete" height="16" width="16"/></td>' :
                '') +
            '</tr></table>'+
            '</div>';
    }

    function setItemMarkerOnClick(e) {
       if (inProgress()) {
            return;
        }
        $.sidr('close', 'sidr-main');
        setItemMarker(e.latLng);
    }

    function setItemMarker(pos) {
        if (itemMarker == null) {
            createItemMarker(pos);
            if ($('#state').val() != 'init') {
                fillItemForm(emptyItem, 'add');
            } else {
                initLoginForm();
            }
            showItemForm();
        } else {
            itemMarker.setPosition(pos);
        }
        storePosition();
        infoWindow.close();
    }

    function createItemMarker(pos) {
        itemMarker = new google.maps.Marker({
            map: map,
            position: pos,
            title: 'Add new item',
            draggable: true,
            animation: google.maps.Animation.DROP
        });

        itemMarker.addListener('dragend', function() {
            storePosition();
        });
    }

    function addMapClickListener() {
        map.addListener('click', function(e) {
            setItemMarkerOnClick(e);
        });
    }

    function removeMapClickListener() {
        google.maps.event.clearListeners(map, 'click');
    }
