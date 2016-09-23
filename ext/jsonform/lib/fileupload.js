var DEF_MAX_FILESIZE = 999000;

function fileuploadTemplate() {
    return '<div class="image-panel"> \n' +
        '<input type="hidden" id="<%= id %>" name="<%= node.name %>" value="<%= node.value %>">' +
//        '<% if (node.title && !elt.notitle) { %>' +
//            '<label class="control-label" for="<%= node.id %>"><%= node.title %></label>' +
//        '<% } %>' +
        '<div id="<%= id %>Div" class="panel-body"> \n' +
        '<!-- The fileinput-button span is used to style the file input field as button --> \n' +
		'<table><tr><td> \n' +
        '<span class="btn btn-success fileinput-button" title="(gif, jpg, png), max 1MB"> \n' +
        '    <i class="glyphicon icon-white icon-upload"></i> \n' +
        '    <span>Load file...</span> \n' +
        '    <!-- The file input field used as target for the file upload widget --> \n' +
        '    <input id="fileupload" type="file" name="files[]" > \n' +
        '</span> \n' +
		'</td><td> \n' +
		'<div id="deleteDiv"></div> \n' +
		'</td></tr></table> \n' +
        '<br> \n' +
        '<!-- The global progress bar --> \n' +
        '<div id="progress"></div> \n' +
        '<!-- The container for the uploaded files --> \n' +
        '<div id="files" class="files"></div> \n' +
        '</div> \n' +
    '</div>';
}

function renderFileupload(formNode) {
    'use strict';
    // Change this to the location of your server-side upload handler:
    var url = window.location.protocol + '//' + window.location.host + '/fileupload';
    
    var maxFileSize = formNode.schemaElement.maxFileSize;
    if (maxFileSize === undefined) {
        maxFileSize = DEF_MAX_FILESIZE;
    }
   
    $('#fileupload').fileupload({
        url: url,
        dataType: 'json',
        autoUpload: true,
        acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
        maxFileSize: maxFileSize,
        // Enable image resizing, except for Android and Opera,
        // which actually support image resizing, but fail to
        // send Blob objects via XHR requests:
        disableImageResize: /Android(?!.*Chrome)|Opera/
            .test(window.navigator.userAgent),
        previewMaxWidth: 100,
        previewMaxHeight: 100,
        previewCrop: false
    }).on('fileuploadadd', function (e, data) {      
        
		_add(data, formNode);

    }).on('fileuploadstart', function (e) {
        
    }).on('fileuploadprocessalways', function (e, data) {
        
		_always(data, formNode);
		
    }).on('fileuploadprogressall', function (e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
		_progress(progress);
    }).on('fileuploaddone', function (e, data) {

		_done(data, formNode, true);

    }).on('fileuploadfail', function (e, data) {
        $.each(data.files, function (index) {
            var error = $('<span class="text-danger"/>').text('File upload failed.');
            $(data.context.children()[index])
                .append('<br>')
                .append(error);
        });
		$('.form-actions input[type=submit]').attr('disabled', false);
    }).prop('disabled', !$.support.fileInput)
        .parent().addClass($.support.fileInput ? undefined : 'disabled');  
	
	
	var readonly = formNode.schemaElement.readonly;
	var value = formNode.value;
	if (readonly) {
		$('#' + formNode.id + 'Div').empty();
		if (value) {
			$('#' + formNode.id + 'Div').append(_preview(value));
		}
	} else if (value) {
		var file = {
			url: value,
			name: 'Image',
			preview: _preview(value)
		}
		var data = {
			files: [ file ],
			result: {
				files: [ file ]
			}
		};
		_add(data, formNode);
		_always(data, formNode);
		_progress(100);
		_done(data, formNode, false);
	} 
}

function _preview(url) {
	return '<img src="' + url + '" style="height:100px;">';
}

function deleteFile(file, url, button) {
    
    $("body").css("cursor", "progress");
    button.addClass('disabled');

    $.ajax({
     
        // The URL for the request
        url: url + '/delete',
     
        // The data to send (will be converted to a query string)
        data: { 'url': file.url },
     
        // Whether this is a POST or GET request
        type: "POST",
     
        // The type of data we expect back
        dataType : "json",


    })
    .done(function( json ) {
        
        console.log("------> SUCCESS")
        console.log(JSON.stringify(json, null, 2));

        button.remove();

    })
    .fail(function( xhr, status, errorThrown ) {
        
        console.log( "Error: " + errorThrown );
        console.log( "Status: " + status );
        console.dir( xhr );
		
		button.removeClass('disabled');
    })
    .always(function() {
        $("body").css("cursor", "auto");
    });

}

function _add(data, formNode) {
	
	$('.form-actions input[type=submit]').attr('disabled', true);
	
	if ($('#deleteFile').length > 0) {
		var delButton = $('#deleteFile');
		var file = {
			'url': delButton.attr('data-url')
		};
		var url = delButton.data().url;

		$('#' + formNode.id).val('');
		deleteFile(file, url, delButton);
	} 

	$('#deleteDiv').empty();
	$('#progress').empty();
	$('#progress').append('<div class="progress"><div class="bar bar-info"></div></div>');
	$('#files').empty();
	data.context = $('<div/>').appendTo('#files');
	$.each(data.files, function (index, file) {
		var node = $('<p/>')
				.append($('<span/>').text(file.name));
		node.appendTo(data.context);
	});    
}

function _always(data, formNode) {
	var file = data.files[0],
		node = $(data.context.children()[0]);
	if (file.preview) {
		node
			.prepend('<br>')
			.prepend(file.preview);
	}
	if (file.error) {
		node
			.append('<br>')
			.append($('<span class="text-danger"/>').text(file.error));
	}
	data.context.find('button')
		.text('')
		.append($('<i class="glyphicon icon-upload"></i>'))
		.append($('<span> Upload</span>'))
		.prop('disabled', !!data.files.error);
}

function _progress(percent) {
	$('#progress .bar').css(
        'width',
        percent + '%'
    );
}

function _done(data, formNode, realDelete) {
	var file = data.result.files[0];
	if (file.url) {
		$('#' + formNode.id).val(file.url);
		var link = $('<a>')
			.attr('target', '_blank')
			.prop('href', file.url);
		$(data.context.children()[0])
			.wrap(link);
		var delButton = $('<button id="deleteFile"/>').addClass('btn delete');
		delButton.on('click', function (e) {
			e.preventDefault();
			var $this = $(this),
				data = $this.data();

			$('#' + formNode.id).val('');
			
			$('#progress').empty();
    		$('#files').empty();
			
			if (realDelete) {
				deleteFile(file, data.url, $this);
			} else {
				delButton.remove();
			}

		});
		delButton
			.append($('<i class="glyphicon icon-trash"></i>'))
			.append($('<span> Delete</span>'))
		$('#deleteDiv')
			.append(delButton.data(data).attr('data-type', 'DELETE')
					.attr('data-url', file.url));
	} else if (file.error) {
		$('#' + formNode.id).val('');
		var error = $('<span class="text-danger"/>').text(file.error);
		$(data.context.children()[0])
			.append('<br>')
			.append(error);
	}
	$('.form-actions input[type=submit]').attr('disabled', false);
}