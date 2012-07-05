/**
 * @fileoverview Functions pertaining to the Solstice::FormInput::FileUpload
 */
Solstice.FileUploadRegistry = new Array();

/**
 * @class Contains the file_upload functionality
 * @constructor
 */
Solstice.FileUpload = function(params) {
    this.name          = params['name'];
    // Number of input widgets to start with; this also acts as a minimum
    this.start_count   = params['start_count'];
    // Maximum number of input widgets to display
    this.max_count     = params['max_count'];
    // The upload form action attribute
    this.upload_url    = params['upload_url'];
    this.disabled      = params['disabled'];
    this.renaming      = params['renaming'];
    this.edit_description = params['edit_description'];
    this.display_remove = true;
    // Customizable labels
    this.add_label     = params['add_label'];
    this.another_label = params['another_label'];
    this.remove_label  = params['remove_label'];
    this.rename_label  = params['rename_label'];
    this.description_label  = params['description_label'];
    // Extends the css with a custom class, optional
    this.class_name    = params['class_name'];
    // An array for previously uploaded files
    this.initialFiles  = params['initial_files'] || [];
    this.default_desc_edit = params['default_desc_edit'];
    this.default_name_edit = params['default_name_edit'];
    this.input_label   = params['input_label'];

    // Internal attributes
    // Tracks the current number of upload widgets present
    this.current_count = 0;
    // Used to generate IDs for the lifetime of the page
    this.id_counter     = 0;
    this.initialized    = false;
    this.is_clean       = params['is_clean'];
    
    this.onChangeHandlers = new Array();
    this.onUploadHandlers = new Array();
    this.onRemoveFileHandlers = new Array();

    Solstice.FileUploadRegistry[params['name']] = this;

    this.initialize();
}

/**
 * Adds an onchange handler to the file upload object 
 * @param {string} fname The name of a function 
 */
Solstice.FileUpload.prototype.addOnChangeEvent = function(fname) {
    this.onChangeHandlers.push(eval(fname));
}

/**
 * Adds an onupload handler to the file upload object 
 * @param {string} fname The name of a function 
 */
Solstice.FileUpload.prototype.addOnUploadEvent = function(fname) {
    this.onUploadHandlers.push(eval(fname));
}

/**
 * Adds a remove file handler to the file upload object 
 * @param {string} fname The name of a function 
 */
Solstice.FileUpload.prototype.addOnRemoveFileEvent= function(fname) {
    this.onRemoveFileHandlers.push(eval(fname));
}

/**
 * Append a new file input widget
 * @type void
 */
Solstice.FileUpload.prototype.addInput = function(file_obj) {
    var upload_document = Solstice.getWindow(this.name).document;
    var file_container = upload_document.getElementById('file_upload_container');

    this.current_count++;
    var id = this.id_counter++;

    var file_input = this._getInputHTML(id, file_obj);
    file_container.appendChild(file_input);

    this.updateAddButton();
}

/**
 * Remove an existing file input widget
 * @param {integer} id Position identifier for the input
 * @type void
 */
Solstice.FileUpload.prototype.removeInput = function(id) {
    var upload_document = Solstice.getWindow(this.name).document;
    var file_container = upload_document.getElementById('file_upload_container');

    // Do not go less than start_count
    if (this.current_count <= this.start_count) {
        return this.resetInput(id);
    }

    // Remove the visible input
    var input = upload_document.getElementById('upload_form_container_' + id);
    if (input) {
        file_container.removeChild(input);
        this.current_count--;
        this.updateAddButton();
    }

    // Remove the hidden inputs
    var hidden_input = document.getElementById(this.name + '_' + id);
    if (hidden_input) {
        var hidden_container = document.getElementById(this.name + '_inputs');
        hidden_container.removeChild(hidden_input);
        hidden_container.removeChild(document.getElementById('rename_'+this.name+'_'+id));
        hidden_container.removeChild(document.getElementById('desc_'+this.name+'_'+id));
    }

    // Run the remove file handlers
    for (i = 0; i < this.onRemoveFileHandlers.length; i++) {
        if (!this.onRemoveFileHandlers[i](this, id, upload_document)) {
            return;
        }
    }
}

