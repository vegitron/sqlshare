// This is here to for IE to load requirements up front.  Otherwise sync requests will become unsync to fetch io-base and it's prereqs
YUI().use("io-base", function(Y) { });
/**
 * @fileoverview Contains the classes for workign with Ajax or remote code. 
 * Automatically included if remote apis are used on the server side while generating the page
 */

/**
 * @class Methods for working with AJAX or Remote code, as Solstice called it.
 * @constructor
 */
Solstice.Remote = function(){};

/**
 * Run the named remote.
 *<br>
 *<br>
 * For example: Solstice.Remote.run('GroupManager', 'loadGroupMemberList', {group_id: 222, max: 4});
 *
 * @param {string} app Namespace of the application that defines the remote call
 * @param {action} action Name of the remote action
 * @param {string|object} data Data to pass to the server side.
 * @param {object} callback An object containing callback functions to handle the server response. Valid elements for callback are:
 *      success: function() 
 *      failure: function()
 *      timeout: 5000, 
 *      argument: [argument1, argument2, argument3]
 * 
 * @type boolean 
 */
Solstice.Remote.run = function(app, action, data, callback, is_async) {
    return Solstice.Remote.loadXML(app, action, data, callback, is_async);
}


Solstice.Remote.getForm = function(app, action, form, data, callback) {
    return Solstice.Remote._runCycle(app, action, false, false, form, data, callback);
}

Solstice.Remote.saveForm = function(app, action, form, data, callback) {
    return Solstice.Remote._runCycle(app, action, true, false, form, data, callback);
}

Solstice.Remote.saveAndGetForm = function(app, action, form, data, callback) {
    return Solstice.Remote._runCycle(app, action, true, true, form, data, callback);
}

Solstice.Remote._runCycle= function(app, action, save, update_form_on_success, form, data, callback) {
    if(! data){
        data = {};
    }

    if(typeof(form) == 'string'){
        form_id = form;
    }else{
        form_id = form.id;
    }

    if(Solstice.YahooUI.PopIn.get(form_id)){
        data.is_popin = true;
    }

    data.form_id = form_id;
    data.params = Solstice.Remote.fetchElementParams(form);
    data.sol_post_click = save;
    data.sol_post_click_update_on_success = update_form_on_success;

    return Solstice.Remote.run(app, action, data, callback);
}

Solstice.Remote._cycleClientAction = function(app, action, save, form, client_action) {

    var run = true;
    if(client_action){
        run = eval(client_action);
    }

    if(run){
        if(save){
            Solstice.Remote.saveForm(app, action, form);
        }else{
            Solstice.Remote.getForm(app, action, form);
        }
    }

    return false;
}

/**
 * Run the named remote, for use as a client action.
 *<br>
 *<br>
 * For example: Solstice.Remote.client_action('GroupManager', 'loadGroupMemberList', {group_id: 222, max: 4});
 *
 * @param {string} app Namespace of the application that defines the remote call
 * @param {action} action Name of the remote action
 * @param {string|object} data Data to pass to the server side.
 * @param {object} callback An object containing callback functions to handle the server response.
 * @type boolean 
 */

Solstice.Remote.client_action = function(app, action, data, callback) {
    Solstice.Remote.run(app, action, data, callback);
    return false;
}


/**
 * Runs the actual XMLHTTP request.
 * @private
 * @param {string} app Namespace of the application that defines the remote call
 * @param {action} action Name of the remote action
 * @param {string|object} data Data to pass to the server side.
 * @param {object} callback An object containing callback functions to handle the server response
 * @type boolean 
 */
Solstice.Remote.loadXML = function (app, action, data, callback, is_async) {
    if(is_async == null){
        is_async = true;
    }
    
    var url = Solstice.Remote._getRemoteURL();
  
    if(data){
        data = encodeURIComponent(JSON.stringify(data));
    }else{
        data = JSON.stringify('');
    }
    
    var postdata = 
        "solstice_session_app_key=" + solstice_session_app_key + 
        "&solstice_remote_app=" + app + 
        "&solstice_remote_action=" + action + 
        "&solstice_subsession_id=" + solstice_subsession +
        "&solstice_subsession_chain=" + solstice_subsession_chain +
        "&solstice_xsrf_token=" + solstice_xsrf_token +
        "&solstice_remote_data=" + data;

    if (!callback) {
        callback = new Object();
    }
    callback.success = Solstice.Remote.processXML;
    
    // Add default callback and timeout if none were specified
    if (!callback.failure) {
        callback.failure = Solstice.Remote.failure;
        callback.argument = app + '::'+action;
    }
    if (!callback.timeout && callback.timeout != 0){
        callback.timeout = 30*1000;
    }

    var request;
    var cfg = {
        method: 'POST',
        sync: !is_async,
        data: postdata,
        timeout: callback.timeout
    };

    YUI().use("io-base", function(Y) {
            Y.on('io:complete', callback.success);
            Y.on('io:failure', callback.failure, callback.argument);
            request = Y.io(url, cfg);
    });
    return request;
}

Solstice.Remote._getRemoteURL = function() {
    return solstice_document_base + "/solstice_remote_call_url/";
}

