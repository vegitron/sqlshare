/**
* @constructor
* @class SolsticeEditor
* @extends YAHOO.widget.Editor
* @param {String/HTMLElement} el The textarea element to turn into an editor.
* @param {Object} attrs Object liternal containing configuration parameters.
*/
YAHOO.widget.SolsticeEditor = function(el, attrs) {
    YAHOO.widget.SolsticeEditor.superclass.constructor.call(this, el, attrs);
};

YAHOO.lang.extend(YAHOO.widget.SolsticeEditor, YAHOO.widget.Editor, {
    /**
    * @method init
    * @description The SolsticeEditor class' initialization method
    */
    init: function(el, config) {
        config.handleSubmit = false; // Handled by Solstice
        config.extracss = this._extraCSS + config.extracss;
        var useDefaultToolbar = false;
        if (!config.toolbar) {
            config.toolbar = this._defaultToolbar;
            useDefaultToolbar = true;
        }
        // Default width/height
        if (!config.width) config.width = '100%';    
        if (!config.height) config.height = '240px';

        // Add support for custom buttons
        YAHOO.util.Lang.augmentObject(this, Solstice.YahooUI.Editor.CreateLink(), true);
        YAHOO.util.Lang.augmentObject(this, Solstice.YahooUI.Editor.InsertImage(), true);
        YAHOO.util.Lang.augmentObject(this, Solstice.YahooUI.Editor.InsertLaTeX(), true);
        YAHOO.util.Lang.augmentObject(this, Solstice.YahooUI.Editor.InsertMedia(), true);
        YAHOO.util.Lang.augmentObject(this, Solstice.YahooUI.Editor.InsertTable(), true);
        YAHOO.util.Lang.augmentObject(this, Solstice.YahooUI.Editor.InsertEntity(), true);
        YAHOO.util.Lang.augmentObject(this, Solstice.YahooUI.Editor.InsertIcon(), true);
        YAHOO.util.Lang.augmentObject(this, Solstice.YahooUI.Editor.SpellCheck(), true);

        // Superclass init
        YAHOO.widget.SolsticeEditor.superclass.init.call(this, el, config);

        // Set up custom button handlers 
        this.on('toolbarLoaded', function() {
            this._setupEditSourceMode();
            if (config.plainTextMode) {
                this.editPlainTextMode = true;
                this.toolbar.collapse(true);
                this.on('editorContentLoaded', function() {
                    this.execCommand('editsource');
                }, this, true);
            }
            if (this.toolbar.getButtonByValue('inserttable')) {
                this._setupInsertTable();
            }
            if (btn = this.toolbar.getButtonByValue('insertlatex')) {
                if (config.hasLaTeX) {
                    this._setupInsertLaTeX();
                } else {
                    this.toolbar.disableButton('insertlatex');
                    btn.set('title', 'Not Installed');
                    btn.on('beforeDisabledChange', function(){return false;});
                }
            }
            if (this.toolbar.getButtonByValue('insertmedia')) {
                this._setupInsertMedia();
            }
            if (btn = this.toolbar.getButtonByValue('spellcheck')) {
                if (config.hasSpellcheck) {
                    this._setupSpellCheck();
                } else {
                    this.toolbar.disableButton('spellcheck');
                    btn.set('title', 'Not Installed');
                    btn.on('beforeDisabledChange', function(){return false;});
                }
            }
            if (useDefaultToolbar) {
                this.addInsertEntity();
            }
        }, this, true);

        // Handling unsaved content
        this.unsavedContentMessage = config.unsavedMessage;
        this.on('editorContentLoaded', function() {
            // Set the original content into a scalar that will not be modified
            var html = this.getEditorHTML();
            html = this._reinsertObjectHTML(html);
            html = this.cleanHTML(html);
            this.originalHTML = html;

            // Add a specialized class to the editor body
            YAHOO.util.Dom.addClass(this._getDoc().body, 'sol_uc');

            // If width to 100% above, we need to set it to px width
            if (this.get('width') == '100%') {
                this.set('width', this.get('element').clientWidth + 'px');
            }

            // Custom src for blankimage
            this.set('blankimage', Solstice.getDocumentBase() + 'images/yui_editor/blankimage.jpg');
        }, this, true);

        this.on('afterRender', function() {
            this.removeListener('windowinsertimageClose', this._handleInsertImageWindowClose);
            this.on('beforeEditorDoubleClick', this._handleBeforeEditorDoubleClick, this, true);
            this.on('beforeOpenWindow', this._handleBeforeWindowOpen, this, true);
            this.on('closeWindow', this._handleWindowClose, this, true);
        });
    },

    /**
   * @method show
   * @description This method needs to be called if the Editor was hidden (like in a TabView or Panel). It is used to reset the editor after being in a container that was set to display none.
    */
    show: function() {
        YAHOO.widget.SolsticeEditor.superclass.show.call(this);
        if (this.editSourceMode) {
            this.execCommand('editsource');    
        }
        if (this.spellChecking) {
            this.execCommand('spellcheck');
        }
        this.get('iframe').setStyle('position', '');
    }, 

    /**
    * @method setEditorHTML
    * @param {String} incomingHTML The html content to load into the editor
    * @description Overrides the superclass method to handle source mode 
    */
    setEditorHTML: function(incomingHTML) {
        if (this.editSourceMode) {
            var html = this._formatHTMLSource(this._cleanIncomingHTML(incomingHTML));
            this.get('element').value = html;
        } else {
            YAHOO.widget.SolsticeEditor.superclass.setEditorHTML.call(this, incomingHTML);            
        }
    }, 

    /**
    * @method getEditorHTML 
    * @description Overrides the superclass method to handle source mode 
    */
    getEditorHTML: function() {
        if (this.editSourceMode) {
            return this._unformatHTMLSource(this.get('element').value);
        } else {
            return YAHOO.widget.SolsticeEditor.superclass.getEditorHTML.call(this);
        }
    },

    /**
    * @method saveHTML 
    * @description Overrides the superclass method to handle solstice-specific markup 
    */
    saveHTML: function() {
        var html = this.getEditorHTML();
        if (this.spellChecking) {
            html = this._removeSpellCheckTags(html);
        }
        html = this._reinsertObjectHTML(html);
        // This is compensating for some sloppy yui editor cleanup in FF
        html = html.replace(/font-family:\s?yui-tmp;/ig, '');
        // Unicode line separator
        html = html.replace(/\u2028/g, '<br/>');
        // TODO: this is copied straight from the superclass saveHTML(),
        // watch for a future yui version which may allow us to
        // avoid this.
        html = this.cleanHTML(html);
        if (this._textarea) {
            this.get('element').value = html;
        } else {
            this.get('element').innerHTML = html;
        }
        if (this.get('saveEl') !== this.get('element')) {
            var out = this.get('saveEl');
            if (YAHOO.util.Lang.isString(out)) {
                out = YAHOO.util.Dom.get(out);
            }
            if (out) {
                if (out.tagName.toLowerCase() === 'textarea') {
                    out.value = html;
                } else {
                    out.innerHTML = html;
                }
            }
        } 
        return html;
    },

    /**
    * @method contentModified
    * @description Describes whether the current editor html differs from the originally-loaded html
    * @returns {boolean}
    */
    contentModified: function() {
        var html = this.getEditorHTML();
        html = this._removeSpellCheckTags(html);
        html = this._reinsertObjectHTML(html);
        html = this.cleanHTML(html);
        return (this.originalHTML == html) ? false : true;
    },

    /**
    * @method reset 
    * @description Resets the editor to its initial state 
    */
    reset: function() {
        this.setEditorHTML(this.originalHTML);
        this.toolbar.resetAllButtons();
    },

    /**
    * @method moveWindow
    * @description Overrides the superclass to add different behavior for Solstice dialogs
    */
    moveWindow: function(force) {
        if (!this.currentWindow) {
            return false;
        }
        var name = this.currentWindow.name;
        if (name == 'spellcheck' || name == 'createlink') {
            // Let superclass method determine the position
            YAHOO.widget.SolsticeEditor.superclass.moveWindow.call(this, force);
            // Slightly correct the y-position
            var xy = this.get('panel').cfg.getProperty('xy');
            xy[1] += 10;
            this.get('panel').cfg.setProperty('xy', xy);

            // Display the window "pointer"
            this.get('panel').editor_knob.style.display = 'block';
        } else { 
            // Hide the window "pointer"
            this.get('panel').editor_knob.style.display = 'none';

            if (name.match(/^insert(?:image|latex|media|table)$/)) {
                // Centered in viewport
                this.get('panel').center();
            } else {
                YAHOO.widget.SolsticeEditor.superclass.moveWindow.call(this, force);
            }
        }
    },

    /**
    * @private
    * @property {String} _extraCSS
    * @description Extra CSS for the editor area
    */
    _extraCSS: "@import url(\"" + Solstice.getDocumentBase() + "styles/user_content.css\");\n" +
        ".yui-tmp-object {border: 1px dashed #444; display: block; padding-bottom: 34px; background: #DDD url("+ Solstice.getDocumentBase() +"images/yui_editor/youtube32.gif) no-repeat bottom left;}\n" +
        ".yui-spellcheck {color: #EE0000; font-weight: bold; text-decoration: underline; cursor: pointer;} ",

    /**
    * @private
    * @method _setupResize
    * @description Overrides the superclass method to handle resizing both the editor and textarea. 
    */
    _setupResize: function() {
        if (this.get('resize')) {
            var config = {};
            YAHOO.util.Lang.augmentObject(config, this._resizeConfig); //Break the config reference
            config.status = false;
            this.resize = new YAHOO.util.Resize(this.get('element_cont').get('element'), config);
            this.resize.on('resize', function(args) {
                var h = args.height,
                    th = (this.toolbar.get('element').clientHeight + 2),
                    dh = 0;
                if (this.dompath) {
                    dh = (this.dompath.clientHeight + 1);
                }
                var newH = (h - th - dh);
                // update textarea
                this.setStyle('width', args.width + 'px');
                this.setStyle('height', newH + 'px');
                // update editor
                this.set('width', args.width + 'px');
                this.set('height', newH + 'px');
                YAHOO.util.Dom.setStyle(name + '_container', 'width', args.width + 'px');
            }, this, true);
        }
    },

    /**
    * @object capturedObjectHTML
    * @description An object to hold <object> tags
    */
    _capturedObjectHTML: {
        counter : 0
    },

    /**
    * @private
    * @method _cleanIncomingHTML
    * param {String} HTML 
    * @description Overrides the superclass method in order to capture <object> tags
    */
    _cleanIncomingHTML: function(html) {
        html = this._captureIncomingObjectHTML(html);
        return YAHOO.widget.SolsticeEditor.superclass._cleanIncomingHTML.call(this, html);
    },

    /**
    * @private
    * @method _captureIncomingObjectHTML 
    * @param {String} HTML 
    * @description Replaces <object> tags with a placeholder
    * returns {String} Cleaned HTML
    */
    _captureIncomingObjectHTML: function(html) {
        var matches = html.match(/<object[\s\S]*?<\/object>/ig);
        if (YAHOO.util.Lang.isArray(matches)) {
            for (var i = 0; i < matches.length; i++) {
                // Increment before making the ID
                this._capturedObjectHTML.counter++;
                var id = 'yui-object-' + this._capturedObjectHTML.counter;

                // Stash the <object> html
                this._capturedObjectHTML[id] = matches[i];

                var url = null;
                if (object_html = this._validateMediaSource(matches[i])) {
                    url = this._getMediaPreviewURL(object_html);
                }
                if (!url) {
                    url = Solstice.getDocumentBase() + 'images/yui_editor/media_placeholder.gif';
                }
                var placeholder = '<img class="yui-tmp-object" id="'+id+'" src="'+url+'"';
                var xy = this._getObjectXY(matches[i]);
                placeholder += ' style="width: '+xy[0]+'px; height: '+xy[1]+'px;"';
                placeholder += '/>';
                html = html.replace(matches[i], placeholder);
            }
        }
        return html;
    },

    /**
    * @private
    * @method _reinsertObjectHTML
    * @description Replace placeholder html with actual <object> markup
    * @param {String} HTML
    */
    _reinsertObjectHTML: function(html) {
        var matches = html.match(/(<img[^>]*class="?yui-tmp-object"?[^>]*>)/ig);
        if (YAHOO.util.Lang.isArray(matches)) {
            for (var i = 0; i < matches.length; i++) {
                var id = null, object_html = '';
                if (matches[i].match(/id="?(yui-object-[\d]+)"?/)) {
                    id = RegExp.$1;
                    object_html = this._capturedObjectHTML[id] || '';
                    object_html = object_html.replace(/[\n\r]/g, ' ');
                }
                html = html.replace(matches[i], object_html);
            }
        }
        return html;
    },

    /**
    * @private
    * @method _getObjectXY
    * @description Calculate required size for the media placeholder 
    * @param {String} HTML
    * @returns {Array} [horizontal, vertical]
    */
    _getObjectXY: function(html) {
        var x = 0, y = 0; 
        if (html.match(/width="?(\d{1,3})"?/)) {
            x = parseInt(RegExp.$1);
        }
        if (html.match(/height="?(\d{1,3})"?/)) {
            y = parseInt(RegExp.$1);
        }
        if (!x || !y) {
            x = 320; y = 240;
        }
        return [x, y];
    },

    /**
    * @Boolean editSourceMode
    * @description Specifies whether the editor is in html source mode
    */
    editSourceMode: false, 

    /**
    * @method cmd_editsource
    * @description This is an execCommand override method. It is called from execCommand when the execCommand('editsource') is used.    
    *   This code is a modified version of 
    *   http://developer.yahoo.com/yui/examples/editor/code_editor.html
    */
    cmd_editsource: function(value) {
        if (this.editSourceMode) {
            this.editSourceMode = false;
            this.toolbar.set('disabled', false);
            this.setEditorHTML(this._unformatHTMLSource(this.get('element').value));
            if (!this.browser.ie) {
                this._setDesignMode('on');
            }
            YAHOO.util.Dom.removeClass(this.get('iframe').get('element'), 'yui-editor-hidden');
            YAHOO.util.Dom.addClass(this.get('element'), 'yui-editor-hidden');
            this.show();
            this._focusWindow();
        } else {
            var html = this.getEditorHTML();
            this.get('element').value = this._formatHTMLSource(this.cleanHTML(this._reinsertObjectHTML(html)));
            this.editSourceMode = true;
            YAHOO.util.Dom.addClass(this.get('iframe').get('element'), 'yui-editor-hidden');
            YAHOO.util.Dom.removeClass(this.get('element'), 'yui-editor-hidden');
            this.toolbar.resetAllButtons();
            this.toolbar.set('disabled', true);
            this.toolbar.getButtonByValue('editsource').set('disabled', false);
            this.toolbar.selectButton('editsource');
            this.dompath.innerHTML = 'Editing HTML Code';
            this.hide();
        }
        return [false];   
    },

    /**
    * @private
    * @method _formatHTMLSource 
    * @description Format HTML source for readability
    * @param {String} Editor content
    */
    _formatHTMLSource: function(html) {
        // Add a newline before these opening tags
        html = html.replace(/(<(?:table|div|img|hr|ul|ol|h1|h2|h3|h4|h5|h6)[^>]*>)/ig, "\n$1");
        // Add a newline after these opening tags
        html = html.replace(/(<(?:table|thead|tbody|tfoot|tr|td|div|img|br|hr|ul|ol)[^>]*>)/ig, "$1\n");
        // Add a newline after these closing tags
        html = html.replace(/(<\/(?:table|thead|tbody|tfoot|tr|td|div|p|hr|ul|ol|li|h1|h2|h3|h4|h5|h6)>)/ig, "$1\n");
        return html;
    },

    /**
    * @private
    * @method _unformatHTMLSource 
    * @description Removes whitespace formatting from HTML source
    * @param {String} Editor content
    */
    _unformatHTMLSource: function(html) {
        html = html.replace(/\n(<(?:table|div|img|hr|ul|ol|h1|h2|h3|h4|h5|h6)[^>]*>)/ig, "$1");
        html = html.replace(/(<(?:table|thead|tbody|tfoot|tr|td|div|img|br|hr|ul|ol)[^>]*>)\n/ig, "$1");
        html = html.replace(/(<\/(?:table|thead|tbody|tfoot|tr|td|div|p|hr|ul|ol|li|h1|h2|h3|h4|h5|h6)>)\n/ig, "$1");
        return html;
    },

    /**
    * @private
    * @method _setupEditSourceMode
    * @description Sets up source mode
    */
    _setupEditSourceMode: function() {
        // By default the RTE places the textarea inside the Editors
        // parent, but we need it to be a sibling of the iframe.
        this.on('afterRender', function() {
            var wrapper = this.get('editor_wrapper');
            wrapper.appendChild(this.get('element'));
            YAHOO.util.Dom.addClass(this.get('element'), 'yui-editor-textarea');
            this.setStyle('width', this.get('width'));
            this.setStyle('height', this.get('height'));
            this.setStyle('visibility', '');
            this.setStyle('top', '');
            this.setStyle('left', '');
            this.setStyle('position', '');
            this.addClass('yui-editor-hidden');
        }, this, true);

        // No node changes while in source mode
        this.on('beforeNodeChange', function() {
            return (this.editSourceMode) ? false : true;
        }, this, true);
    },

    /**
    * @Boolean editPlainTextMode
    * @description Specifies whether the editor is in plain-text mode
    */
    editPlainTextMode: false,

    /**
    * @method _loadImageWindow 
    * @param {Object} Attributes for the file
    * @description Updates attributes for the Image or LaTeX dialog when opened 
    */
    _loadImageWindow: function (attributes) {
        if (this.currentWindow) {
            // Window is already open, update it with attributes
            if (this.currentWindow.name == 'insertlatex') {
                var ta = document.getElementById(this.get('name') + '_insertlatex_markup');
                if (attributes.is_latex) {
                    this.currentWindow.originalMarkup = attributes.latex;
                    ta.value = attributes.latex;
                    this._updateLaTeXPreview(attributes.url);
                }
                ta.focus();
            } else {
                // insertimage updates... none
            }
        } else {
            // Open the window, and pass the attributes to it
            var evtName = (attributes.is_latex) ? 'insertlatexClick' : 'insertimageClick';
            this.toolbar.fireEvent(evtName, { type: evtName, target: this.toolbar, attributes: attributes });
            this.fireEvent('afterExecCommand', { type: 'afterExecCommand', target: this });
        }
    },

    /**
    * @method _getImageURLKey 
    * @param {String} url
    * @description Returns a key from a valid Solstice file URL
    * @returns {String} File key
    */
    _getImageURLKey: function (url) {
        if (url && url.match(/file_download\.cgi\?ptkt=([a-zA-Z0-9]*)/)) {
            return RegExp.$1;
        }
        return;
    },

    /**
    * @private
    * @method _createWindowToolbar
    * @description Default toolbar to be used for the Item Windows.
    * @param {HTMLElement} Container element for the toolbar
    * @return {Object} YAHOO.widget.Toolbar
    */
    _createWindowToolbar: function (el) {
        var cfg = {};
        YAHOO.util.Lang.augmentObject(cfg, this._defaultWindowToolbarConfig); //Break the config reference

        var toolbar = new YAHOO.widget.Toolbar(el, cfg);
        toolbar.on('buttonClick', function(o) {
            var value = o.button.value;
            if (o.button.menucmd) {
                value = o.button.menucmd;
            }
            if (value == 'right' || value == 'left' || value == 'inline' || value == 'block') {
                // Text flow buttons
                toolbar.deselectButton('left');
                toolbar.deselectButton('block');
                toolbar.deselectButton('inline');
                toolbar.deselectButton('right');
                toolbar.selectButton(value);
            } else if (value == 'align') {
                toolbar.selectButton(value);
                toolbar.currentAlign = o.button.value.replace(/^align/, ''); 
            } else if (value == 'bordersize') {
                toolbar.selectButton(value);
                toolbar.currentBorderSize = o.button.value;
                if (parseInt(o.button.value, 10) > 0) {
                    toolbar.enableButton('bordertype');
                    toolbar.enableButton('bordercolor');
                } else {
                    toolbar.disableButton('bordertype');
                    toolbar.disableButton('bordercolor');
                }
            } else if (value == 'bordertype') {
                toolbar.selectButton(value);
                toolbar.currentBorderType = o.button.value;
            }
            // Update window preview
            if (this.currentWindow.name == 'insertimage' ||
                this.currentWindow.name == 'insertlatex') {
                var preview = document.getElementById(this.get('name') + '_' + this.currentWindow.name + '_preview');
                if (img = preview.getElementsByTagName('img')[0]) {
                    this._updateElementFromToolbar(img);
                }
            }
        }, this, true);
        toolbar.on('colorPickerClicked', function(o) {
           toolbar.currentBorderColor = o.color; 
        }, this, true);
        
        toolbar.getButtonByValue('align').getMenu().beforeShowEvent.subscribe(this._resetButtonMenuPosition, toolbar.getButtonByValue('align'), true);
        toolbar.getButtonByValue('bordersize').getMenu().beforeShowEvent.subscribe(this._resetButtonMenuPosition, toolbar.getButtonByValue('bordersize'), true);
        toolbar.getButtonByValue('bordertype').getMenu().beforeShowEvent.subscribe(this._resetButtonMenuPosition, toolbar.getButtonByValue('bordertype'), true);

        return toolbar;
    },

    /**
    * @private
    * @method _resetButtonMenuPosition 
    * @description Update the zIndex for the button menu.
    */
    _resetButtonMenuPosition: function(ev) {
        this.getMenu().cfg.setProperty('zindex', 5000); //Re Adjust the overlays zIndex.. not sure why
    },

    /**
    * @private
    * @method _updateElementFromToolbar
    * @description Update the passed element, using attributes from the toolbar.
    * @param {HTMLElement} current HTML element 
    */
    _updateElementFromToolbar: function(el) {
        if (el) {
            var toolbar = this._defaultWindowToolbar;
            
            // Padding
            var padding = toolbar.getButtonByValue('padding').get('label') + 'px';

            el.align = '';
            el.style.margin = '';
            if (this._isElement(el, 'img')) {
                // Text flow
                el.style.display = '';
                if (toolbar.isSelected('left')) {
                    el.align = 'left';
                    el.style.margin = padding;
                } else if (toolbar.isSelected('right')) {
                    el.align = 'right';
                    el.style.margin = padding;
                } else if (toolbar.isSelected('block')) {
                    el.style.display = 'block';
                    el.align = 'center';
                    el.style.marginRight = 'auto';
                    el.style.marginLeft = 'auto';
                    el.style.marginTop = padding;
                    el.style.marginBottom = padding;
                }
            } else {
                // Alignment
                if (toolbar.currentAlign != 'none') {
                    el.align = toolbar.currentAlign;
                    if (toolbar.currentAlign == 'center') {
                        el.style.marginRight = 'auto';
                        el.style.marginLeft = 'auto';
                    }
                }
            
                // Block element padding
                el.style.marginTop = padding;
                el.style.marginBottom = padding;
            }

            // Border
            var borderStr = '';
            var bsize = parseInt(toolbar.currentBorderSize, 10);
            if (bsize > 0) { 
                borderStr = bsize + 'px ';
                borderStr += (toolbar.currentBorderType) ? toolbar.currentBorderType : 'solid'; 
                borderStr += ' #';
                borderStr += (toolbar.currentBorderColor) ? toolbar.currentBorderColor : '000000'; 
            }
            el.style.border = borderStr;
            if (this._isElement(el, 'table')) {
                // For tables, apply the border and padding styles to all cells 
                // and use border-collapse
                el.style.borderCollapse = 'collapse';
                var rows = el.rows;
                for (var i = 0; i < rows.length; i++) {
                    for (var j = 0; j < rows[i].cells.length; j++) {
                        var cell = rows[i].cells[j];
                        cell.style.border = borderStr;
                        cell.style.padding = padding;
                    }
                }
            }
        }
    },

    /**
    * @private
    * @method _handleBeforeEditorDoubleClick
    * @description Determines if double-clicked element is a Solstice image, and if so loads attributes for it. 
    */
    _handleBeforeEditorDoubleClick: function(obj) {
        var el = YAHOO.util.Event.getTarget(obj.ev);
        if (this.spellChecking) {
            return false;
        }
        if (this._isElement(el, 'img')) {
            if (key = this._getImageURLKey(el.getAttribute('src'))) {
                Solstice.Remote.run('Solstice', 'loadRichTextImage', {
                    'editor_name' : this.get('name'),
		    'key'         : key,
		    'callback'    : "Solstice.YahooUI.Editor.loadImageWindow"
                });
                this._setCurrentEvent(obj.ev);
                this.currentElement[0] = el;
                this.nodeChange();
                return false;
            }
        }
        return true;
    },
    
    /**
    * @private
    * @method _handleBeforeWindowOpen
    * @description Update a toolbar when a Dialog window is opened, using attributes from the currently-selected element.
    * @param {Obj} current Window 
    */
    _handleBeforeWindowOpen: function(obj) {
        var win = obj.win;
        // Reset all error containers
        this._clearErrors(win);        

        // Add the toolbar for css properties, if this window requires it
        if (!this._defaultWindowToolbar) {
            this._defaultWindowToolbar = this._createWindowToolbar();
        }
        var toolbar = this._defaultWindowToolbar;

        var tbarCont = YAHOO.util.Dom.getElementsByClassName('yui-editor-panel-toolbar', 'div', win.body)[0];
        if (tbarCont) { 
            tbarCont.appendChild(toolbar.get('element'));

            toolbar.resetAllButtons();
            toolbar.currentAlign = 'none';
            toolbar.currentBorderSize = null;
            toolbar.currentBorderType = null;
            toolbar.currentBorderColor = null;
            // Update the toolbar with the current element attributes
            if (el = this.currentElement[0]) {
                if (this._isElement(el, 'img')) {
                    // Text flow buttons
                    if ((el.align == 'right') || (el.align == 'left')) {
                        toolbar.selectButton(el.align);
                    } else if (el.align == 'center') {
                        toolbar.selectButton('block');
                    } else if (el.style.display == 'block' || el.style.display == 'inline') {
                        toolbar.selectButton(el.style.display);
                    }
                } else {
                    // Alignment button
                    var align = el.align || 'none';
                    this._updateMenuChecked('align', 'align' + align, toolbar);
                    toolbar.currentAlign = align;
                    var label = align.charAt(0).toUpperCase() + align.substr(1);
                    toolbar.getButtonByValue('align').set('label', label);
                }

                // Padding button
                var padding = '0';
                if (el.style.marginTop) {
                    padding = parseInt(el.style.marginTop, 10);
                } else if (this._isElement(el, 'table')) {
                    padding = el.getAttribute('cellPadding') || 0; 
                }
                toolbar.getButtonByValue('padding').set('label', '' + padding);

                // Border buttons
                var bsize = '0', btype = 'solid', bcolor = '000000';
                if (el.style.borderLeftWidth) {
                    bsize = parseInt(el.style.borderLeftWidth, 10);
                } else if (this._isElement(el, 'table')) {
                    bsize = el.getAttribute('border') || 0;
                }
                if (el.style.borderLeftStyle) {
                    btype = el.style.borderLeftStyle;
                }
                if (el.style.borderLeftColor) {
                    bcolor = this.filter_rgb(el.style.borderLeftColor).replace('#', '');
                }
                var bs_button = toolbar.getButtonByValue('bordersize');
                var bSizeStr = ((parseInt(bsize, 10) > 0) ? '' : 'None');
                bs_button.set('label', '<span class="yui-toolbar-bordersize-' + bsize + '">'+bSizeStr+'</span>');
                this._updateMenuChecked('bordersize', bsize, toolbar);

                var bt_button = toolbar.getButtonByValue('bordertype');
                bt_button.set('label', '<span class="yui-toolbar-bordertype-' + btype + '"></span>');
                this._updateMenuChecked('bordertype', btype, toolbar);
                if (parseInt(bsize, 10) > 0) {
                    toolbar.selectButton('bordersize');
                    toolbar.enableButton(bt_button);
                    toolbar.enableButton('bordercolor');
                }
                if (el.style.borderSize) {
                    toolbar.selectButton('bordersize');
                    toolbar.selectButton(parseInt(el.style.borderSize, 10));
                }
                toolbar.currentBorderSize = bsize;
                toolbar.currentBorderType = btype;
                toolbar.currentBorderColor = bcolor;
            }
        }
    },

    /**
    * @private
    * @method _handleWindowClose
    * @description Handles the closing of a Window.
    */
    _handleWindowClose: function() {
        if (this._isElement(this.currentElement[0], 'img') &&
            this.currentElement[0].src == this.get('blankimage')) {
            this.currentElement[0].parentNode.removeChild(this.currentElement[0]);
        }
        this.currentElement = [];
    },

    /**
    * @private
    * @method _setError
    * @description Displays an error message in a dialog window 
    * @param {String} ID of the element that contains the error message
    */
    _setError: function(id) {
        if (el = document.getElementById(id)) {
            el.style.display = (el.tagName.toLowerCase() == 'span') ? 'inline' : 'block';
        }
    },
     
    /**
    * @private
    * @method _clearErrors
    * @description Clears all error messages in the dialog window
    * @param {Object} Window object
    */
    _clearErrors: function(win) {
        if (!win) win = this.currentWindow;
        if (win) {
            YAHOO.util.Dom.getElementsByClassName('yui-editor-panel-err',
                null, win.body, function(el) { el.style.display = 'none'; }
            );
        }
    },

    /**
    * @private
    * @method _scrollTo
    * @param {HTMLElement} element to scroll to
    * @description Scrolls to an element in the editor document
    */
    _scrollTo: function(el) {
        var pos = Solstice.Geometry.getOffsetTop(el) - 40;
        for ( var i = 0; i < top.frames.length; i++ ) {
            if (top.frames[i].document.title == this.STR_TITLE) {
                top.frames[i].window.scrollTo(0, pos);
                return;
            }
        }
    },

    /**
    * @private
    * @description The default dialog window width
    */
    _defaultWindowWidth: '440px',

    /**
    * @private
    * @Object _defaultToolbar
    * @description The default toolbar for SolsticeEditor 
    */
    _defaultToolbar: {
        collapse: true,
        titlebar: false,
        draggable: false,
        buttonType: 'advanced',
        buttons: [
            { group: 'fontstyle', label: 'Font Name and Size', buttons: [
                { type: 'select', label: 'Arial', value: 'fontname', disabled: true, menu: [
                    { text: 'Arial', checked: true },
                    { text: 'Arial Black' },
                    { text: 'Comic Sans MS' },
                    { text: 'Courier New' },
                    { text: 'Georgia' },
                    { text: 'Lucida Console' },
                    { text: 'Tahoma' },
                    { text: 'Times New Roman' },
                    { text: 'Trebuchet MS' },
                    { text: 'Verdana' }
                ]},
                { type: 'spin', label: '13', value: 'fontsize', range: [ 9, 75 ], disabled: true }               
            ]},
            { type: 'separator' },
            { group: 'textstyle', label: 'Font Style', buttons: [
                { type: 'push', label: 'Bold CTRL + SHIFT + B', value: 'bold' },
                { type: 'push', label: 'Italic CTRL + SHIFT + I', value: 'italic' },
                { type: 'push', label: 'Underline CTRL + SHIFT + U', value: 'underline' },
                { type: 'push', label: 'Strike Through', value: 'strikethrough' },               
                { type: 'separator' },
                { type: 'push', label: 'Subscript', value: 'subscript', disabled: true },
                { type: 'push', label: 'Superscript', value: 'superscript', disabled: true }
            ]},
            { type: 'separator' },
            { group: 'textstyle2', label: '&nbsp;', buttons: [
                { type: 'color', label: 'Font Color', value: 'forecolor', disabled: true },
                { type: 'color', label: 'Background Color', value: 'backcolor', disabled: true },
                { type: 'separator' },
                { type: 'push', label: 'Remove Formatting', value: 'removeformat', disabled: true }
            ]},
            { type: 'separator' },
            { group: 'alignment', label: 'Alignment', buttons: [
                { type: 'push', label: 'Align Left CTRL + SHIFT + [', value: 'justifyleft' },
                { type: 'push', label: 'Align Center CTRL + SHIFT + |', value: 'justifycenter' },
                { type: 'push', label: 'Align Right CTRL + SHIFT + ]', value: 'justifyright' },
                { type: 'push', label: 'Justify', value: 'justifyfull' }
            ]},
            { type: 'separator' },
            { group: 'parastyle', label: 'Paragraph Style', buttons: [
                { type: 'select', label: 'Normal', value: 'heading', disabled: true, menu: [
                    { text: 'Normal', value: 'none', checked: true },
                    { text: 'Header 1', value: 'h1' },
                    { text: 'Header 2', value: 'h2' },
                    { text: 'Header 3', value: 'h3' },
                    { text: 'Header 4', value: 'h4' },
                    { text: 'Header 5', value: 'h5' },
                    { text: 'Header 6', value: 'h6' }
                ]}
            ]},
            { type: 'separator' },
            { group: 'indentlist2', label: 'Indenting and Lists', buttons: [
                { type: 'push', label: 'Outdent', value: 'outdent', disabled: true },
                { type: 'push', label: 'Indent', value: 'indent', disabled: true },
                { type: 'push', label: 'Create an Unordered List', value: 'insertunorderedlist' },
                { type: 'push', label: 'Create an Ordered List', value: 'insertorderedlist' }
            ]},
            { type: 'separator' },
            { group: 'insertitem', label: 'Insert Item', buttons: [
                { type: 'push', label: 'Insert Link', value: 'createlink', disabled: true },
                { type: 'push', label: 'Insert Image', value: 'insertimage' },
                { type: 'push', label: 'Insert Horizontal Rule', value: 'inserthorizontalrule' },
                { type: 'push', label: 'Insert Table', value: 'inserttable' },
                { type: 'push', label: 'Insert LaTeX', value: 'insertlatex' },
                { type: 'push', label: 'Insert YouTube Video', value: 'insertmedia' }
            ]},
            { type: 'separator' },
            { group: 'edithtml', label: 'HTML', buttons: [
                { type: 'push', label: 'Edit HTML Code', value: 'editsource' }
            ]},
            { type: 'separator' },
            { group: 'spellcheck', label: 'Spelling', buttons: [
                { type: 'push', label: 'Check Spelling', value: 'spellcheck' }
            ]}
        ]
    },

    /**
    * @private
    * @Object _defaultWindowToolbarConfig
    * @description The default window toolbar for SolsticeEditor
    */
    _defaultWindowToolbarConfig: {
        buttonType: 'advanced',
        buttons: [
            {group: 'align', label: 'Alignment:', buttons: [
                { type: 'select', label: 'None', value: 'align', menu: [
                    { text: 'None', value: 'alignnone', checked: true },
                    { text: 'Left', value: 'alignleft' },
                    { text: 'Center', value: 'aligncenter' },
                    { text: 'Right', value: 'alignright' }
                ]}
            ]},
            { type: 'separator' },
            { group: 'textflow', label: 'Text Flow:', buttons: [
                { type: 'push', label: 'Left', value: 'left' },
                { type: 'push', label: 'Inline', value: 'inline' },
                { type: 'push', label: 'Block', value: 'block' },
                { type: 'push', label: 'Right', value: 'right' }
            ]},
            { type: 'separator' },
            { group: 'padding', label: 'Padding:', buttons: [
                { type: 'spin', label: '0', value: 'padding', range: [0, 50] }
            ]},
            { type: 'separator' },
            { group: 'border', label: 'Border:', buttons: [
                { type: 'select', label: 'Border Size', value: 'bordersize', menu: [
                    { text: 'None', value: '0', checked: true },
                    { text: '1px', value: '1' },
                    { text: '2px', value: '2' },
                    { text: '3px', value: '3' },
                    { text: '4px', value: '4' },
                    { text: '5px', value: '5' }
                ]},
                { type: 'select', label: 'Border Type', value: 'bordertype', disabled: true, menu: [
                    { text: 'Solid', value: 'solid', checked: true },
                    { text: 'Dashed', value: 'dashed' },
                    { text: 'Dotted', value: 'dotted' }
                ]},
                { type: 'color', label: 'Border Color', value: 'bordercolor', disabled: true }
            ]}
        ]
    }
});

/**
  * @function Solstice.YahooUI.Editor.loadImageWindow
  * @param object JSON object passed from the server-side script 
  * @description Callback for the server-side script used for udpating image or LaTeX image.
  */
Solstice.YahooUI.Editor.loadImageWindow = function(obj){
    var editor = Solstice.YahooUI.Editor.get(obj.editor_name);
    if (editor) {
	editor._loadImageWindow(obj);
    }
};