/**
 * Display a remove link for the file
 * @param {integer} id Position identifier for the input
 */
Solstice.FileUpload.prototype.displayRemove = function(id) {
    var upload_document = Solstice.getWindow(this.name).document;
    var remove_btn = upload_document.getElementById('file_upload_remove_'+id);
    if (remove_btn) {
        remove_btn.style.display = 'inline';
    }
};

/**
 * Reset an existing file input widget
 * @param {integer} id Position identifier for the input
 * @type {integer} New upload counter ID
 */
Solstice.FileUpload.prototype.resetInput = function(id) {
    var upload_document = Solstice.getWindow(this.name).document;
    var file_container = upload_document.getElementById('file_upload_container');   
 
    var input = upload_document.getElementById('upload_form_container_' + id);
    if (input) {
        var hidden_input = document.getElementById(this.name + '_' + id);
        
        // Update the visible input 
        id = this.id_counter++;
        var new_input = this._getInputHTML(id);
        file_container.replaceChild(new_input, input);
        
        // Remove the hidden input    
        if (hidden_input) {
            hidden_input.parentNode.removeChild(hidden_input);
        }

        // If the uploader supports multiple uploads, ensure that things
        // are still sized correctly
        if (this.max_count > 1) {
            this.updateAddButton();
        }
    }
    // Run the remove file handlers
    for (i = 0; i < this.onRemoveFileHandlers.length; i++) {
        if (!this.onRemoveFileHandlers[i](this, id, upload_document)) {
            return;
        }
    }
    return id;
}

/**
 * Save description input for the uploaded file
 * @param {integer} id Position identifier for the input
 * @type void
 */
Solstice.FileUpload.prototype.saveDescription = function(id) {
    var upload_document = Solstice.getWindow(this.name).document;

    var inputs_div = document.getElementById(this.name+'_inputs');

    var save_desc_input = document.getElementById('desc_'+this.name+'_'+id);
    if (!save_desc_input) {
    }

    // The file description input
    var file_description_input = upload_document.getElementById('file_description_input_' + id);

    var file_description = file_description_input.value;
    file_description = file_description.replace(/^\s*|\s*$/g, '');

    save_desc_input.value = file_description;
}

Solstice.FileUpload.prototype.saveDescriptionByKey = function(e, id) {
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;
    if (code == 13) {
        this.saveDescription(id);
        e.returnValue = false;
        e.cancelBubble = true;
        e.stopPropagation();
        e.preventDefault();
    }
}

/**
 * Save rename input for the uploaded file
 * @param {integer} id Position identifier for the input
 * @type void
 */
Solstice.FileUpload.prototype.saveRename = function(id) {
    var upload_document = Solstice.getWindow(this.name).document;

    var save_rename_input = document.getElementById('rename_'+this.name+'_'+id);

    var file_rename_input = upload_document.getElementById('file_rename_input_' + id);
    var file_rename = file_rename_input.value;
    file_rename = file_rename.replace(/^\s*|\s*$/g, '');

    if (file_rename.length) { 
        save_rename_input.value = file_rename;
    } else {
        file_rename_input.value = save_rename_input.value;
    }
}

Solstice.FileUpload.prototype.saveRenameByKey = function(e, id) {
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;
    if (code == 13) {
        this.saveRename(id);
        e.returnValue = false;
        e.cancelBubble = true;
        e.stopPropagation();
        e.preventDefault();
    }
}

/**
 * Initialize the upload object
 * @type void
 */