Solstice.Remote.runActions = function() {
    // eval in any content 
    for(var i = 0; i < Solstice.Remote.Actions.length; i ++){
        var action_array = Solstice.Remote.Actions[i];
        var content = action_array[1];
        var type = action_array[0];
        if(type == 'action'){
            if(content){
                try {
                    eval(content);
                }catch(exception){
                    Solstice.log('Error during remote handling.\n\n Content:' +content +'\n\n exception:'+exception);
                }
            }
        }else if( type == 'update' ){

            var block_id = action_array[2];
            var replaced = document.getElementById(block_id);
            if(replaced){

                //Thanks IE
                if(replaced.nodeName == 'TR' || replaced.nodeName == 'TABLE'){
                    var new_el;
                    var temp = document.createElement('div');
                    if(replaced.nodeName == 'TR'){
                        temp.innerHTML = '<table><tbody><tr>'+content+'</tr></tbody></table>';
                        new_el = temp.firstChild.firstChild.firstChild;
                    }else{
                        temp.innerHTML = '<table><tbody>'+content+'</tbody></table>';
                        new_el = temp.firstChild;
                    }

                    for( var j = 0; j < replaced.attributes.length; j ++){
                        new_el.setAttribute(replaced.attributes[j].name, replaced.getAttribute(replaced.attributes[j].name));
                    }
                    replaced.parentNode.replaceChild(new_el, replaced);
                    temp.style.display = 'none';
                    document.body.appendChild(temp);
                }else{
                    replaced.innerHTML = content;
                }
            }

        }else if( type == 'replacement' ){
            //This hardcodes a DIV to replace with.
            //If you want to replace a table you'll have trouble in IE
            //and will have to add somethign like content update does above

            var block_id = action_array[2];
            var replaced = document.getElementById(block_id);
            if(replaced){
                var parent = replaced.parentNode;
                var new_block = document.createElement("div");
                new_block.innerHTML = content;
                if(parent){
                    parent.replaceChild(new_block, replaced);
                }
            }
        }else if ( type == 'append' ){
            //This hardcodes a DIV to append.
            //If you want to append a table you'll have trouble in IE
            //and will have to add somethign like content update does above

            var block_id = action_array[2];
            var parent = document.getElementById(block_id);
            
            var new_block = document.createElement('div');
            new_block.innerHTML = content;
            if (parent) {
                parent.appendChild(new_block);
            }
        }
    }
    Solstice.Remote.Actions = [];
   
    return true;
}

Solstice.Remote.Actions = [];
/**
 * Processes the returned data from the server.
 * @private
 * @type void
 */
Solstice.Remote.processXML = function (transaction_id, req) {
    var xmldoc = req.responseXML;
    // This won't be defined if there's a 500!
    // Remove this from the requests list so future remote calls can get through
    if (xmldoc != null && xmldoc.documentElement != null) {

        // a bit of debugging information if we have an error in the xml returned from our ajax call
        if(((xmldoc.parseError && xmldoc.parseError.errorCode) || xmldoc.documentElement.nodeName=="parsererror" ) && Solstice.hasDevelopmentMode()){
            if (xmldoc.parseError) {
                var error = xmldoc.parseError;
                alert("Error Code: "+error.errorCode+ 
                        "\nDescription: "+error.reason+
                        '\n Line: ' +error.line+
                        "\n Position: "+error.linepos+ 
                        "\n Source: "+error.srcText);
            }
            else if (xmldoc.documentElement.nodeName == "parsererror") {
                var error =xmldoc.documentElement.childNodes[0].nodeValue;
                alert("Error: "+error);
            }
        }

        var actions = xmldoc.getElementsByTagName("action");
        for(var i = 0; i < actions.length; i ++){

            //childnode[1] is the cdata block in mozilla, childnode[0] in IE
            if(actions[i].childNodes[1]){
                var content = actions[i].childNodes[1].nodeValue;
            }else{
                var content = actions[i].childNodes[0].nodeValue;
            }

            content = content.replace(/SOLSTICE_CDATA_ENCODE_PLACEHOLDER/g, ']]>');

            var type = actions[i].getAttribute('type');
            if( type == 'action' ){
                if(content){
                    Solstice.Remote.Actions[Solstice.Remote.Actions.length]=[type,content];
                }
            }else if( type == 'update' || type == 'replacement' || type == 'append' ){

                var block_id = actions[i].getAttribute('block_id');
                Solstice.Remote.Actions[Solstice.Remote.Actions.length]=[type,content,block_id];

            }
        }

        Solstice.Remote.runActions();
    }
}

/**
 * Fetches any parameters for the document.
 */
Solstice.Remote.fetchDocumentParams = function() {
    return Solstice.Remote.fetchElementParams(Solstice.getAppFormID());
}

/**
 * Fetches any form parameters for the given element.
 * @param {string} block the block element or the block element id to fetch params from within
 */
