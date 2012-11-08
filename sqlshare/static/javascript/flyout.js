/**
 * @fileoverview 
 * Solstice provides a type of nested button called a Flyout.  This is the Javascript that supports this type of button.
 */

/**
 * @class Abstract superclass for Flyout Classes
 * @constructor
 */
Solstice.Flyout = function () {};

/**
 * @class The flyout menu object - this obj is responsible for
 * keeping track of the button data.
 * @constructor
 * @param {string} id An identifier for the new Flyout menu
 */
Solstice.Flyout.Menu = function(id) {
    this.id = id;
    this.options = new Array();
    this.style = 'sol_flyoutmenu'; // default style class
}

/**
 * Adds options to the menu
 * @param {array} list A list of attributes for the options
 * @private
 * @type void
 */
Solstice.Flyout.Menu.prototype.createOptions = function(list) {
    var i;
    for (i = 0; i < list.length; i++) {
        this.options[this.options.length] = new Solstice.Flyout.MenuOption(list[i]);
    }
}

/**
 * Sets the CSS style class name of the menu
 * @param {string} style CSS classname
 * @type void
 */
Solstice.Flyout.Menu.prototype.setStyleClass = function(style) {
    this.style = style;
}


/**
 * @class Models the options that make up a Flyout.Menu
 * @constructor
 * @param {array} list A list of attributes that describe the option
 * @type void
 */
Solstice.Flyout.MenuOption = function(list) {
    this.buttonid  = list.buttonid;
    this.label     = list.label;
    this.title     = list.title;
    this.url       = list.url;
    this.is_static = list.is_static;
    this.disabled  = list.disabled;
    this.checked   = list.checked;
    this.submenu   = list.submenu;
    if(this.submenu != null) {
        for(i=0; i< this.submenu.length;i++){
            var item = this.submenu[i];
            if(item.client_action != null && item.client_action != '' && item.buttonid){
                Solstice.Button.registerClientAction(item.buttonid, item.client_action);
            }
        }
    }
    if (list.buttonid && list.client_action) {
        this.client_action = list.client_action;
        Solstice.Button.registerClientAction(list.buttonid, list.client_action);
    }
}

/**
 * @class A registry of flyouts on the screen
 * @constructor
 * @param {string} id An identifier for the registry
 */
Solstice.Flyout.MenuRegistry = function(id) {
    this.id = id;
    this.registry = new Array();
}

Solstice.Flyout.keyPressSubmit = function (e, name, id) {
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;
    if(code == 13){
        Solstice.Flyout.menuReg.openDropdownMenu(name, id);
        Solstice.Event.stopEvent(e); 
    }
}

/**
 * Factory type method that create a flyout menu while adding it to the registry
 * @param {string} id an id for the flyout
 * @param {array} options A list of attributes for the flyout
 */
Solstice.Flyout.MenuRegistry.prototype.createMenu = function(id, options) {
    if (this.registry[id]) return this.registry[id]; 
    
    var menu = new Solstice.Flyout.Menu(id);
    if (options) menu.createOptions(options);
    
    this.registry[id] = menu;
    
    return menu;
}

Solstice.Flyout.MenuRegistry.prototype.clickSubmit = function(p_sType, p_aArgs, p_oValue) {
    return Solstice.Button.submit(p_oValue);
}

Solstice.Flyout.MenuRegistry.prototype.clickAlternateSubmit = function(p_sType, p_aArgs, p_oValue) {
    return Solstice.Button.alternateSubmit(p_oValue.url, p_oValue.id);
}


/**
 * Opens a the Flyout menu.
 * @param {string} current_id The ID of the flyout to open
 * @param {event} event The event that spawned the menu (used to locate the menu on the screen)
 * @returns {boolean} Did the menu open successfully?
 */
Solstice.Flyout.MenuRegistry.prototype.openContextMenu = function(current_id, event){
    // In order to display menu next to the current
    // object we need to get coordinates of the click.
    // Netscape and IE do this differently.
    if (!event) event = window.event;

    var Xpt = Solstice.Geometry.getEventX(event);
    var Ypt = Solstice.Geometry.getEventY(event);

    this.openMenu(current_id, Xpt, Ypt);
    
    Solstice.Event.stopEvent(event);
    return;
}

Solstice.Flyout.MenuRegistry.prototype.openDropdownMenu = function(current_id, block_id, event){
    if(!block_id) return false;
    
    if (!event) event = window.event;
    
    var region = YAHOO.util.Dom.getRegion(block_id);
    this.openMenu(current_id, region['left'], region['bottom']);
    
    Solstice.Event.stopEvent(event);

    return;
}

