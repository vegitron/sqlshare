Solstice.YahooUI.Editor.InsertTable = function() {
    return {
        /**
        * @method addInsertTable
        * @param {String} Toolbar group
        * @description Adds handlers necessary for inserttable, should be called on toolbarLoaded
        */
        addInsertTable: function(group) {
            if (!group) group = 'insertitem';
            this.toolbar.addButtonToGroup({
                type : 'push',
                label: 'Insert Table', 
                value: 'inserttable'
            }, group);
            this._setupInsertTable();
        },

        /**
        * @private
        * @method _setupInsertTable
        * @description Adds handlers necessary for inserttable
        */
        _setupInsertTable: function() {
            this.toolbar.on('inserttableClick', this._handleInsertTableClick, this, true);
            this.on('afterNodeChange', function() {
                var el = this._getSelectedElement();
                if (this._isElement(el, 'td') || this._isElement(el, 'table')) {
                    this.toolbar.selectButton(this.toolbar.getButtonByValue('inserttable'));
                }
            }, this, true);
        },

        /**
        * @method cmd_inserttable
        * @param value Value passed from the execCommand method
        * @description This is an execCommand override method. It is called from execCommand when the execCommand('inserttable') is used.
        */
        cmd_inserttable: function(value) {
            var el = this._getSelectedElement();
            if (this._isElement(el, 'td') || this._isElement(el, 'th')) {
                this.currentElement[0] = el.parentNode;
            } else {
                this.currentElement[0] = el;
            }
            if (this._isElement(this.currentElement[0], 'tr')) {
                var rParent = this.currentElement[0].parentNode;
                if (this._isElement(rParent, 'tbody') || this._isElement(rParent, 'thead')) {
                    this.currentElement[0] = rParent.parentNode;
                } else {
                    this.currentElement[0] = rParent;
                }
            }
            return [false];
        },

        /**
        * @private
        * @method _handleInsertTableClick
        * @description Handles the opening of the Insert Table Window.
        */
        _handleInsertTableClick: function() {
            if (this.get('limitCommands')) {
                if (!this.toolbar.getButtonByValue('inserttable')) {
                    return false;
                }
            }
            this.on('afterExecCommand', function() {
                var el = this.currentElement[0], is_table = false, rows = '2', columns = '3',
                    ns = this.get('name') + '_inserttable_';
                if (!el) {
                    el = this._getSelectedElement();
                    this.currentElement[0] = el;
                }

                if (this._isElement(el, 'table')) {
                    rows = el.rows.length;
                    columns = el.rows[0].cells.length;
                    is_table = true;
                    document.getElementById(ns + 'remove').style.display = 'inline';
                } else {
                    document.getElementById(ns + 'remove').style.display = 'none';    
                }

                var win = new YAHOO.widget.EditorWindow('inserttable', {width: this._defaultWindowWidth});
                if (this._windows.inserttable && this._windows.inserttable.body) {
                    body = this._windows.inserttable.body;
                } else {
                    body = this._renderInsertTableWindow();
                }
                win.setHeader(this.toolbar.getButtonByValue('inserttable').get('label'));
                win.setBody(body);
                this.openWindow(win);

                document.getElementById(ns + 'rows').value = rows;
                document.getElementById(ns + 'rows').disabled = is_table;
                document.getElementById(ns + 'columns').value = columns;
                document.getElementById(ns + 'columns').disabled = is_table;
                if (!is_table) {
                    // Toolbar defaults border = 1px
                    var toolbar = this._defaultWindowToolbar;
                    toolbar.getButtonByValue('bordersize').set('label', '<span class="yui-toolbar-bordersize-1">1</span>');
                    this._updateMenuChecked('bordersize', '1', toolbar);
                    toolbar.selectButton('bordersize');
                    toolbar.enableButton('bordertype');
                    toolbar.enableButton('bordercolor');
                    toolbar.currentBorderSize = '1';
                }
                this.toolbar.selectButton('inserttable');
            });
        },

        /**
        * @private
        * @method _renderInsertTableWindow
        * @description Renders the dialog window content 
        */
        _renderInsertTableWindow: function() {
            var ns = this.get('name') + '_inserttable_';
            var body = document.getElementById(ns + 'window');
            body.className = 'yui-editor-panel-inserttable';

            // Add event handlers
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'save'), 'click',
                this._handleInsertTableSave, this, true);
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'cancel'), 'click',
                this.closeWindow, this, true);
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'remove'), 'click', function(ev) {
                    this._handleInsertTableRemove();
                    this.closeWindow();
                    YAHOO.util.Event.stopEvent(ev);
                }, this, true);

            this._windows.inserttable = {};
            this._windows.inserttable.body = body;
            body.style.display = 'none';
            this.get('panel').editor_form.appendChild(body);
            return body;
        },

        /**
        * @private
        * @method _handleInsertTableSave
        * @description Handles the saving of the Insert Table Window.
        */
        _handleInsertTableSave: function() {
            var ns = this.get('name') + '_inserttable_';
            var rows = document.getElementById(ns + 'rows');
            var columns = document.getElementById(ns + 'columns');

            this._clearErrors();
            var hasError = false;
            if (!rows.value.length || !rows.value.match(/^[1-9][0-9]?$/)) {
                rows.focus();
                if (rows.value.length) {
                    this._setError(ns + 'rows_invalid');
                } else {
                    this._setError(ns + 'rows_required');
                }
                hasError = true;
            }
            if (!columns.value.length || !columns.value.match(/^[1-9][0-9]?$/)) {
                if (!hasError) columns.focus();
                if (columns.value.length) {
                    this._setError(ns + 'columns_invalid');
                } else {
                    this._setError(ns + 'columns_required');
                }
                hasError = true;
            }
            if (hasError) return;

            var el;
            if (this._isElement(this.currentElement[0], 'table')) {
                el = this.currentElement[0];
            } else {
                try { 
                    this._createCurrentElement('span');
                    this.currentElement[0].parentNode.removeChild(this.currentElement[0]);
                    this._createCurrentElement('table');
                } catch(e) {}
                el = this.currentElement[0];
                if (!el) {
                    // Failover, just add it to the end...
                    el = this._getDoc().createElement('table');
                    this._getDoc().body.appendChild(el);
                }
                for (var r = 0; r < rows.value; r++) {
                    var row = el.insertRow(-1);
                    for (var c = 0; c < columns.value; c++) {
                        var cell = row.insertCell(-1);
                        cell.innerHTML = '<br/>';
                    }
                }
                el.style.width = '400px';
            }
            el.setAttribute('cellPadding', '0'); 
            el.setAttribute('cellSpacing', '0');
            this._updateElementFromToolbar(el);
            this.nodeChange();
            this.closeWindow();
            
            // Add a <br> to allow cursor positioning below the table
            if (!el.nextSibling) {
                el.parentNode.appendChild(this._getDoc().createElement('br'));
            }
        },

        /**
        * @private
        * @method _handleInsertTableRemove
        * @description Handles the removing of the currently selected table.
        */
        _handleInsertTableRemove: function() {
            if (this._isElement(this.currentElement[0], 'table')) {
                el = this.currentElement[0];
                el.parentNode.removeChild(el);
            }
        }
    };
}