Solstice.FileUpload.prototype.initialize = function() {
    if (this.initialized) return;

    var upload_window = Solstice.getWindow(this.name);
    if (upload_window === undefined) {
        Solstice.log('Iframe is not defined: ' + this.name);
        return;
    }

    var body_class = 'file_upload_container';
    if (this.class_name) body_class += (' ' + this.class_name);
    
    // Initialize the basic html for the main iframe
    var upload_document = upload_window.document;
    upload_document.write('<html><head><base id="solstice_base" href="' +
        Solstice.getDocumentBase() + '"/></head><body class="' + body_class + '"><div id="file_upload_body"><div id="file_upload_container"></div><div id="file_upload_add" style="display:none;"></div></div></body></html>');
    upload_document.close();
    
    // Transfer stylesheets into the upload iframe
    var doc_head = upload_document.getElementsByTagName('head')[0];
    
    var links = document.getElementsByTagName('head')[0].getElementsByTagName('link');
    for ( var i = 0, link; link = links[i]; i++ ) {
        if (link.rel == 'stylesheet' && !link.href.match(/yui/)) {
            var stylesheet = upload_document.createElement('link');
            stylesheet.setAttribute('rel', 'stylesheet');
            stylesheet.setAttribute('type', 'text/css');
            stylesheet.setAttribute('href', link.href);
            doc_head.appendChild(stylesheet);
        }
    }

    // Initialize the file input widgets
    this._createInitialInputs();

    this.initialized = true;
    Solstice.Element.show(this.name);
}

/**
 * Reset the upload object 
 * @type void
 */
Solstice.FileUpload.prototype.reset = function() {
    if (!this.initialized) return;

    var upload_document = Solstice.getWindow(this.name).document;
   
    // Remove the visible inputs
    var file_container = upload_document.getElementById('file_upload_container');
    file_container.innerHTML = '';
    
    // Remove the hidden inputs
    var hidden_container = document.getElementById(this.name + '_inputs');
    hidden_container.innerHTML = '';
   
    // Note: This method should NOT reset the id_counter variable!
    this.current_count = 0;

    this._createInitialInputs();
}


Solstice.FileUpload.prototype._createInitialInputs = function() {
    for (var i=0; i<this.initialFiles.length; i++) {
        if (this.current_count < this.max_count) {
            this.addInput(this.initialFiles[i]);
        } 
    }

    for (var j=0; j<this.start_count; j++) {
        if (this.current_count < this.max_count) {
            this.addInput();
        }
    }
    if (!this.start_count) this.updateAddButton();
}


/**
 * Update the state of the add button 
 * @type void
 */
Solstice.FileUpload.prototype.updateAddButton = function() {
    var name = this.name;
    var upload_document = Solstice.getWindow(name).document;
    
    var button_container = upload_document.getElementById('file_upload_add');
    if (this.current_count < this.max_count) {
        var add_btn = button_container.getElementsByTagName('a').item(0);
        if (!add_btn) {
            add_btn = upload_document.createElement('a');
            add_btn.setAttribute('id', 'file_upload_add_button');
            add_btn.setAttribute('href', 'javascript: void(0);');
            Solstice.Event.add(add_btn, 'click', function() {
                Solstice.FileUploadRegistry[name].addInput();
            });
            Solstice.Event.add(add_btn, 'mouseover', function() {
                window.status = ''; return true;
            });
            button_container.appendChild(add_btn);
        }
		add_btn.innerHTML = (this.current_count) ? this.another_label : this.add_label;    
        button_container.style.display = 'block';
    } else {
        button_container.style.display = 'none';
    }
    this._updateSize();
}

/**
 * Return a boolean describing whether an upload is in progress 
 * @return {boolean} 
 */
Solstice.FileUpload.prototype.hasInProgressUpload = function() {
    var upload_document = Solstice.getWindow(this.name).document;
    
    // This could be somewhat inefficient, but we prefer not using a
    // separate counter...The iterator treats the nodes array as a 
    // static list; nodes is a dynamic list, and calling 
    // nodes.length would rebuild the list, so we avoid it
    var nodes = upload_document.getElementsByTagName('div');
    for ( var i = 0, node; node = nodes[i]; i++ ) {
        if (node.className == 'sol_upload_meter_container') return true;
    }
    return false;
}

/**
 * Main handler for completed upload events 
 * @param {integer} id Position identifier for the form 
 */
