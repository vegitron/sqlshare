Solstice.YahooUI.Editor.InsertImage = function() {
    return {
        /**         
        * @private
        * @method _handleInsertImageClick
        * @description Handles the opening of the Insert Image Window.
        */
        _handleInsertImageClick: function() {
            if (this.get('limitCommands')) {
                if (!this.toolbar.getButtonByValue('insertimage')) {
                    return false;
                }
            }
            this.on('afterExecCommand', function() {
                var el = this.currentElement[0], src = '', alt = '';
                if (!el) {
                    el = this._getSelectedElement();
                    this.currentElement[0] = el;
                }

                if (this._isElement(el, 'img') && !this._isObjectElement(el) &&
                    el.src != this.get('blankimage')) {
                    src = el.getAttribute('src');
                    alt = el.getAttribute('alt');
                }
                this.toolbar.selectButton('insertimage');

                var win = new YAHOO.widget.EditorWindow('insertimage', {width: this._defaultWindowWidth});
                if (this._windows.insertimage && this._windows.insertimage.body) {
                    body = this._windows.insertimage.body;
                } else {
                    body = this._renderInsertImageWindow();
                }
                win.setHeader(this.toolbar.getButtonByValue('insertimage').get('label'));
                win.setBody(body);
                this.openWindow(win);

                var ns = this.get('name') + '_insertimage_';
                document.getElementById(ns + 'uploadform').style.display = (src) ? 'none' : 'block';
                document.getElementById(ns + 'urlform').style.display = (src) ? 'block' : 'none';
                document.getElementById(ns + 'url').value = src;
                document.getElementById(ns + 'alt').value = alt;
                this._updateImagePreview(src);

                // gecko is being stupid, create a new iframe each time
                if (this.browser.gecko) { 
                    var uploadCont = document.getElementById(ns + 'upload_container');
                    var iframe = uploadCont.firstChild.cloneNode(true);
                    uploadCont.replaceChild(iframe, uploadCont.firstChild);
                }
                // Create a new uploader each time :(
                var uploader = new Solstice.FileUpload({
                    name        : ns + 'upload',
                    upload_url  : Solstice.getDocumentBase() + 'richtexteditor_upload.cgi',
                    start_count : 1,
                    max_count   : 1,
                    class_name  : 'richtext_insertimage_upload_body',
                    is_clean    : false,
                    remove_label: document.getElementById(ns + 'replace').innerHTML
                });
                uploader.addOnChangeEvent("Solstice.YahooUI.Editor.get('" + this.get('name') + "')._validateImageUpload");
                uploader.addOnUploadEvent("Solstice.YahooUI.Editor.get('" + this.get('name') + "')._handleAfterImageUpload");
            });
        },

        /**
        * @private
        * @method _renderInsertImageWindow
        * @description Renders the dialog window content 
        */
        _renderInsertImageWindow: function() {
            var ns = this.get('name') + '_insertimage_';
            var body = document.getElementById(ns + 'window');
            body.className = 'yui-editor-panel-insertimage';

            var uploadform = document.getElementById(ns + 'uploadform');
            var urlform = document.getElementById(ns + 'urlform');

            // Add event handlers
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'urlbutton'),
                'click', function(ev) {
                    uploadform.style.display = 'none';
                    urlform.style.display = 'block';
                    this._clearErrors();
                    YAHOO.util.Event.stopEvent(ev);
                }, this, true);
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'uploadbutton'),
                'click', function(ev) {
                    urlform.style.display = 'none';
                    uploadform.style.display = 'block';
                    this._clearErrors();
                    YAHOO.util.Event.stopEvent(ev);
                }, this, true);

            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'previewbutton'),
                'click', function(ev) {
                    this._clearErrors();
                    var url = document.getElementById(ns + 'url');
                    if (url.value.length) {
                        this._updateImagePreview(url.value);
                    } else {
                        url.focus();
                        this._setError(ns + 'url_required');
                    }
                    YAHOO.util.Event.stopEvent(ev);
                }, this, true);

            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'save'),
                'click', this._handleInsertImageSave, this, true);
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'cancel'),
                'click', this.closeWindow, this, true);

            this._windows.insertimage = {};
            this._windows.insertimage.body = body;
            body.style.display = 'none';
            this.get('panel').editor_form.appendChild(body);
            return body;
        },

        /**
        * @private
        * @method _validateImageUpload_
        * @description Validates the file upload input
        * @param {Object} HTML input element
        * @param {String} File upload input name
        * @returns {boolean} True if the upload file is an image, false otherwise
        */
        _validateImageUpload: function(input, name) {
            var editor_name = name.replace(/_insertimage_upload$/, '');
            var editor = Solstice.YahooUI.Editor.get(editor_name);
            var file_name = input.value;
            if (file_name.match(/(gif|png|jpg|jpeg)$/i)) {
                editor._clearErrors();
                return true;
            } else {
                editor._setError(name + '_invalid');
                return false;
            }
        },

        /**
        * @private
        * @method _handleAfterImageUpload 
        * @description Handles the previewing of the Insert Image Window.
        * @param {Object} File upload object
        * @param {String} File input element id
        * @param {HTMLElement} File data container document
        */
        _handleAfterImageUpload: function(uploader, id, filedoc) {
            var name = uploader.name;
            var editor_name = name.replace(/_insertimage_upload$/, '');
            var editor = Solstice.YahooUI.Editor.get(editor_name);
            if (url = filedoc.getElementById('file_url')) {
                var url_id = name.replace(/_upload$/, '_url');
                document.getElementById(url_id).value = url.value;
                editor._updateImagePreview(url.value);
                return true;

            } else if (err = filedoc.getElementById('file_error')) {
                document.getElementById(name + '_error').innerHTML = err.value;
                editor._setError(name + '_error');

            }
            return false;
        },

        /**
        * @private
        * @method _updateImagePreview 
        * @description Updates attributes of the current preview element
        */
        _updateImagePreview: function(url) {
            this._clearErrors();
            var ns = this.get('name') + '_insertimage_';
            var preview = document.getElementById(ns + 'preview');
            
            // Remove any img tags that exist
            if (img = preview.getElementsByTagName('img')[0]) {
                img.parentNode.removeChild(img);
            }

            if (url) {
                var img = document.createElement('img');
                img.setAttribute('src', url);
                img.setAttribute('alt', document.getElementById(ns + 'alt').value);
                this._updateElementFromToolbar(img);
                YAHOO.util.Event.addListener(img, 'error', function(ev) {
                    var img = YAHOO.util.Event.getTarget(ev);
                    img.parentNode.removeChild(img);
                    YAHOO.util.Dom.removeClass(preview, 'yui-preview-enabled');
                    this._setError(ns + 'url_invalid');
                }, this, true);
                preview.appendChild(img);
                YAHOO.util.Dom.addClass(preview, 'yui-preview-enabled');
            } else {
                YAHOO.util.Dom.removeClass(preview, 'yui-preview-enabled');
            }
        },

        /**
        * @private
        * @method _handleInsertImageSave
        * @description Handles the saving of the Insert Image Window.
        */
        _handleInsertImageSave: function() {
            var ns = this.get('name') + '_insertimage_';
            var url = document.getElementById(ns + 'url');
            this._clearErrors();
            if (!url.value.length) {
                url.focus();
                return this._setError(ns + 'url_required');
            }

            if (!this._isElement(this.currentElement[0], 'img')) {
                this._createCurrentElement('img');
            }
            var el = this.currentElement[0];
            el.setAttribute('src', url.value);
            el.setAttribute('alt', document.getElementById(ns + 'alt').value);
            this._updateElementFromToolbar(el);
            this.closeWindow();
        }
    };
}
