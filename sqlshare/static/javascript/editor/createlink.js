Solstice.YahooUI.Editor.CreateLink = function() {
    return {
        /**
        * @method cmd_createlink
        * @param value Value passed from the execCommand method
        * @description This is an execCommand override method. It is called from execCommand when the execCommand('createlink') is used. Overrides the superclass method to protect img tags.
        */
        cmd_createlink: function(value) {
            var el = this._getSelectedElement();
            if (this._isElement(el, 'img')) {
                if (this._hasParent(el, 'a')) {
                    this.currentElement[0] = this._hasParent(el, 'a');
                } else {
                    this.currentElement[0] = el;
                }
                return [false];        
            } else {
                return YAHOO.widget.SolsticeEditor.superclass.cmd_createlink.call(this, value);
            }
        },

        /**
        * @private
        * @method _handleCreateLinkClick
        * @description Handles the opening of the Create Link Window.
        */
        _handleCreateLinkClick: function() {
            if (this.get('limitCommands')) {
                if (!this.toolbar.getButtonByValue('createlink')) {
                    return false;
                }
            }
            this.on('afterExecCommand', function() {
                var el = this.currentElement[0], url = '', title = '',
                    target = '', address = '', subject = '', typeIdx = 0,
                    ns = this.get('name') + '_createlink_';
                if (!el) {
                    el = this._getSelectedElement();
                    this.currentElement[0] = el;
                }
                if (el && this._isElement(el, 'a')) {
                    if (el.getAttribute('href', 2) !== null) {
                        var href = el.getAttribute('href', 2);
                        if (href.match(/^(\w+):(.*)$/)) {
                            var protocol = RegExp.$1.toLowerCase(), otherjunk = RegExp.$2;
                            if (protocol == 'mailto') {
                                typeIdx = 1;
                                if (otherjunk && otherjunk.match(/^([^\?]+)\??(.+)?/)) {
                                    address = RegExp.$1, params = RegExp.$2;
                                    if (params && params.match(/subject=([^&]+)/i)) {
                                        subject = decodeURIComponent(RegExp.$1);
                                    }
                                }
                            } else if (protocol == 'javascript') {
                                // yeah right
                            } else {
                                url = protocol + ':' + otherjunk;
                            }
                        } else {
                            url = href; // protocol-less or malformed href value
                        }
                        document.getElementById(ns + 'remove').style.display = 'inline';
                    } else {
                        document.getElementById(ns + 'remove').style.display = 'none';
                    }
                    if (el.getAttribute('title') !== null) {
                        title = el.getAttribute('title');
                    }
                    if (el.getAttribute('target') !== null) {
                        target = el.getAttribute('target');
                    }
                } else {
                    document.getElementById(ns + 'remove').style.display = 'none';
                }

                var win = new YAHOO.widget.EditorWindow('createlink', {width: this._defaultWindowWidth});
                if (this._windows.createlink && this._windows.createlink.body) {
                    body = this._windows.createlink.body;
                } else {
                    body = this._renderCreateLinkWindow();
                }
                win.setHeader(this.toolbar.getButtonByValue('createlink').get('label'));
                win.setBody(body);
                this.openWindow(win);

                document.getElementById(ns + 'type').options[typeIdx].selected = true;
                this._handleCreateLinkUpdateType();
                document.getElementById(ns + 'url').value = url;
                document.getElementById(ns + 'title').value = title;
                document.getElementById(ns + 'target').checked = (target == '_blank') ? true : false;
                document.getElementById(ns + 'address').value = address;
                document.getElementById(ns + 'subject').value = subject;
                this.toolbar.selectButton('createlink');
            });
        },

        /**
         * @private
         * @method _handleCreateLinkUpdateType 
         * @description Handles updating the link form, based on the selected link type.
         */
        _handleCreateLinkUpdateType: function() {
            var ns = this.get('name') + '_createlink_';
            var sel = document.getElementById(ns + 'type');
            var target = ns + 'form' + sel.options[sel.selectedIndex].value;
            var body = document.getElementById(ns + 'window');
            YAHOO.util.Dom.getElementsByClassName('yui-createlink-form', 'div', body,
                function(el) {
                    el.style.display = (el.getAttribute('id') == target) ? 'block' : 'none';
                }
            );
        },

        /**
        * @private
        * @method _handleCreateLinkSave
        * @description Handles the saving of the CreateLink Window.
        */
        _handleCreateLinkSave: function() {
            var ns = this.get('name') + '_createlink_';
            var sel = document.getElementById(ns + 'type');
            var type = sel.options[sel.selectedIndex].value;
            var href = '', title = '', target = '';
            this._clearErrors();
            if (type == 'url') {
                var url = document.getElementById(ns + 'url');
                if (url.value.length == 0) {
                    url.focus();
                    return this._setError(ns + 'url_required');
                }
                if (url.value.match(/^\w+:\/\//)) {
                    href = url.value;
                } else {
                    var protocol = (url.value.match(/^ftp\./)) ? 'ftp://' : 'http://';
                    href = protocol + url.value;
                }
                var title = document.getElementById(ns + 'title').value;
                var target = (document.getElementById(ns + 'target').checked) ? '_blank' : '';
            } else if (type == 'email') {
                var email = document.getElementById(ns + 'address');
                if (!this._validateEmailAddress(email.value)) {
                    email.focus();
                    return;
                }
                href = 'mailto:' + email.value;
                var subject = document.getElementById(ns + 'subject');
                if (subject.value.length > 0) {
                    href += '?subject=' + encodeURIComponent(subject.value);
                }
            }

            if (!this._isElement(this.currentElement[0], 'a')) {
                var img = null;
                if (this._isElement(this.currentElement[0], 'img')) {
                    img = this.currentElement[0];
                }
                this._createCurrentElement('a');
                if (img) {
                    this.currentElement[0].appendChild(img);
                }
            }
            var el = this.currentElement[0];
            el.setAttribute('href', href);
            el.setAttribute('title', title);
            el.setAttribute('target', target);
            this.nodeChange();
            this.closeWindow();
        },

        /**
         * @private
         * @method _handleCreateLinkCancel
         * @description Handles the Cancel button
         */
        _handleCreateLinkCancel: function() {
            if (this._isElement(this.currentElement[0], 'a') &&
                !this.currentElement[0].getAttribute('href')) {
                this._handleCreateLinkRemove();
            }
            this.closeWindow();
        },

        /**
         * @private
         * @method _handleCreateLinkRemove
         * @description Removes link from the selected element 
         */
        _handleCreateLinkRemove: function() {
            this.unsubscribeAll('afterExecCommand');
            this.execCommand('unlink');
        },

        /**
        * @private
        * @method _handleCreateLinkWindowClose
        * @description Handles the closing of the Link Properties Window.
        */
        _handleCreateLinkWindowClose: function() {
            if (this._isElement(this.currentElement[0], 'a') &&
                !this.currentElement[0].getAttribute('href')) {
                this._handleCreateLinkRemove();
            }
            this.nodeChange();
        },

        /**
        * @private
        * @method _validateEmailAddress
        * @description Validates an email address, and sets an error if invalid
        * param {String} Email address
        * returns {boolean} True if valid, false otherwise
        */
        _validateEmailAddress: function(str) {
            var ns = this.get('name') + '_createlink_';
            if (str.length == 0) {
                this._setError(ns + 'address_required');
                return false;
            }
            if (!str.match(/\.{2,}/) && !str.match(/^\./) &&
                str.toLowerCase().match(/^[\w\-\+\.]+\@[a-z0-9][a-z0-9\-]*\.[a-z0-9\-\.]+$/)) {
                return true;
            } else {
                this._setError(ns + 'address_invalid');
                return false;
            }
            return true;
        },

        /**
        * @private
        * @method _renderCreateLinkWindow
        * @description Renders the dialog window content 
        */
        _renderCreateLinkWindow: function() {
            var ns = this.get('name') + '_createlink_';
            var body = document.getElementById(ns + 'window');
            body.className = 'yui-editor-panel-createlink';

            // Add event handlers
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'type'),
                'change', this._handleCreateLinkUpdateType, this, true);
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'remove'), 'click',
                function(ev) {
                    this._handleCreateLinkRemove();
                    this.closeWindow();
                    YAHOO.util.Event.stopEvent(ev);
                }, this, true);
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'save'),
                'click', this._handleCreateLinkSave, this, true);
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'cancel'),
                'click', this._handleCreateLinkCancel, this, true);

            this._windows.createlink = {};
            this._windows.createlink.body = body;
            body.style.display = 'none';
            this.get('panel').editor_form.appendChild(body);
            return body;
        }
    };
}