Solstice.FileUpload.prototype.uploadComplete = function(id) {
    var name = this.name;
    var upload_document = Solstice.getWindow(name).document;
    
    // Remove the temporary text and progress meter
    var file_data_container = upload_document.getElementById('file_data_container_' + id);
    file_data_container.innerHTML = '';

    var upload_form = upload_document.getElementById('upload_form_' + id);
    upload_form.removeChild(upload_document.getElementById('meter_container_' + id));

    var results_document = Solstice.getWindow(name).frames['results_frame_' + id].document;
    
    // Run the onupload handlers
    var return_val = true;
    for (i = 0; i < this.onUploadHandlers.length; i++) {
        return_val = return_val & this.onUploadHandlers[i](this, id, results_document);
    }

    if (return_val) {
        // If upload handlers returned true, or if no handlers were set, update the
        // markup to display the just-uploaded file
        // If there was an error, reset the input and display the error
        var file_key = results_document.getElementById('file_key');
        if (file_key) {
            this._createFileHTML(id, file_data_container, {
                key  : file_key.value,
                name : results_document.getElementById('file_name').value,
                html : results_document.getElementById('file_markup').innerHTML
            });

            if (this.renaming) {
                this.saveRename(id);
            }

        } else {
            var file_err = results_document.getElementById('file_error');
            var err_container;
            if (file_err) {
                err_container = upload_document.createElement('span');
                err_container.className = 'sol_error_notification_text';
                err_container.innerHTML = file_err.value;
            }

            // id is updated by resetInput()
            id = this.resetInput(id);

            if (err_container) {
                file_data_container = upload_document.getElementById('file_data_container_' + id);
                file_data_container.appendChild(err_container);
            }
        }
    } else {
        // Upload handlers returned false, just reset the file upload input
        id = this.resetInput(id);
    }
}

/**
 * Main handler for input change events 
 * @param {integer} id Position identifier for the form 
 */
Solstice.FileUpload.prototype.beginUpload = function(id) {
    var name = this.name;
    var upload_document = Solstice.getWindow(name).document;
    
    var file_input = upload_document.getElementById('file_input_' + id);
    file_input.blur();
    
    var file_name  = file_input.value;
    file_name = file_name.replace(/^\s*|\s*$/g, ''); // Trim whitespace
   
    // Check for invalid input
    if (file_name == '') return;
    var matches = file_name.match(/([^\/\\]+)$/);
    if (!matches) return;

    // Run the onchange handlers
    for (i = 0; i < this.onChangeHandlers.length; i++) {
        if (!this.onChangeHandlers[i](file_input, name)) {
            //this assumption was causing problems with apps setting
            //remove file handlers, so lets not do it anymore
            //this.resetInput(id);
            return;
        }
    }
  
    // Listen for the submitted form's return
    var results_frame = upload_document.getElementById('results_frame_'+id);
    Solstice.Event.add(results_frame, 'load', function() {
        Solstice.FileUpload.uploadComplete(name, id);
    });
    
    // Hide the file input
    file_input.className = 'sol_hidden_input';

    // Add temporary content to the file name span
    var file_data_container = upload_document.getElementById('file_data_container_'+id);
    var new_file_name = Solstice.String.truncate(matches[0], 40);
    file_data_container.innerHTML = '<span style="font-size: .8em;">Uploading file <i>' + new_file_name + '</i></span>';

    // Create the progress meter
    var upload_form = upload_document.getElementById('upload_form_'+id);
    var meter = this._getMeterHTML(id);
    upload_form.appendChild(meter);
  
    Solstice.FileUpload.updateMeter(0, 0, upload_document.getElementById('upload_key_'+id).value, name, id);
     
    upload_form.submit();
}

/**
 * Build the html for a file upload widget 
 * @param {integer} id Position identifier for the form
 * @param {object} Object containing file attributes
 * @private
 */