Solstice.Remote.fetchElementParams = function(block) {
    if(typeof(block) == 'string'){
        block = document.getElementById(block);
    }

    var params = {};
    if(!block){
        return params;
    }

    // Find all input elements
    var els = block.getElementsByTagName('*');
    for ( var i = 0, el; el = els[i]; i++ ) {
        var nodeName = el.nodeName.toLowerCase();
        if (nodeName == 'input') {
            if(el.type == 'hidden' || (el.type == 'checkbox' && el.checked)) {
                if (!params[el.name]) {
                    params[el.name] = new Array();
                }
                params[el.name].push(el.value);
            }else if(el.type == 'radio' && el.checked) {
                params[el.name] = el.value;
            }else if(el.type != 'checkbox' && el.type != 'radio'){
                params[el.name] = el.value;
            }
        } else if (nodeName == 'select') {
            if(el.multiple){
                var options = el.options;
                for(var j=0, option; option = options[j];j++){
                    if(option.selected) {
                        if(!params[el.name]){
                            params[el.name] = new Array();
                        }
                        params[el.name].push(option.value);
                    }
                }
            } else {    
                params[el.name] = el.value;
            }
        } else if (nodeName == 'textarea') {
            if (editor = Solstice.YahooUI.Editor.get(el.name)) {
                params[el.name] = editor.saveHTML();
            } else {
                params[el.name] = el.value;
            }
        }
    }

    return params;
}

/**
 * The default failure handler.
 * @type void 
 */
Solstice.Remote.failure = function(info) {
    if(info.status){

        if(info.status == -1){
            Solstice.log('Remote ' + info.argument + ' timed out');
        }else{
            Solstice.log('Remote '+info.argument + ' failed: ' + info.status + ' ' +info.statusText);
        }

        if(! Solstice.hasDevelopmentMode()){
            Solstice.Message.setCookie('error', 'The application experienced an error and cannot complete the request.');
            window.location.href = window.location.href; // URL-based reload
        }
    }
    return;
}


/**
* @class JSON is a class we use to freeze/thaw data sent to the server.  Please see the source for license and attribution
* @constructor
*/

/*
Copyright (c) 2005 JSON.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The Software shall be used for Good, not Evil.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*
    The global object JSON contains two methods.

    JSON.stringify(value) takes a JavaScript value and produces a JSON text.
    The value must not be cyclical.

    JSON.parse(text) takes a JSON text and produces a JavaScript value. It will
    throw a 'JSONError' exception if there is an error.
*/


/**
 * @class JSON is a class we use to freeze/thaw data sent to the server.  Please see the source for license and attribution
 * @constructor
 */
var JSON = {
    copyright: '(c)2005 JSON.org',
    license: 'http://www.crockford.com/JSON/license.html',
/*
    Stringify a JavaScript value, producing a JSON text.
*/
    stringify: function (v) {
        var a = [];

/*
    Emit a string.
*/
        function e(s) {
            a[a.length] = s;
        }

/*
    Convert a value.
*/
        function g(x) {
            var c, i, l, v;

            switch (typeof x) {
            case 'object':
                if (x) {
                    if (x instanceof Array) {
                        e('[');
                        l = a.length;
                        for (i = 0; i < x.length; i += 1) {
                            v = x[i];
                            if (typeof v != 'undefined' &&
                                    typeof v != 'function') {
                                if (l < a.length) {
                                    e(',');
                                }
                                g(v);
                            }
                        }
                        e(']');
                        return;
                    } else if (typeof x.valueOf == 'function') {
                        e('{');
                        l = a.length;
                        for (i in x) {
                            v = x[i];
                            if (typeof v != 'undefined' &&
                                    typeof v != 'function' &&
                                    (!v || typeof v != 'object' ||
                                        typeof v.valueOf == 'function')) {
                                if (l < a.length) {
                                    e(',');
                                }
                                g(i);
                                e(':');
                                g(v);
                            }
                        }
                        return e('}');
                    }
                }
                e('null');
                return;
            case 'number':
                e(isFinite(x) ? +x : 'null');
                return;
            case 'string':
                l = x.length;
                e('"');
                for (i = 0; i < l; i += 1) {
                    c = x.charAt(i);
                    if (c >= ' ') {
                        if (c == '\\' || c == '"') {
                            e('\\');
                        }
                        e(c);
                    } else {
                        switch (c) {
                        case '\b':
                            e('\\b');
                            break;
                        case '\f':
                            e('\\f');
                            break;
                        case '\n':
                            e('\\n');
                            break;
                        case '\r':
                            e('\\r');
                            break;
                        case '\t':
                            e('\\t');
                            break;
                        default:
                            c = c.charCodeAt();
                            e('\\u00' + Math.floor(c / 16).toString(16) +
                                (c % 16).toString(16));
                        }
                    }
                }
                e('"');
                return;
            case 'boolean':
                e(String(x));
                return;
            default:
                e('null');
                return;
            }
        }
        g(v);
        return a.join('');
    },
/*
    Parse a JSON text, producing a JavaScript value.
*/
    parse: function (text) {
        return (/^(\s+|[,:{}\[\]]|"(\\["\\\/bfnrtu]|[^\x00-\x1f"\\]+)*"|-?\d+(\.\d*)?([eE][+-]?\d+)?|true|false|null)+$/.test(text)) &&
            eval('(' + text + ')');
    }
};


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

