Solstice.YahooUI.Editor.InsertLaTeX = function() {
    return {
        /**
        * @method addInsertLaTeX
        * @param {String} Toolbar group
        * @description Adds handlers necessary for insertlatex, should be called on toolbarLoaded
        */
        addInsertLaTeX: function(group) {
            if (!group) group = 'insertitem';
            this.toolbar.addButtonToGroup({
                type : 'push',
                label: 'Insert LaTeX',
                value: 'insertlatex'
            }, group);
            this._setupInsertLaTeX();
        },

        /**
        * @private
        * @method _setupInsertLaTeX
        * @description Adds handlers necessary for insertlatex
        */
        _setupInsertLaTeX: function() {
            this.toolbar.on('insertlatexClick', this._handleInsertLaTeXClick, this, true);
            this.on('beforeNodeChange', function() {
                var el = this._getSelectedElement(); 
                if (this._isElement(el, 'img')) {
                    if (this._getImageURLKey(el.getAttribute('src'))) {
                        // This is not a definitive test for a LaTeX image
                        if (el.src.match(/&latex=1/)) {
                            this.toolbar.deselectButton(this.toolbar.getButtonByValue('insertimage'));
                            this.toolbar.selectButton(this.toolbar.getButtonByValue('insertlatex'));
                            return false;
                        }
                    }
                }
                return true;
            }, this, true);
            // Double-click event is handled by _handleBeforeEditorDoubleClick
        },

        /**
        * @method cmd_insertlatex
        * @param value Value passed from the execCommand method
        * @description This is an execCommand override method. It is called from execCommand when the execCommand('insertlatex') is used.
        */
        cmd_insertlatex: function(value) {
            return this.cmd_insertimage(value);   
        },

        /**
        * @private
        * @method _handleInsertLaTeXClick
        * @description Handles the opening of the Insert LaTeX Window.
        */
        _handleInsertLaTeXClick: function(obj) {
            if (this.get('limitCommands')) {
                if (!this.toolbar.getButtonByValue('insertlatex')) {
                    return false;
                }
            }
            this.on('afterExecCommand', function() {
                var el = this.currentElement[0],
                    markup = '', alt = '', src = '';
                if (!el) {
                    el = this._getSelectedElement();
                    this.currentElement[0] = el;
                }

                if (this._isElement(el, 'img')) {
                    alt = el.getAttribute('alt');
                    if (key = this._getImageURLKey(el.getAttribute('src'))) {
                        if (obj.attributes) {
                            markup = obj.attributes.latex;
                            src = el.getAttribute('src');
                        } else {
                            Solstice.Remote.run('Solstice', 'loadRichTextImage', {
                                'editor_name' : this.get('name'),
				'key'         : key,
				'callback'    : "Solstice.YahooUI.Editor.loadImageWindow"
                            });
                        }
                    }
                }

                var win = new YAHOO.widget.EditorWindow('insertlatex', {width: this._defaultWindowWidth});
                if (this._windows.insertlatex && this._windows.insertlatex.body) {
                    body = this._windows.insertlatex.body;
                } else {
                    body = this._renderInsertLaTeXWindow();
                }
                win.setHeader(this.toolbar.getButtonByValue('insertlatex').get('label'));
                win.setBody(body);
                win.originalMarkup = markup;
                this.openWindow(win);

                var ns = this.get('name') + '_insertlatex_';
                document.getElementById(ns + 'markup').value = markup;
                document.getElementById(ns + 'alt').value = alt;
                this._updateLaTeXPreview(src);
                this.toolbar.selectButton('insertlatex');
                window.setTimeout(function() {
                    document.getElementById(ns + 'markup').focus();
                }, 50);
            });
        },

        /**
        * @private
        * @method _updateLaTeXPreview 
        * @description Updates attributes of the current preview element
        */
        _updateLaTeXPreview: function(url, key) {
            var ns = this.get('name') + '_insertlatex_';
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
                if (key) {
                    YAHOO.util.Event.addListener(img, 'load', function() {
                        Solstice.Remote.run('Solstice', 'createLaTeXImage', {
                            'preview_key' : key
                        });
                    }, this, true);
                }
                YAHOO.util.Dom.replaceClass(preview, 'yui-insertlatex-loading', 'yui-preview-enabled');
                preview.appendChild(img);
            } else {
                YAHOO.util.Dom.removeClass(preview, 'yui-preview-enabled');
            }
        },

        /**
        * @private
        * @method _updateLaTeXImage  
        * @description Updates attributes of the current image element
        */
        _updateLaTeXImage: function (url, width, height) {
            if (!this._isElement(this.currentElement[0], 'img')) {
                this._createCurrentElement('img');
            }
            var el = this.currentElement[0];
            el.setAttribute('src', url);
            el.setAttribute('width', width);
            el.setAttribute('height', height);
            el.setAttribute('alt', document.getElementById(this.get('name') + '_insertlatex_' + 'alt').value);
            this._updateElementFromToolbar(el);
            this.nodeChange();
            this.closeWindow();
        },

        /**
        * @private
        * @method _handleInsertLaTeXPreview
        * @description Handles the previewing of the Insert LaTeX Window.
        */
        _handleInsertLaTeXPreview: function() {
            var ns = this.get('name') + '_insertlatex_';
            var latex = document.getElementById(ns + 'markup');
            this._clearErrors();
            if (latex.value.length) {
                var preview = document.getElementById(ns + 'preview');
                YAHOO.util.Dom.addClass(preview, 'yui-preview-enabled');
                YAHOO.util.Dom.addClass(preview, 'yui-insertlatex-loading');
                Solstice.Remote.run('Solstice', 'createLaTeXImage', {
                    'editor_name'  : this.get('name'),
                    'latex_markup' : latex.value,
                    'callback'     : "Solstice.YahooUI.Editor.updateLaTeXPreview"
                });
            } else {
                latex.focus();
                this._setError(ns + 'markup_required');
            }
            return false;
        },

        /**
        * @private
        * @method _handleInsertLaTeXSave
        * @description Handles the saving of the Insert LaTeX Window.
        */
        _handleInsertLaTeXSave: function() {
            var ns = this.get('name') + '_insertlatex_';
            var markup = document.getElementById(ns + 'markup');
            this._clearErrors();
            if (!markup.value.length) {
                markup.focus();
                return this._setError(ns + 'markup_required');
            }

            if (markup.value == this.currentWindow.originalMarkup) {
                var el = this.currentElement[0];
                el.setAttribute('alt', document.getElementById(ns + 'alt').value);
                this._updateElementFromToolbar(el);
                this.closeWindow();
            } else {
                Solstice.Remote.run('Solstice', 'createLaTeXImage', {
                    'editor_name'  : this.get('name'),
                    'latex_markup' : markup.value,
                    'callback'     : "Solstice.YahooUI.Editor.updateLaTeXImage"
                });
            }
        },

        /**
        * @private
        * @method _renderInsertLaTeXWindow
        * @description Renders the dialog window content 
        */
        _renderInsertLaTeXWindow: function() {
            var ns = this.get('name');
            var body = document.getElementById(ns + '_insertlatex_window');
            body.className = 'yui-editor-panel-insertlatex';
                
            // Add event handlers
            YAHOO.util.Event.addListener(
                document.getElementById(ns + '_insertlatex_preview_btn'),
                'click', this._handleInsertLaTeXPreview, this, true);
            YAHOO.util.Event.addListener(
                document.getElementById(ns + '_insertlatex_save'),
                'click', this._handleInsertLaTeXSave, this, true);
            YAHOO.util.Event.addListener(
                document.getElementById(ns + '_insertlatex_cancel'),
                'click', this.closeWindow, this, true);

            this._windows.insertlatex = {};
            this._windows.insertlatex.body = body;
            body.style.display = 'none';
            this.get('panel').editor_form.appendChild(body);
            return body;
        }
    };
};

/**
  * @function Solstice.YahooUI.Editor.updateLaTeXPreview
  * @param object JSON object passed from the server-side script 
  * @description Callback for the server-side script used for previewing a LaTeX image. 
  */
Solstice.YahooUI.Editor.updateLaTeXPreview = function(obj) {
    var editor = Solstice.YahooUI.Editor.get(obj.editor_name);
    if (editor) {
        editor._updateLaTeXPreview(obj.url, obj.preview_key);
    }
};

/**
  * @function Solstice.YahooUI.Editor.updateLaTeXImage
  * @param object JSON object passed from the server-side script 
  * @description Callback for the server-side script used for inserting a LaTeX image
    into the editor. 
  */
Solstice.YahooUI.Editor.updateLaTeXImage = function(obj) {
    var editor = Solstice.YahooUI.Editor.get(obj.editor_name);
    if (editor) {
        editor._updateLaTeXImage(obj.url, obj.width, obj.height);
    }
};