Solstice.FileUpload.prototype._getInputHTML = function(id, file_obj) {
    var name = this.name;
    var upload_document = Solstice.getWindow(name).document;
    
    var date = new Date();
    var key = date.getTime() + '.' + Math.random() + '.' +
        window.document.location + '.' + Math.random();

    // Create an iframe that will be the target of the upload form
    var results_iframe;
    try {
        results_iframe = upload_document.createElement('<iframe name="results_frame_' + id + '">');
        results_iframe.style.display = 'none';
    }
    catch (e) {
        results_iframe = upload_document.createElement('iframe');
        results_iframe.setAttribute('name', 'results_frame_' + id);
        results_iframe.style.width  = '1px';
        results_iframe.style.height = '1px';
        results_iframe.style.border = '0px';
		results_iframe.style.left = '-1000px';
		results_iframe.style.position = 'absolute';
    }
    results_iframe.setAttribute('id', 'results_frame_' + id);
    results_iframe.setAttribute('src', Solstice.getDocumentBase() + '/content/blank.html');
    results_iframe.setAttribute('tabindex', '-1');

    // Create the upload form
    var upload_form = upload_document.createElement('form');
    upload_form.setAttribute('id', 'upload_form_' + id);
    upload_form.setAttribute('target', 'results_frame_' + id);
    upload_form.setAttribute('method', 'post');
    var upload_action = this.upload_url + '?upload_key=' + key;
    if (this.is_clean) {
        upload_action += "&is_clean=1";
    }
    upload_form.setAttribute('action', upload_action);
    upload_form.setAttribute('enctype', 'multipart/form-data');
    upload_form.setAttribute('encoding', 'multipart/form-data');
    upload_form.setAttribute('accept-charset', 'UTF-8');

    // Create a label for the file input
    var label = upload_document.createElement('label');
    label.className = 'offscreen';
    label.htmlFor = 'file_input_'+id;
    label.style.display = 'none';
    label.innerHTML = this.input_label; 

    // Create the actual file input
    var file_input = upload_document.createElement('input');
    file_input.setAttribute('type', 'file');
    file_input.setAttribute('name', 'file');
    file_input.setAttribute('id', 'file_input_' + id);
    if (this.disabled) {
        file_input.setAttribute('disabled', true);
    }
    file_input.style.verticalAlign = 'middle';
    Solstice.Event.add(file_input, 'keypress', function(e) {
        Solstice.FileUpload.blockInput(e, file_input);
    });
    Solstice.Event.add(file_input, 'paste', function(e) {
        return false;
    });
    Solstice.Event.add(file_input, 'contextmenu', function(e) {
        return false;
    });
    Solstice.Event.add(file_input, 'change', function() {
        Solstice.FileUpload.beginUpload(name, id);
    });

    // Create a hidden input to hold the upload key
    var key_input = upload_document.createElement('input');
    key_input.setAttribute('type', 'hidden');
    key_input.setAttribute('name', 'upload_key');
    key_input.setAttribute('id', 'upload_key_' + id);
    key_input.setAttribute('value', key);

    // Create a span to contain returned file data
    var file_data_container = upload_document.createElement('span');
    file_data_container.setAttribute('id', 'file_data_container_' + id);
 
    upload_form.appendChild(key_input);
    upload_form.appendChild(label);
    upload_form.appendChild(file_input);
    upload_form.appendChild(file_data_container);
    upload_form.appendChild(results_iframe);

    var upload_form_container = upload_document.createElement('div');
    upload_form_container.setAttribute('id', 'upload_form_container_' + id);
    upload_form_container.className = 'sol_upload_form_container';
    upload_form_container.appendChild(upload_form);

    if (file_obj) {
        file_input.className = 'sol_hidden_input';
        this._createFileHTML(id, file_data_container, file_obj);
    }

    return upload_form_container;
}

/**
 * Build the html for an already-uploaded file
 * @param {integer} id Position identifier for the form
 * @param {HTMLElement} Container for the html
 * @param {object} Object containing file attributes
 * @private
 */
