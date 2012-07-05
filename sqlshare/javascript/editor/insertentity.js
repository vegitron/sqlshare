Solstice.YahooUI.Editor.InsertEntity = function(){
    return {
        /**
        * @method addInsertEntity
        * @param {String} Toolbar group
        * @description Adds handlers necessary for insertentity, should be called on toolbarLoaded
        */
        addInsertEntity: function(group) {
            if (!group) group = 'insertitem'; 
            this.toolbar.addButtonToGroup({
                type : 'push',
                label: 'Insert Character',
                value: 'insertentity',
                menu : this._renderInsertEntityMenu()
            }, group);
        },

        /**
        * @private
        * @method _renderInsertEntityMenu
        * @description Renders the InsertEntity menu content 
        */
        _renderInsertEntityMenu: function() {
            var body = document.createElement('div');
            body.className = 'yui-editor-panel-insertentity';

            var table = document.createElement('table');
            table.setAttribute('cellPadding', '0');
            table.setAttribute('cellSpacing', '0');
            var row = null;
            for ( var i = 0; i < this.HTMLEntities.length; i++ ) {
                if (i % 21 == 0) row = table.insertRow(-1);
                var cell = row.insertCell(-1);
                cell.innerHTML = this.HTMLEntities[i];
            }
            body.appendChild(table);

            YAHOO.util.Event.addListener(table, 'click', function(ev) {
                var el = YAHOO.util.Event.getTarget(ev);
                if (this._isElement(el, 'td')) {
                    this.execCommand('inserthtml', el.innerHTML);
                    this.toolbar.getButtonByValue('insertentity').get('menu').hide();
                }
            }, this, true);

            // Tooltip displays magnified entity
            var zIndex = 1500;
            var tooltip = new YAHOO.widget.Tooltip('insert-entity-tooltip', {
                container : this.toolbar.get('cont'),
                context   : table,
                zindex    : zIndex + 1,
                visible   : false
            });
            tooltip.contextMouseOverEvent.subscribe(function(type, args) {
                tooltip.setBody(YAHOO.util.Event.getTarget(args[1]).innerHTML);
            });

            var menu = new YAHOO.widget.Menu('insert-entity-menu', {
                shadow: false,
                visible: false,
                zindex : zIndex
            });
            menu.setBody(body);
            menu.beforeShowEvent.subscribe(function() {
                menu.cfg.setProperty('context', [
                    this.toolbar.getButtonByValue('insertentity').get('element'),
                    'tl', 'bl'
                ]);
                if (btn = this.toolbar.getButtonByValue('inserticon')) {
                   btn.get('menu').hide();
                }
            }, this, true);
            menu.render(this.toolbar.get('cont'));
            menu.element.style.visibility = 'hidden';
            return menu;
        },

        /**
        * @array HTMLEntities 
        * @description An array containing HTML named entities
        */
        HTMLEntities: [
            // symbols
            '&copy;', '&reg;', '&trade;', '&cent;', '&pound;',
            '&euro;', '&yen;', '&curren;', '&quot;', '&lsquo;',
            '&rsquo;', '&ldquo;', '&rdquo;', '&ndash;', '&mdash;',
            '&dagger;', '&Dagger;', '&sect;', '&laquo;', '&raquo;',
            '&para;', '&iexcl;', '&iquest;', '&brvbar;', '&middot;',
            '&bull;', '&deg;', '&plusmn;', '&frac14;', '&frac12;',
            '&frac34;', '&fnof;', '&part;', '&nabla;', '&prod;',
            '&sum;', '&lowast;', '&radic;', '&prop;', '&infin;',
            '&int;', '&perp;', '&cap;', '&cup;', '&sub;', '&sup;',
            '&nsub;', '&sube;', '&supe;', '&isin;', '&notin;', '&ni;',
            '&sim;', '&cong;', '&asymp;', '&ne;', '&equiv;', '&le;',
            '&ge;', '&and;', '&or;', '&oplus;', '&otimes;', '&not;',
            '&empty;', '&exist;', '&forall;', '&loz;',
            '&larr;', '&uarr;', '&rarr;', '&darr;', '&harr;',
            // latin
            '&Agrave;', '&Aacute;', '&Acirc;', '&Atilde;', '&Auml;',
            '&Aring;', '&AElig;', '&Ccedil;', '&Egrave;', '&Eacute;',
            '&Ecirc;', '&Euml;', '&Igrave;', '&Iacute;', '&Icirc;',
            '&Iuml;', '&ETH;', '&Ntilde;', '&Ograve;', '&Oacute;',
            '&Ocirc;', '&Otilde;', '&Ouml;', '&Oslash;', '&OElig;',
            '&Scaron;', '&Ugrave;', '&Uacute;', '&Ucirc;', '&Uuml;',
            '&Yacute;', '&Yuml;', '&THORN;', '&szlig;', '&agrave;',
            '&aacute;', '&acirc;', '&atilde;', '&auml;', '&aring;',
            '&aelig;', '&ccedil;', '&egrave;', '&eacute;', '&ecirc;',
            '&euml;', '&igrave;', '&iacute;', '&icirc;', '&iuml;',
            '&eth;', '&ntilde;', '&ograve;', '&oacute;', '&ocirc;',
            '&otilde;', '&ouml;', '&oelig;', '&oslash;', '&scaron;',
            '&ugrave;', '&uacute;', '&ucirc;', '&uuml;', '&yacute;',
            '&yuml;', '&thorn;',
            // greek
            '&Alpha;', '&Beta;', '&Gamma;', '&Delta;', '&Epsilon;',
            '&Zeta;', '&Eta;', '&Theta;', '&Iota;', '&Kappa;',
            '&Lambda;', '&Mu;', '&Nu;', '&Xi;', '&Omicron;', '&Pi;',
            '&Rho;', '&Sigma;', '&Tau;', '&Upsilon;', '&Phi;',
            '&Chi;', '&Psi;', '&Omega;', '&alpha;', '&beta;',
            '&gamma;', '&delta;', '&epsilon;', '&zeta;', '&eta;',
            '&theta;', '&iota;', '&kappa;', '&lambda;', '&mu;',
            '&nu;', '&xi;', '&omicron;', '&pi;', '&rho;',
            '&sigmaf;', '&sigma;', '&tau;', '&upsilon;', '&phi;',
            '&chi;', '&psi;', '&omega;'
        ]
    };
}
