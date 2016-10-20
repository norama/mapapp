
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
          }
        },
        "form": [
            "title",
            "description",

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
    var title = $.trim(values['title']).replace("'", "\\'");
    var description = $.trim(values['description']).replace("'", "\\'");
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
    setUserFilter(filter);
}