Solstice.FileUpload.prototype._createFileHTML = function(id, el, obj) {
    var name = this.name;
    var upload_document = Solstice.getWindow(name).document;

    // File icon and name
    el.innerHTML = obj.html;
    var nodes = el.getElementsByTagName('span');
    for ( var i = 0, node; node = nodes[i]; i++ ) {
        if (node.className == 'sol-file-name') {
            node.setAttribute('id', 'file_name_' + id);
            break;
        }
    }
    var nodes = el.getElementsByTagName('span');
    for ( var i = 0, node; node = nodes[i]; i++ ) {
        if (node.className == 'sol-file-description') {
            node.style.display = 'none';
            node.setAttribute('id', 'desc_' + id);
            break;
        }
    }

    var file_container_div = upload_document.createElement('div');
    file_container_div.className = 'file_wrapper';
    el.appendChild(file_container_div);

    // Create a remove/reset button
    var remove_btn = upload_document.createElement('a');
    remove_btn.setAttribute('id', 'file_upload_remove_' + id);
    remove_btn.className = 'sol_file_upload_remove';
    remove_btn.setAttribute('href', "#");
    remove_btn.style.display = (this.display_remove) ? 'inline' : 'none';
    Solstice.Event.add(remove_btn, 'click', function(ev) {
        Solstice.FileUploadRegistry[name].removeInput(id);
        Solstice.Event.stopEvent(ev);
    });
    remove_btn.appendChild(upload_document.createTextNode(this.remove_label));
    el.appendChild(remove_btn); 

    var inputs_container = document.getElementById(name + '_inputs');

    if (obj.name !== undefined) {
        obj.name = Solstice.String.decodeHTML(obj.name);
    }

    // Create a rename hidden input in the main document
    var rename_input = document.createElement('input');
    rename_input.setAttribute('type', 'hidden');
    rename_input.setAttribute('name', 'rename_'+name+'_'+obj.key);
    rename_input.setAttribute('id', 'rename_'+name+'_'+id);
    rename_input.setAttribute('value', obj.name);
    inputs_container.appendChild(rename_input);

    if (this.renaming) {
        // Expose a rename button
        var rename_btn = upload_document.createElement('a');
        rename_btn.setAttribute('id', 'file_upload_rename_' + id);
        rename_btn.setAttribute('href', "javascript: void(0);");
        Solstice.Event.add(rename_btn, 'click', Solstice.FileUpload.swapName, {id: id, doc: upload_document, uploader: this});
        rename_btn.appendChild(upload_document.createTextNode(this.rename_label));
        el.appendChild(rename_btn);

        // Create a renaming text input
        var start_name;
        var name_class;
        if (obj.name !== undefined && obj.name !== "") {
            start_name = obj.name;
            name_class = 'file_editable';
        }
        else {
            start_name = this.default_name_edit;
            name_class = 'file_editable_empty';
        }
        var rename_input = upload_document.createElement('input');
        rename_input.setAttribute('type', 'text');
        rename_input.setAttribute('id', 'file_rename_input_' + id);
        rename_input.setAttribute('name', obj.key);
        rename_input.setAttribute('value', obj.name);
        rename_input.style.width = '220px';
        rename_input.style.display = 'none';
        Solstice.Event.add(rename_input, 'blur', function() {
            Solstice.FileUploadRegistry[name].saveRename(id);
        });
        Solstice.Event.add(rename_input, 'keypress', function(e) {
            Solstice.FileUploadRegistry[name].saveRenameByKey(e, id);
        });
        file_container_div.appendChild(rename_input);
    }

    // Create a hidden desc input in the main document
    var desc_input = document.createElement('input');
    desc_input.setAttribute('type', 'hidden');
    desc_input.setAttribute('name', 'desc_'+name+'_'+obj.key);
    desc_input.setAttribute('id', 'desc_'+name+'_'+id);
    inputs_container.appendChild(desc_input);

    if (this.edit_description) {
        var has_description = false;
        if (obj.description !== undefined && obj.description !== "") {
            has_description = true;
        }

        if (obj.description === undefined) {
            obj.description = "";
        }
        desc_input.setAttribute('value', Solstice.String.decodeHTML(obj.description));

        obj.description = obj.description.replace("&gt;", ">");
        
        var file_description_container = upload_document.getElementById('desc_' + id);
        if (file_description_container) {
            file_description_container.style.display = 'none';
        }

        var start_description;
        var description_class;
        if (obj.description !== undefined && obj.description !== "") {
            start_description = obj.description.replace(/\n/g, "<br />");
            description_class = "file_editable";
        }
        else {
            start_description = this.default_desc_edit;
            description_class = "file_editable_empty";
        }

        // Create a description textarea
        var description_container = upload_document.createElement('div');
        description_container.setAttribute('id', 'description_input_container_'+id);
        description_container.className = 'sol_upload_form_description_container';
        var description_input = upload_document.createElement('textarea');
        description_input.setAttribute('id', 'file_description_input_' + id);
        description_input.setAttribute('name', obj.key);
        description_input.className = 'file_description_input';
        description_input.value = Solstice.String.decodeHTML(obj.description);
        description_input.style.width = '95%';
        description_input.style.height = '60px';
        Solstice.Event.add(description_input, 'blur', function() {
            Solstice.FileUploadRegistry[name].saveDescription(id);
        });
        description_container.appendChild(description_input);

        if (!has_description) {
            var display_start_desc = upload_document.createElement('a');
            var add_desc_span = upload_document.createElement('span');
            add_desc_span.innerHTML = start_description;
            display_start_desc.setAttribute('href', 'javascript:void(0)');
            display_start_desc.setAttribute('id', 'desc_display_'+id);
            display_start_desc.className = description_class;
            Solstice.Event.add(display_start_desc, 'click', Solstice.FileUpload.swapDesc, {id: id, doc: upload_document, uploader: this});

            description_container.style.display = 'none';
            display_start_desc.appendChild(add_desc_span);
            el.appendChild(display_start_desc);
        }

        el.appendChild(description_container);
    }

    // Create a hidden input in the main document to hold the 
    // file key
    var hidden_input = document.getElementById(name + '_' + id);
    if (!hidden_input) {
        hidden_input = document.createElement('input');
        hidden_input.setAttribute('type', 'hidden');
        hidden_input.setAttribute('name', name);
        hidden_input.setAttribute('id', name + '_' + id);
        document.getElementById(name + '_inputs').appendChild(hidden_input);
    }
    hidden_input.setAttribute('value', obj.key);
    this._updateSize();
}

