YUI().add('tagger', function(Y) {
    function Tagger(el_id, opts) {
        Tagger.superclass.constructor.apply(this, []);
        this.set('el_id', el_id);

        var tags = opts.tags || {};
        this.set('current_tags', tags);

        this.set('ac_datasource', opts.datasource);
    }

    Tagger.NAME = 'Tagger';
    Tagger.ATTRS = {
        id: null,
        current_tags: null,
        ac_datasource: null
    };

    Y.extend(Tagger, Y.Widget, {

        getTags: function() {
            var id = this.get('el_id')+'_editable_content';

            var element = document.getElementById(id);
            var text = element.innerText || element.textContent;
            if (text == undefined) {
                return [];
            }

            var tags = text.split(/\s+/);
            var return_tags = [];
            for (var i = 0; i < tags.length; i++) {
                var tag = tags[i];
                if (tag.match(/\w/)) {
                    return_tags.push(tag);
                }
            }
            return return_tags;
        },

        // From http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
        _moveCursorToEnd: function(el) {
            var range,selection;
            var contentEditableElement = document.getElementById(this.get('el_id')+'_editable_content');
            if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
            {
                range = document.createRange();//Create a range (a range is a like the selection but invisible)
                range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
                range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
                selection = window.getSelection();//get the selection object (allows you to change selection)
                selection.removeAllRanges();//remove any selections already made
                selection.addRange(range);//make the range you have just created the visible selection
            }
            else if(document.selection)//IE 8 and lower
            {
                range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
                range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
                range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
                range.select();//Select the range (make it the visible selection)
            }

        },

        _makeTags: function(make_end_tag) {
            var id = this.get('el_id')+'_editable_content';

            var element = document.getElementById(id);
            var text = element.innerText || element.textContent;

            return this._makeTagsFromText(text, make_end_tag);
        },

        _makeTagsFromText: function(text, make_end_tag) {
//            var new_values = ['<span contentEditable="false"><span contentEditable="false">'];
            var new_values = [];


            var last_part = text.match(/([^\s]+)$/);
            final_append = false;
            if (last_part && make_end_tag) {
                final_append = true;
            }

            var full_words = text.match(/([^\s]+)\s+/g);
            if (full_words) {
                for (var i = 0; i < full_words.length; i++) {
                    var word = full_words[i];
                    word = word.replace(/\s+/, ' ');
                    if (word.match(/\w/)) {
                        var is_last = (i == full_words.length - 1);
                        if (is_last && final_append == false) {
                            new_values.push(this._getTagHTML(word, true));
                        }
                        else {
                            new_values.push(this._getTagHTML(word));
                        }
                    }
                }
            }

            var last_part = text.match(/([^\s]+)$/);
            if (last_part) {
                var word = last_part[0];
                if (make_end_tag) {
                    if (word.match(/\w/)) {
                        new_values.push(this._getTagHTML(word, true));
                        new_values.push('</span></span>');
                    }
                }
                else {
                    new_values.push('</span></span><span id="tagging_autocomplete_word">', word, '</span>');
                    this.LAST_WORD = word;
                }
            }
            else {
//                new_values.push('</span></span>&nbsp;');
            }

            var final_value = new_values.join('');
            return final_value;

        },

        _addClickListeners: function() {
            var id = this.get('el_id')+'_editable_content';
            var me = this;

            YAHOO.util.Event.removeListener(id, 'dragstart');
            YAHOO.util.Event.addListener(id, 'dragstart', function(ev) { YAHOO.util.Event.stopEvent(ev);} );

            // To prevent dragging
            YAHOO.util.Event.removeListener(YAHOO.util.Dom.getElementsByClassName('tagger_view_only_tag'), 'mousedown');
            YAHOO.util.Event.addListener(YAHOO.util.Dom.getElementsByClassName('tagger_view_only_tag'), 'mousedown', function(ev) { me._moveCursorToEnd(); YAHOO.util.Event.stopEvent(ev); });


            YAHOO.util.Event.removeListener(YAHOO.util.Dom.getElementsByClassName('tagger_tag_removable'), 'click');
            YAHOO.util.Event.addListener(YAHOO.util.Dom.getElementsByClassName('tagger_tag_removable'), 'click', function(ev) {

                var target = this;
                target.parentNode.removeChild(target);
                final_value = me._makeTags(true);
                document.getElementById(id).innerHTML = final_value;
                document.getElementById(id).blur();
                window.setTimeout(function() {
                    me._addClickListeners();
                }, 10);

                YAHOO.util.Event.stopEvent(ev);
            });
        },

        initialize: function() {
            var id = this.get('el_id')+'_editable_content';
            var me = this;

            this._processCurrentTags();

            this._buildHTML();

            if (this.get('ac_datasource')) {
                this._autocomplete = new Y.AutoComplete({
                    resultFilters    : 'phraseMatch',
                    resultHighlighter: 'phraseMatch',

                    inputNode: '#'+this.get('el_id')+'_ac_input',
                    source: this.get('ac_datasource'),
                    activateFirstItem: true,
                    render: true
                });

                this._autocomplete.on('select', function(ev) {
                    var selected = ev.result.raw;
                    var element = document.getElementById(id);
                    var tags = me.getTags();
                    tags[tags.length - 1 ] = selected;

                    element.innerHTML = me._makeTagsFromText(tags.join(' '), true);

                    element.focus();
                    me._moveCursorToEnd();

                    me._autocomplete.sendRequest('  ');

                    ev.halt();

                });
            }

            YAHOO.util.Event.addListener(id, 'keydown', function(ev) {
                var txt = '';
                var in_tags = false;
                if (window.getSelection) {
                    txt = window.getSelection();
                    txt.collapseToEnd();
                }
                else if (document.getSelection) {
                    txt = document.getSelection();
                }
                else if (document.selection) {
                    var range = document.selection.createRange();
                    var div = document.getElementById(id);
                    var tmp_span = document.createElement('span');
                    div.appendChild(tmp_span);

                    var tmp_range = range.duplicate();
                    tmp_range.moveToElementText(tmp_span);
                    tmp_range.setEndPoint("StartToStart", range);

                    var text = tmp_range.text;
                    if (text.match(/\s/)) {
                        in_tags = true;
                        me._moveCursorToEnd(document.getElementById(id));
                    }
                }

            });

            YAHOO.util.Event.addListener(id, 'keyup', function(ev) {
                if ((ev.keyCode <= 33 || ev.keyCode > 40) && ev.keyCode != 46) {
                    if (ev.keyCode == 32 || ev.keyCode == 9) {
                        final_value = me._makeTags(true);
                        var element = document.getElementById(id);
                        document.getElementById(id).innerHTML = final_value;
                        me._moveCursorToEnd(document.getElementById(id));
                        me._addClickListeners();
                    }
                    if (me._autocomplete) {
                        var ec_id = me.get('el_id')+'_editable_content';

                        var element = document.getElementById(ec_id);
                        var text = element.innerText || element.textContent;
                        var matches = text.match(/([^\s]+)$/);
                        if (matches) {
                            last_word = matches[0];
                            me._autocomplete.sendRequest(last_word);
                            me._autocomplete.align('#tagger_autocomplete_align', ['tl', 'br']);
                        }
                        else {
                            me._autocomplete.hide();
                        }
                    }
                }

            });

            /*
            YAHOO.util.Event.addListener(id, 'blur', function(ev) {
                var final_value = me._makeTags(true);
                document.getElementById(id).innerHTML = final_value;
                me._addClickListeners();
            });
            */

            if (me._autocomplete) {
                Y.on(Y.UA.gecko ? 'keypress' : 'keydown', function(ev) {

                    switch (ev.keyCode) {
                        case 9:
                        case 13:
                        case 27:
                        case 38:
                        case 39:
                        case 40:
                            if (me._autocomplete.get('activeItem')) {
                                me._autocomplete._onInputKey(ev);
                            }
                            else {
                                YAHOO.util.Event.stopEvent(ev);
                            }
                    }
                }, '#'+id);
            }
        },


        _processCurrentTags: function() {
            var tags = this.get('current_tags');

            var tag_lookup = {};
            var view_only = {};
            for (tag in tags) {
                if (tags[tag]['class']) {
                    tag_lookup[tag] = tags[tag]['class'];
                }
                if (tags[tag].view_only) {
                    view_only[tag] = true;
                }
            }

            this.set('current_tag_classes', tag_lookup);
            this.set('current_tag_view_only', view_only);
        },

        _buildHTML: function() {
            var container = Y.one('#'+this.get('el_id'));
            YAHOO.util.Dom.addClass(container, 'yui3-skin-sam');

            var editable = document.createElement('div');
            editable.setAttribute('id', this.get('el_id')+'_editable_content');
            editable.contentEditable = true;
            editable.className = 'tagger_input';
            container.appendChild(editable);

            var ac_input = document.createElement('input');
            ac_input.setAttribute('id', this.get('el_id')+'_ac_input');
            ac_input.setAttribute('type', 'text');
            ac_input.className = 'tagger_ac_input';
            container.appendChild(ac_input);

            var tags = [];
            for (tag in this.get('current_tags')) {
                tags.push(tag);
            }

            tags = tags.sort(function(a, b) {
                if (a.toLowerCase() < b.toLowerCase()) {
                    return -1;
                }
                if (a.toLowerCase() > b.toLowerCase()) {
                    return 1;
                }
                return 0;
            });

            var tags_html = this._makeTagsFromText(tags.join(' '), true);
            if (tags_html) {
                tags_html += '&nbsp;';
            }

            Y.one('#'+this.get('el_id')+'_editable_content').set('innerHTML', tags_html);

            this._addClickListeners();
        },

        _getTagHTML: function(tag, add_autocomplete_align) {
            var class_lookup = this.get('current_tag_classes');
            var view_only_lookup = this.get('current_tag_view_only');

            var id = '';
            if (add_autocomplete_align) {
                id = 'id = "tagger_autocomplete_align"';
            }

            tag = tag.replace(/\s*/g, '');
            if (view_only_lookup[tag]) {
                var classNames = ['tagger_tag', 'tagger_view_only_tag'];
                if (class_lookup[tag]) {
                    classNames.push(class_lookup[tag]);
                }
                var className = classNames.join(' ');
                return ['<span ',id,' contenteditable="false"><span contenteditable="false" class="',className,'">', tag, '</span></span>&nbsp;'].join('');
            }
            else {
                var classNames = ['tagger_tag', 'tagger_tag_removable'];
                if (class_lookup[tag]) {
                    classNames.push(class_lookup[tag]);
                }
                var className = classNames.join(' ');

                return ['<span ',id,' contenteditable="false"><a contenteditable="false" href="javascript:void(0)" class="',className,'">', tag, '</a></span>&nbsp;'].join('');
            }
        }
    });

    Y.Tagger = Tagger;

}, '1.0', { requires: ['autocomplete',  "autocomplete-filters", "autocomplete-highlighters"] });



