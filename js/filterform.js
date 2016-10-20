
function fillFilterForm() {
    $('#filterForm').empty();
    initFilterForm();
}

function initFilterForm() {

    $('#filterForm').jsonForm({
        schema: {
          title: {
            type: 'string',
            title: 'Title',
            default: ''
          },
          description: {
            type: 'string',
            title: 'Short description',
            default: ''
          },
		  details: {
            type: 'string',
            title: 'Details',
            default: ''
          },
		  types: {
      		type: "array",
      		title: "Types",
      		items: {
        		type: "string",
        		title: "TTT",
        		enum: types()
      		}
    	  }
        },
        "form": [
            "title",
            "description",
			"details",
			{
      			key: "types",
      			type: "checkboxes",
      			titleMap: titles('<img src="'+DEFAULT_ICON_URL+'">&nbsp;Other')
    		},
            {
              "type": "actions",
              "items": filterButtonPanel()
            }
          ],
          onSubmitValid: function (values) {

            hideInfoWindow();
            console.log(values);

            filterItems(values);

          }
      });

}

function filterButtonPanel() {
    var buttons = [];
    buttons.push({
        "type": "submit",
        "title": "Filter"
    });

    buttons.push({
        "type": "button",
        "title": "All",
         "onClick": function (evt) {
            evt.preventDefault();
            fillFilterForm();
            setUserFilter(null);
        }
    });

    buttons.push({
        "type": "button",
        "title": "Close",
        "onClick": function (evt) {
            evt.preventDefault();
            hideFilterForm();
        }
    });

    return buttons;
}

function filterItems(values) {
    var title = norm(values['title']);
    var description = norm(values['description']);
	var details = norm(values['details']);
	var types = values['types'];
	
    var filter = [];
    if (title.length > 0) {
        filter.push("'Title' contains ignoring case '" + title + "'");
    }
    if (title.length > 0 && description.length > 0) {
        filter.push("AND");
    }
    if (description.length > 0) {
        filter.push("'Description' contains ignoring case '" + description + "'");
    }
	if (details.length > 0) {
        filter.push("'Details' contains ignoring case '" + details + "'");
    }
	if (types.length > 0) {
		filter.push(typeFilter(types));
	}
    setUserFilter(filter);
}

function norm(s) {
	return $.trim(s).replace("'", "\\'");
}