/**
 * Build the html for a file upload progress meter 
 * @param {integer} id Position identifier for the form
 * @private
 */
Solstice.FileUpload.prototype._getMeterHTML = function(id) {
    var upload_document = Solstice.getWindow(this.name).document;

    var upload_key = upload_document.getElementById('upload_key_' + id).value;

    var meter_container = upload_document.createElement('div');
    meter_container.setAttribute('id', 'meter_container_' + id);
    meter_container.className = 'sol_upload_meter_container';

    var meter_progress_bar = upload_document.createElement('div');
    meter_progress_bar.setAttribute('id', 'meter_progress_bar_' + upload_key);
    meter_progress_bar.className = 'sol_upload_meter_progress_bar';

    var meter_percentage = upload_document.createElement('div');
    meter_percentage.setAttribute('id', 'meter_percentage_' + upload_key);
    meter_percentage.className = 'sol_upload_meter_percentage';

    meter_container.appendChild(meter_progress_bar);
    meter_container.appendChild(meter_percentage);

    return meter_container;
}

/**
 * Update the size of the file upload object
 * @private
 * @param {Integer} Count of the number of attempts to update.
 * @type void
 */
Solstice.FileUpload.prototype._updateSize = function(attempts) {
    if (!attempts) attempts = 0;
    var iframe = document.getElementById(this.name);
    var height = iframe.contentWindow.document.getElementById('file_upload_body').offsetHeight;
    if (height) {
        if (height < 30) height = 30;
        iframe.style.height = height + 'px';
    } else {
        // Bug 10745: IE8/Win7 requires a delay to find the height of the iframe
        if (attempts < 2 ) {
            var name = this.name;
            window.setTimeout(function() {
                Solstice.FileUploadRegistry[name]._updateSize(++attempts);
            }, 500);
        }
    }
}

