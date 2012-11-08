Solstice.YahooUI.Editor.InsertIcon = function() {
    return {
        /**
        * @method addInsertIcon
        * @param {String} Toolbar group
        * @param {String} URL of icon directory
        * @param {Array} Array containing icon data: [ filename, alt text ]
        * @description Adds the icon toolbar button, should be called on toolbarLoaded
        * @returns {Boolean} Button added
        */
        addInsertIcon: function(group, url, icons) {
            if (!group) group = 'insertitem';
            if (!url) {
                // Cannot add icon menu without an icon url
                return false;
            }
            this._iconURL = url;
            this.toolbar.addButtonToGroup({
                type : 'push',
                label: 'Insert Smiley',
                value: 'inserticon',
                menu: this._renderInsertIconMenu(url, icons)
            }, group);
            this._setupInsertIcon();
            return true;
        },

        /**
        * @private
        * @method _setupInsertIcon
        * @description Adds handlers necessary for inserticon
        */
        _setupInsertIcon: function() {
            this.on('beforeNodeChange', function() {
                if (this._isIconElement(this._getSelectedElement())) {
                    this.toolbar.deselectButton(this.toolbar.getButtonByValue('insertimage'));
                    this.toolbar.selectButton(this.toolbar.getButtonByValue('inserticon'));
                    return false;
                }
                return true;
            }, this, true);
            this.on('beforeEditorDoubleClick', function(obj) {
                var el = YAHOO.util.Event.getTarget(obj.ev);
                if (this._isIconElement(el)) {
                    this.toolbar.getButtonByValue('inserticon').get('menu').show();
                    return false;
                }
                return true;
            }, this, true);
        },

        /**
        * @private
        * @method _isIconElement
        * @param {HTMLElement}
        * @description Returns true if element is an icon image
        */
        _isIconElement: function(el) {
            return (this._isElement(el, 'img') && this._iconURL &&
                el.src.indexOf(this._iconURL) == 0) ? true : false;
        }, 

        /**
        * @String _iconURL
        * @description Holds a url for the icons directory
        */
        _iconURL: null,

        /**
        * @function _renderInsertIconMenu 
        * @param {String} URL of icon directory
        * @param {Array} Array containing icon data: [ filename, alt text ]
        * @description Renders the icon menu 
        */
        _renderInsertIconMenu: function(url, icons) {
            var body = document.createElement('div');
            body.className = 'yui-editor-panel-inserticon';

            var table = document.createElement('table');
            table.setAttribute('cellPadding', '4');
            table.setAttribute('cellSpacing', '0');
            body.appendChild(table);

            YAHOO.util.Event.addListener(table, 'click', function(ev) {
                var el = YAHOO.util.Event.getTarget(ev), html = null;
                if (this._isElement(el, 'img')) {
                    html = el.parentNode.innerHTML;
                } else if (this._isElement(el, 'td')) {
                    html = el.innerHTML;
                }
                if (html) {
                    this.execCommand('inserthtml', html);
                    this.toolbar.getButtonByValue('inserticon').get('menu').hide();
                    this.currentEvent = null;
                    this.nodeChange();
                }
            }, this, true);

            var menu = new YAHOO.widget.Menu('insert-icon-menu', {
                shadow: false,
                visible: false
            });
            menu.setBody(body);
            menu.beforeShowEvent.subscribe(function() {
                if (!table.rows.length) {
                    var row = null;
                    for (i = 0; i < icons.length; i++) {
                        if (i % 8 == 0) row = table.insertRow(-1);
                        var cell = row.insertCell(-1);

                        var img = document.createElement('img');
                        img.setAttribute('src', this._iconURL + icons[i][0]);
                        img.setAttribute('alt', icons[i][1]);
                        cell.appendChild(img);
                    }
                }
                menu.cfg.setProperty('context', [this.toolbar.getButtonByValue('inserticon').get('element'), 'tl', 'bl']);
                if (btn = this.toolbar.getButtonByValue('insertentity')) {
                   btn.get('menu').hide();
                }
            }, this, true);

            menu.render(this.toolbar.get('cont'));
            menu.element.style.visibility = 'hidden';
            return menu;
        }
    };
}
