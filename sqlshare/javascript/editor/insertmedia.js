Solstice.YahooUI.Editor.InsertMedia = function() {
    return {
        /**
        * @method addInsertMedia
        * @param {String} Toolbar group
        * @description Adds the media toolbar button, should be called on toolbarLoaded
        */
        addInsertMedia: function(group) {
            if (!group) group = 'insertitem';
            this.toolbar.addButtonToGroup({
                type : 'push',
                label: 'Insert YouTube Video', 
                value: 'insertmedia'
            }, group);
            this._setupInsertMedia();
        },

        /**
        * @private
        * @method _setupInsertMedia
        * @description Adds handlers necessary for insertmedia
        */
        _setupInsertMedia: function() {
            this.toolbar.on('insertmediaClick', this._handleInsertMediaClick, this, true);
            this.on('beforeNodeChange', function() {
                if (this._isObjectElement(this._getSelectedElement())) {
                    this.toolbar.deselectButton(this.toolbar.getButtonByValue('insertimage'));
                    this.toolbar.selectButton(this.toolbar.getButtonByValue('insertmedia'));
                    return false;
                }
                return true;
            }, this, true);
            this.on('beforeEditorDoubleClick', function(obj) {
                var el = YAHOO.util.Event.getTarget(obj.ev);
                if (this._isObjectElement(el)) {
                    this._setCurrentEvent(obj.ev);
                    this.currentElement[0] = el;
                    this.toolbar.fireEvent('insertmediaClick', {
                        type: 'insertmediaClick', target: this.toolbar
                    });
                    this.fireEvent('afterExecCommand', {
                        type: 'afterExecCommand', target: this
                    });
                    return false;
                }
                return true;
            }, this, true); 
        },

        /**
        * @private
        * @method _isObjectElement
        * @param {HTMLElement}
        * @description Returns true if element is an object placeholder 
        */
        _isObjectElement: function(el) {
            return (this._isElement(el, 'img') &&
                YAHOO.util.Dom.hasClass(el, 'yui-tmp-object')) ? true : false;
        },

        /**
        * @method cmd_insertmedia
        * @param value Value passed from the execCommand method
        * @description This is an execCommand override method. It is called from execCommand when the execCommand('insertmedia') is used.
        */
        cmd_insertmedia: function(value) {
            var el = this._getSelectedElement();
            if (this._isObjectElement(el)) {
                this.currentElement[0] = el;
                return [false];
            }
            return this.cmd_insertimage(value);
        },

        /**         
        * @private
        * @method _handleInsertMediaClick
        * @description Handles the opening of the Insert Media Window.
        */
        _handleInsertMediaClick: function() {
            if (this.get('limitCommands')) {
                if (!this.toolbar.getButtonByValue('insertmedia')) {
                    return false;
                }
            }
            this.on('afterExecCommand', function() {
                var el = this.currentElement[0],
                    markup = '';
                if (!el) {
                    el = this._getSelectedElement();
                    this.currentElement[0] = el;
                }

                if (this._isObjectElement(el) && el.getAttribute('id')) {
                    markup = this._capturedObjectHTML[el.getAttribute('id')];
                }

                var win = new YAHOO.widget.EditorWindow('insertmedia', {width: this._defaultWindowWidth});
                if (this._windows.insertmedia && this._windows.insertmedia.body) {
                    body = this._windows.insertmedia.body;
                } else {
                    body = this._renderInsertMediaWindow();
                }
                win.setHeader(this.toolbar.getButtonByValue('insertmedia').get('label'));
                win.setBody(body);
                this.openWindow(win);

                var ns = this.get('name') + '_insertmedia_';
                document.getElementById(ns + 'markup').value = markup;
                this._updateMediaPreview(markup);
                this.toolbar.selectButton('insertmedia');
                window.setTimeout(function() {
                    document.getElementById(ns + 'markup').focus();
                }, 50);
            });
        },

        /**
        * @private
        * @method _renderInsertMediaWindow
        * @description Renders the dialog window content 
        */
        _renderInsertMediaWindow: function() {
            var ns = this.get('name') + '_insertmedia_';
            var body = document.getElementById(ns + 'window');
            body.className = 'yui-editor-panel-insertmedia';

            // Add event handlers
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'previewbutton'), 'click',
                function(ev) {
                    this._clearErrors();
                    var markup = document.getElementById(ns + 'markup');
                    if (markup.value.length) {
                        this._updateMediaPreview(markup.value);
                    } else {
                        markup.focus();
                        this._setError(ns + 'markup_required');
                    }
                    YAHOO.util.Event.stopEvent(ev);
                }, this, true);
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'save'),
                'click', this._handleInsertMediaSave, this, true);
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'cancel'),
                'click', this.closeWindow, this, true);

            this._windows.insertmedia = {};
            this._windows.insertmedia.body = body;
            body.style.display = 'none';
            this.get('panel').editor_form.appendChild(body);
            return body;
        },

        /**
        * @private
        * @method _handleInsertMediaSave
        * @description Handles the saving of the Insert Media Window.
        */
        _handleInsertMediaSave: function() {
            var ns = this.get('name') + '_insertmedia_';
            var content = document.getElementById(ns + 'markup');
            this._clearErrors();
            if (html = this._validateMediaSource(content.value)) {
                var el = this.currentElement[0];
                if (this._isObjectElement(el)) {
                    if (key = el.getAttribute('id')) {
                        this._capturedObjectHTML[key] = html;
                    }
                } else {
                    if (!this._isElement(el, 'img')) {
                        this._createCurrentElement('img');
                        el = this.currentElement[0];
                    }    
                    var placeholder = this._captureIncomingObjectHTML(html);
                    el.setAttribute('id', 'yui-object-' + this._capturedObjectHTML.counter);
                    YAHOO.util.Dom.replaceClass(el, 'yui-img', 'yui-tmp-object');
                }
                el.setAttribute('src', this._getMediaPreviewURL(html));

                var xy = this._getObjectXY(html);
                el.style.width = xy[0] + 'px';
                el.style.height = xy[1] + 'px';

                this.nodeChange();
                this.closeWindow();

            } else {
                content.focus();
                if (content.value.length) {
                    this._setError(ns + 'markup_invalid');
                } else {
                    this._setError(ns + 'markup_required');
                }
            }
        },

        /**
        * @private
        * @method _updateMediaPreview
        * @param {String} HTML
        * @description Updates the preview container of the Insert Media Window.
        */
        _updateMediaPreview: function(markup) {
            var ns = this.get('name') + '_insertmedia_';
            var preview = document.getElementById(ns + 'preview');

            // Remove any img tags that exist
            if (img = preview.getElementsByTagName('img')[0]) {
                img.parentNode.removeChild(img);
            } 

            if (html = this._validateMediaSource(markup)) {
                this._clearErrors();
                if (url = this._getMediaPreviewURL(html)) {
                    var img = document.createElement('img');
                    img.setAttribute('src', url); 
                    YAHOO.util.Event.addListener(img, 'error', function(ev) {
                        var img = YAHOO.util.Event.getTarget(ev);
                        img.parentNode.removeChild(img);
                        YAHOO.util.Dom.removeClass(preview, 'yui-preview-enabled');
                    }, this, true);
                    preview.appendChild(img);
                    YAHOO.util.Dom.addClass(preview, 'yui-preview-enabled');
                }
            } else {
                if (markup.length) {
                    this._clearErrors();
                    this._setError(ns + 'markup_invalid');
                }
                YAHOO.util.Dom.removeClass(preview, 'yui-preview-enabled');
            }
        },

        /**         
        * @private
        * @method _validateMediaSource
        * @description Validates the media embed source
        * param {String} HTML source
        * returns {String|null} Valid markup, null otherwise
        */
        _validateMediaSource: function(str) {
            if (!str) {
                return null;
            }
            var matches = str.match(/(<object[\s\S]*?<\/object>)/i);
            if (YAHOO.util.Lang.isArray(matches)) {
                var html = matches.shift();
                // This test is pretty weak, the more robust server-side
                // filter will scrub anything that is not legit.
                if (html.match(this._YouTubeRegExp)) {
                    return html;
                }
            }
            return null;
        },

        /**         
        * @private
        * @method _getMediaPreviewURL
        * @description returns a preview URL for the media object 
        * param {String} HTML source
        * returns {URL} URL
        */
        _getMediaPreviewURL: function(html) {
            if (html.match(this._YouTubeRegExp)) {
                return 'http://img.youtube.com/vi/' + RegExp.$1 + '/0.jpg';
            }
            return null;
        },

        /**
         * @private
         * @RegExp _YouTubeRegExp
         * @description RegExp for a valid YouTube URL
         */
        _YouTubeRegExp: /http:\/\/www.youtube(?:-nocookie)?.com\/v\/([\w-]{11})/
    };
}