/**
 * External functions for Solstice.FileUpload
 */

Solstice.FileUpload.updateMeter = function(total_size, curr_size, upload_key, name, id) {
    var upload_document = Solstice.getWindow(name).document; 
    
    var progress_meter = upload_document.getElementById('meter_progress_bar_' + upload_key);
    if (!progress_meter) return;

    var percentage = parseInt((curr_size / total_size)*100);
    if (isNaN(percentage)) percentage = 0;

    if(!progress_meter.old_percentage || progress_meter.old_percentage < percentage){
        progress_meter.style.width = percentage + '%';

        var progress_percent = upload_document.getElementById('meter_percentage_' + upload_key);
        progress_percent.innerHTML =  percentage + '%';

        progress_meter.old_percentage = percentage;
    }
  
    if (percentage < 100) {
        //Tell the meter to update
        Solstice.FileUpload._meterCheck(upload_key, name, id);
    }else{
        //tell the meter this upload is finished
        Solstice.FileUpload._meterFinish(upload_key);
    }
}

Solstice.FileUpload._updating_meters = new Object;

Solstice.FileUpload._meterCheck = function (upload_key, name, id) {
    if( !Solstice.FileUpload._updating_meters[upload_key] ){
        Solstice.FileUpload._updating_meters[upload_key] = {
            'upload_key': upload_key,
            'frame': name,
            'position': id
        };
    }

    Solstice.FileUpload._meterServerQuery();
}

Solstice.FileUpload._meterServerQuery = function () {
    if(!Solstice.FileUpload._update_running){
        Solstice.FileUpload._update_running = true;
        window.setTimeout("Solstice.Remote.run('Solstice', 'upload_meter', Solstice.FileUpload._updating_meters, { 'timeout' : 0 });", 1000);
    }
}

Solstice.FileUpload._meterFinish = function (upload_key) {
    delete Solstice.FileUpload._updating_meters[upload_key];
}


Solstice.FileUpload.initialize = function(name) {
    var uploader = Solstice.FileUploadRegistry[name];
    if (uploader) {
        uploader.initialize();
    }
}

Solstice.FileUpload.reset = function(name) {
    var uploader = Solstice.FileUploadRegistry[name];
    if (uploader) {
        uploader.reset();
    }
}

Solstice.FileUpload.beginUpload = function(name, id) {
    var uploader = Solstice.FileUploadRegistry[name];
    if (uploader) {
        uploader.beginUpload(id);
    }
}

Solstice.FileUpload.uploadComplete = function(name, id) {
    var uploader = Solstice.FileUploadRegistry[name];
    if (uploader) {
        uploader.uploadComplete(id);
    }
}

Solstice.FileUpload.getFilenameFromPath = function(path) {
    var nodes = (path.search(/\\/) != -1) ? path.split(/\\/) : path.split("/");
    return (nodes.length) ? nodes[nodes.length - 1] : path; 
}

Solstice.FileUpload.blockInput = function(e, file_input) {
    if (e.keyCode == 9) { // tab
        return true;
    } else if (e.keyCode == 13) { // enter
        file_input.click();
        e.returnValue = true; // IE ?
        return true;
    } else {
        if (e.preventDefault) e.preventDefault(); // Mozilla
        e.returnValue = false; // IE
        return false;
    }
}

Solstice.FileUpload.swapName = function(ev, input) {
    var upload_document = input.doc;
    var id = input.id;
    var ul = input.uploader;

    upload_document.getElementById('file_upload_rename_'+id).style.display = 'none'; 
    upload_document.getElementById('file_name_'+id).style.display = 'none';
    upload_document.getElementById('file_rename_input_'+id).style.display = 'inline';

    ul._updateSize();
}

Solstice.FileUpload.swapDesc = function(ev, input) {
    var upload_document = input.doc;
    var id = input.id;
    var ul = input.uploader;

    upload_document.getElementById('desc_display_'+id).style.display = 'none';
    upload_document.getElementById('description_input_container_'+id).style.display = 'block';

    ul._updateSize();
}

