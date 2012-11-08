Solstice.YahooUI.Editor.SpellCheck = function() {
    return {
        /**
        * @property {Boolean} spellChecking
        * @description Holds the state of spellchecking mode
        */
        spellChecking: false,

        /**
        * @property {Array} _spellData 
        * @description An array to hold spellchecker data returned from the server 
        */
        _spellData: [],

        /**
        * @method addSpellCheck
        * @param {String} Toolbar group
        * @description Adds handlers necessary for spellchecking, should be called on toolbarLoaded
        */
        addSpellCheck: function() {
            this.toolbar.addButtonGroup({
                group: 'spellcheck',
                label: 'Spelling', 
                buttons: [{
                    type : 'push',
                    label: 'Check Spelling', 
                    value: 'spellcheck'
                }]
            });
            this._setupSpellCheck();
        },
 
        /**
        * @method cmd_spellcheck
        * @description This is an execCommand override method. It is called from execCommand when the execCommand('spellcheck') is used.
        */
        cmd_spellcheck: function(value) {
            if (this.spellChecking) {
                this._exitSpellCheckMode();
            } else {
                this.spellChecking = true;
                this.toolbar.set('disabled', true);
                this.toolbar.getButtonByValue('spellcheck').set('disabled', false);
                this.toolbar.selectButton('spellcheck');
                Solstice.Remote.run('Solstice', 'checkSpelling', {
                    'editor_name' : this.get('name'),
                    'content'     : this.getEditorHTML()
                });
            }
            return [false];
        },

        /**
        * @private
        * @method _exitSpellCheckMode
        * @description Handles turning off spellcheck mode 
        */ 
        _exitSpellCheckMode: function() {
            this.spellChecking = false;
            this.toolbar.set('disabled', false);
            this.setEditorHTML(this._removeSpellCheckTags(this.getEditorHTML()));
            this._spellData = [];
            if (this.currentWindow) {
                this.closeWindow();
            }
        },

        /**
        * @private
        * @method _updateWordFromSpellCheck
        * @param {String} replacement word
        * @param {Boolean} replace all occurences of the word
        * @description Update the current word from spell check selection 
        */
        _updateWordFromSpellCheck: function(replacement, all) {
            var el = this.currentElement[0];
            if (all) {
                var html = this.getEditorHTML();
                var pattern = new RegExp('<span class="?yui-spellcheck"?>' + el.innerHTML + '<\/span>', 'ig');
                html = html.replace(pattern, replacement);
                this.setEditorHTML(html);
            } else {
                // Current word only
                var txt = this._getDoc().createTextNode(replacement);
                el.parentNode.replaceChild(txt, el);
            }

            // Move to the next word
            var next = YAHOO.util.Dom.getElementsByClassName('yui-spellcheck', 'span', this._getDoc().body)[0];
            this.nodeChange();
            if (next) {
                this.currentElement[0] = next;
                this._scrollTo(next);
                this._handleSpellCheckWindowOpen();
            } else {
                this._exitSpellCheckMode();
            }
        },

        /**
        * @method addSpellCheckTags
        * param {Array} spelling data
        * @description Updates the editor content with spelling data
        */
        addSpellCheckTags: function(data) {
            if (data.length) {
                var html = this._getDoc().body.innerHTML;
                for (var i = 0; i < data.length; i++) {
                    // Wrap word with <span> tags
                    var re1 = new RegExp('\\b(' + data[i].word + ')\\b', 'g');
                    html = html.replace(re1, '<span class="yui-spellcheck">$1</span>');

                    // Digits must be handled separately
                    var re2 = new RegExp('\\b(' + data[i].word + ')(\\d)', 'g');
                    html = html.replace(re2, '<span class="yui-spellcheck">$1</span>$2');

                    var re3 = new RegExp('(\\d)(' + data[i].word + ')\\b', 'g');
                    html = html.replace(re3, '$1<span class="yui-spellcheck">$2</span>');

                    var re4 = new RegExp('(\\d)(' + data[i].word + ')(\\d)', 'g');
                    html = html.replace(re4, '$1<span class="yui-spellcheck">$2</span>$3');

                    // Remove any spans that were added inside existing tags
                    var re_fix = new RegExp('(<[^>]*?)<span class="?yui-spellcheck"?>(' + data[i].word  + ')<\/span>(.*?>)', 'ig');
                    html = html.replace(re_fix, '$1$2$3');
                }
                this._getDoc().body.innerHTML = html;
                this._spellData = data;
            } else {
                this._exitSpellCheckMode();
                alert(document.getElementById(this.get('name') + '_spellcheck_nomisspellings').innerHTML);
            }
        },

        /**
        * @private
        * @method removeSpellCheckTags
        * @description Remove spell-checking tags from the editor content 
        * @param {String} HTML
        */
        _removeSpellCheckTags: function(html) {
            var pattern = new RegExp('<span class="?yui-spellcheck"?>([^<]*)<\/span>', 'ig');
            if (html) {
                html = html.replace(pattern, '$1');
            }
            return html;
        },

        /**
        * @private
        * @method _handleSpellCheckWindowOpen 
        * @description Opens the spellcheck suggestion window 
        */
        _handleSpellCheckWindowOpen: function() {
            var el = this.currentElement[0], data = this._spellData,
                win = this.currentWindow;
            
            if (!win) {
                win = new YAHOO.widget.EditorWindow('spellcheck', {width: this._defaultWindowWidth});
            }
            
            var body;
            if (this._windows.spellcheck && this._windows.spellcheck.body) {
                body = this._windows.spellcheck.body;
            } else {
                body = this._renderSpellCheckWindow();
            }

            var ns = this.get('name') + '_spellcheck_';
            var select = document.getElementById(ns + 'list');
            select.innerHTML = '';
            select.disabled = false;
            for (var i = 0; i < data.length; i++) {
                if (el.innerHTML == data[i].word) {
                    for (var s = 0; s < data[i].suggestions.length; s++) {
                        var opt = document.createElement('option');
                        opt.setAttribute('value', 'word_' + i + '_sugg_' + s);
                        opt.appendChild(document.createTextNode(data[i].suggestions[s]));
                        select.appendChild(opt);
                    }
                    if (!data[i].suggestions.length) {
                        select.disabled = true;
                        var opt = document.createElement('option');
                        opt.appendChild(document.createTextNode(document.getElementById(ns + 'nosuggestions').innerHTML));
                        select.appendChild(opt);
                    }
                    document.getElementById(ns + 'current').innerHTML = data[i].word;
                    break;
                }
            }
            document.getElementById(ns + 'word').value = '';

            win.setHeader(document.getElementById(ns + 'title').innerHTML);
            win.setBody(body);
            if (this.currentWindow && this.currentWindow.name == 'spellcheck') {
                this._clearErrors();
                this.moveWindow(true);
            } else {
                this.openWindow(win);
            }
        },

        /**
        * @private
        * @method _renderSpellCheckWindow
        * @description Renders the dialog window content 
        */
        _renderSpellCheckWindow: function() {
            var ns = this.get('name') + '_spellcheck_';
            var body = document.getElementById(ns + 'window');
            body.className = 'yui-editor-panel-spellcheck';

            var select = document.getElementById(ns + 'list');

            // Add event handlers
            YAHOO.util.Event.addListener(select, 'change', function(ev) {
                var word = select.options[select.selectedIndex].innerHTML;
                document.getElementById(ns + 'word').value = word;
            }, this, true);
            YAHOO.util.Event.addListener(select, 'click', function(ev) {
                var word = select.options[select.selectedIndex].innerHTML;
                document.getElementById(ns + 'word').value = word;
            }, this, true);
            YAHOO.util.Event.addListener(select, 'dblclick', function(ev) {
                var replacement = select.options[select.selectedIndex].innerHTML;
                this._updateWordFromSpellCheck(replacement);
            }, this, true);
            YAHOO.util.Event.addListener(select, 'mouseover', function(ev) {
                var target = YAHOO.util.Event.getTarget(ev);
                if (target.nodeName.toLowerCase() == 'option') {
                    target.selected = true;
                }
            });
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'ignore'),
                'click', function(ev) {
                    var replacement = this.currentElement[0].innerHTML;
                    this._updateWordFromSpellCheck(replacement);
                }, this, true);
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'ignoreall'),
                'click', function(ev) {
                    var replacement = this.currentElement[0].innerHTML;
                    this._updateWordFromSpellCheck(replacement, true);
                }, this, true);
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'replace'),
                'click', function(ev) { 
                    var replacement = document.getElementById(ns + 'word').value;   
                    if (replacement.length) {
                        this._updateWordFromSpellCheck(replacement);
                    } else {
                        this._setError(ns + 'word_required');
                    }
                }, this, true);
            YAHOO.util.Event.addListener(
                document.getElementById(ns + 'replaceall'),
                'click', function(ev) {
                    var replacement = document.getElementById(ns + 'word').value;
                    if (replacement.length) {
                        this._updateWordFromSpellCheck(replacement, true);
                    } else {
                        this._setError(ns + 'word_required');
                    }
                }, this, true);

            this._windows.spellcheck = {};
            this._windows.spellcheck.body = body;
            body.style.display = 'none';
            this.get('panel').editor_form.appendChild(body);
            return body;
        },

        /**
        * @private
        * @method _setupSpellCheck
        * @description Adds handlers necessary for spellchecking
        */
        _setupSpellCheck: function() {
            this.on('editorContentLoaded', function() {
                //Turn off native spell check
                this._getDoc().body.spellcheck = false;
                this._removeSpellCheckTags();
            }, this, true);
            this.on('beforeEditorMouseDown', function(obj) {
                return (this.spellChecking) ? false : true;
            }, this, true);
            this.on('beforeEditorClick', function(obj) {
                if (this.spellChecking) {
                    var el = YAHOO.util.Event.getTarget(obj.ev);
                    if (YAHOO.util.Dom.hasClass(el, 'yui-spellcheck')) {
                        this.currentElement[0] = el;
                        this._handleSpellCheckWindowOpen();
                    }
                    YAHOO.util.Event.stopEvent(obj.ev);
                    return false;
                }
                return true;
            }, this, true);
            this.on('editorKeyDown', function(obj) {
                if (this.spellChecking) {
                    YAHOO.util.Event.stopEvent(obj.ev);
                }
            }, this, true);
            this.on('closeWindow', function(obj) {
                if (this.spellChecking) {
                    this._exitSpellCheckMode();
                }
            }, this, true);
        }
    };
}
