

function initForm() {
      $('#addItemForm').jsonForm({
        schema: {
          title: {
            type: 'string',
            title: 'Title',
            required: true
          },
          description: {
            type: 'string',
            title: 'Description'
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
              }
              ,
              {
                "type": "button",
                "title": "Cancel",
                "onClick": function (evt) {
                  	evt.preventDefault();
                  	$( '#mapform' ).hide();      
                }
              }
              ]
            }
          ],
          onSubmitValid: function (values) {
          
            console.log(values);
            addItem(values);

        }
      });

      //$('#addItemForm').find('label').addClass('control-label');	
}

function addItem(values) {

}