Solstice.Flyout.MenuRegistry.prototype._buildMenuItems = function(menu){
    var item_list = new Array();
    var i;
    var group_list = new Array();
    for (i = 0; i < menu.length; i++) {
        var menu_item = menu[i];
        if (menu_item.label) {
            var submenu_list = new Array();
            var submenu = null;
            if(menu_item.submenu != null){
                submenu_list = this._buildMenuItems(menu_item.submenu);
                submenu = new YAHOO.widget.Menu('subnav'+menu_item.buttonid);
                submenu.addItems(submenu_list);
            }
            var onclick;
            if((!menu_item.is_static && menu_item.url != '') || (menu_item.is_static && menu_item.client_action)){
                onclick = { fn:this.clickAlternateSubmit, obj:{id:menu_item.buttonid, url:menu_item.url} };
            } else if (menu_item.is_static && menu_item.url == '' && !menu_item.client_action) {
                //take no action
                onclick = undefined; 
            } else {
                onclick = { fn:this.clickSubmit, obj:menu_item.buttonid };
            }
            group_list.push({
                text: menu_item.label,
                url: (menu_item.is_static && menu_item.url != '') ? menu_item.url : undefined,
                onclick: onclick,
                disabled:menu_item.disabled,
                checked:menu_item.checked,
                submenu:submenu
            });

        }else {
            item_list.push(group_list);
            group_list = new Array();
        }
    }
    item_list.push(group_list);
    return item_list;
}

Solstice.Flyout.MenuRegistry.prototype.openMenu = function(current_id, xPos, yPos) {
    if (!current_id) return false;

    if (!this.menu) {
        this.menu = new Array();
    }

    if (this.menu[current_id]) {
        YAHOO.widget.MenuManager.hideVisible();
        return this._openMenu(current_id, xPos, yPos);
    }

    var yahoo_menu = new YAHOO.widget.Menu("menu_"+current_id);

    this.menu[current_id] = yahoo_menu;
    
    // If this menu has already been created, just display it.
    if (yahoo_menu.getItems().length) {
        return this._openMenu(current_id, xPos, yPos);
    }

    // Get the menu for the selected id
    var menu = this.registry[current_id];
    if (!menu.options.length) return false;
    var menuClass = menu.style;
    var item_list = this._buildMenuItems(menu.options);
   
    
    yahoo_menu.addItems(item_list);

    yahoo_menu.render(document.body);
    // This needs to happen after the menu has been rendered, otherwise the tooltips won't show up.
    this._registerToolTips(yahoo_menu, menu.options);
    Solstice.Event.add(yahoo_menu.body, 'contextmenu', this._handleContextClick, yahoo_menu, true);
            
    return this._openMenu(current_id, xPos, yPos);
}

Solstice.Flyout.MenuRegistry.prototype._handleContextClick = function(ev){
    var el = YAHOO.util.Event.getTarget(ev); 
    if (el && 'a' == el.nodeName.toLowerCase()) {
        var href = el.getAttribute('href');
        if (!href || '#' == href) {
            Solstice.Event.stopEvent(ev);
        }
    }
};

Solstice.Flyout.MenuRegistry.prototype._registerToolTips = function(yui_menu, menu_object) {
    var j;
    for(j=menu_object.length-1;j>=0;j--){
        if(menu_object[j].buttonid == null){
            var rest = menu_object.slice(j + 1);
            menu_object.length = j;
            menu_object.push.apply(menu_object, rest);
        }
    }
    var i;
    var items = yui_menu.getItems();
    for (i = 0; i < items.length; i++) {
        var item = items[i];
        if (item) {
            if(menu_object[i].submenu){
                this._registerToolTips(item.cfg.getProperty('submenu'), menu_object[i].submenu);
            }
            //setting an undefined title leads to a title showing up as 'undefined' when you hover over elements
            var title = ' ';
            if(menu_object[i].title != null){
                title = menu_object[i].title;
            }
            document.getElementById(item.id).title = title;
        }
    }
}

/**
 * Opens the Flyout menu, using the passed coordinates. 
  * @param {string} current_id The ID of the flyout to open
  * @param {integer} xPos The x-coordinate position of the menu
  * @param {integer} yPos The y-coordinate position of the menu
  * @returns {void}
  */
Solstice.Flyout.MenuRegistry.prototype._openMenu = function(current_id, xPos, yPos) {
    var yahoo_menu = this.menu[current_id];

    yahoo_menu.cfg.setProperty('constraintoviewport', true);
    yahoo_menu.cfg.setProperty('x', xPos);
    yahoo_menu.cfg.setProperty('y', yPos);
    
    yahoo_menu.show();
    yahoo_menu.focus();

    return;
}

/**
 * Solstice only uses one MenuRegistry - it's held here.
 */
Solstice.Flyout.menuReg = new Solstice.Flyout.MenuRegistry('sol_flyoutmenu');

/*
 * Copyright 1998-2008 Learning & Scholarly Technologies, University of Washington
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

