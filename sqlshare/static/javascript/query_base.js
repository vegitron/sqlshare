var QueryBase = function() {
};

QueryBase.prototype = new SSBase();

QueryBase.prototype._drawTable = function(id, columns, data) {
    if (columns == null || columns.length == 0) {
        return;
    }
    if (data == null) {
        return;
    }

    var column_defs = [];
    var column_names = [];

    var max_col = columns.length;
    if (max_col > SQLShare.Constants.MAX_PREVIEW_COLS) {
        max_col = SQLShare.Constants.MAX_PREVIEW_COLS;
        Solstice.Message.setInfo(Solstice.Lang.getMessage('SQLShare', 'max_preview_cols_exceeded', {
            shown: SQLShare.Constants.MAX_PREVIEW_COLS,
            total: columns.length
        }));
    }

    var column_keys = [];
    for (var i = 0; i < max_col; i++) {
        column_keys[i] = 'col_'+i;
        column_defs.push({
            key: column_keys[i], label: columns[i], sortable: false, resizeable: true
        });
    }

    var structured = [];
    for (var i = 0; i < data.length; i++) {
        var row_data = {};
        var row = data[i];
        for (var j = 0; j < row.length; j++) {
            row_data[column_keys[j]] = row[j];
        }
        structured.push(row_data);
    }


    var data_source = new YAHOO.util.DataSource(structured);
    data_source.responseType =  YAHOO.util.DataSource.TYPE_JSARRAY;
    data_source.responseSchema = {
        fields: column_keys
    };

    var options = {};
    if (data.length > 20) {
        options.paginator =  new YAHOO.widget.Paginator({ rowsPerPage : 20});
    }

    options.renderLoopSize = 1;

    var data_table = new YAHOO.widget.ScrollingDataTable(id, column_defs, data_source, options);
};


QueryBase.prototype._downloadFile = function(query, error_callback) {
    this._createNewIFrame();
    var iframe = this._getDownloadIFrame();
    YAHOO.util.Event.removeListener(iframe, "load");
    if (error_callback) {
        YAHOO.util.Event.addListener(iframe, "load", error_callback, this, true);
    }
    var download_url = this._getDownloadURL(query);
    iframe.location.href = download_url;
};

QueryBase.prototype._getDownloadError = function() {
    var iframe = this._getDownloadIFrame();
    return iframe.document.body;
};

QueryBase.prototype._createNewIFrame = function() {
    var iframe_name = 'query_download_iframe_'+(new Date()).getTime();
    try {
        new_iframe = document.createElement('<iframe name="'+iframe_name+'">');
        new_iframe.style.display = 'none';
    }
    catch (e) {
        new_iframe = document.createElement('iframe');
        new_iframe.setAttribute('name', iframe_name);
        new_iframe.style.width  = '1px';
        new_iframe.style.height = '1px';
        new_iframe.style.border = '0px';
        new_iframe.style.left = '-1000px';
        new_iframe.style.position = 'absolute';
    }
    new_iframe.setAttribute('src', Solstice.getDocumentBase() + '/content/blank.html');
    new_iframe.setAttribute('tabindex', '-1');
    document.getElementById('solstice_app_form').appendChild(new_iframe);

    iframe = window[iframe_name];

    this._current_iframe = iframe;
};

QueryBase.prototype._getDownloadIFrame = function() {
    var iframe = this._current_iframe;

    return iframe;
};

QueryBase.prototype._highlightName = function(ev) {
    YAHOO.util.Dom.addClass(this.id+"_name_container", "hover");
};

QueryBase.prototype._removeNameHighlight = function(ev) {
    YAHOO.util.Dom.removeClass(this.id+"_name_container", "hover");
};

QueryBase.prototype._resetNameContainer = function() {
    // This is to prevent table renaming until we sort out behavior post release 1
    return;
    YAHOO.util.Dom.removeClass(this.id+"_name_container", "hover");
    YAHOO.util.Dom.removeClass(this.id+"_name", "error_input");
    Solstice.Element.hide(this.id+'_name_required');
    YAHOO.util.Event.addListener(this.id+'_name_container', "mouseover", this._highlightName, this, true);
    YAHOO.util.Event.addListener(this.id+'_name_container', "mouseout", this._removeNameHighlight, this, true);
    YAHOO.util.Event.addListener(this.id+'_name_container', "click", this._openNameDialog, this, true);

};

QueryBase.prototype._openNameDialog = function(ev) {
    var query = this._model;
    YAHOO.util.Event.removeListener(this.id+'_name_container', "mouseover");
    YAHOO.util.Event.removeListener(this.id+'_name_container', "mouseout");
    YAHOO.util.Event.removeListener(this.id+'_name_container', "click");

    this._renderTo(this.id+'_name_container', this._getRenameView());

    YAHOO.util.Event.addListener(this.id+'_save_name', "click", this._beginNameSave, this, true);
    YAHOO.util.Event.addListener(this.id+'_cancel_name', "click", this._cancelNameSave, this, true);

};

QueryBase.prototype._cancelNameSave = function(ev) {
    YAHOO.util.Event.stopEvent(ev);
    var container = document.getElementById(this.id+'_name_container');

    var obj_name = this._getObjectName();
    container.innerHTML = obj_name.encodeHTML();

    this._resetNameContainer();
};

QueryBase.prototype._beginNameSave = function(ev) {
    var new_name = document.getElementById(this.id+'_name').value;

    Solstice.Element.hide(this.id+'_name_required');
    YAHOO.util.Dom.removeClass(this.id+"_name", "error_input");

    if (!new_name.match(/[\w]/)) {
        Solstice.Element.show(this.id+'_name_required');
        YAHOO.util.Dom.addClass(this.id+"_name", "error_input");
        return;
    }

    if (new_name == this._getObjectName()) {
        this._cancelNameSave(ev);
        return;
    }
_
    // Temporary approach to get around .net bug w/ encode ? in url components
    new_name = new_name.replace(/\?/g, '');
    this._new_name = new_name;

    this.AsyncGET(this._getRestRoot()+"/proxy/REST.svc/v2/db/"+this._getObjectType()+"/"+this._model.owner+'/'+new_name, this._postNameCheck);

};

QueryBase.prototype._postNameCheck = function(o) {
    if (o.code == 200) {
        if (!this._overwrite_panel) {
            var overwrite_panel = new YAHOO.widget.Panel(this.id+"_overwrite_panel", { visible: false, width: "500px", fixedcenter:true, draggable: false, modal: true });
            overwrite_panel.setBody("");
            overwrite_panel.setHeader("");
            overwrite_panel.render(document.body);
            Solstice.Element.show(this.id+"_overwrite_panel");
            this._overwrite_panel = overwrite_panel;
        }
        this._overwrite_panel.show();
        this._renderTo(this.id+'_overwrite_panel', 'saved_query/overwrite_panel.html', { id: this.id });

        YAHOO.util.Event.addListener(this.id+'_replace_table', "click", this._replaceTable, this, true);
        YAHOO.util.Event.addListener(this.id+'_cancel_replace', "click", this._cancelReplace, this, true);
    }
    else {
        this._saveNewName();
    }
};

QueryBase.prototype._cancelReplace = function() {
    this._overwrite_panel.hide();
};

QueryBase.prototype._replaceTable = function() {
    this._saveNewName();
    this._overwrite_panel.hide();
};


QueryBase.prototype._saveNewName = function() {
    var original_name = this._getObjectName();
    this._setObjectName(this._new_name);
    var name = this._getObjectName();
    this._new_name = null;
    this.AsyncPOST(this._getRestRoot()+"/proxy/REST.svc/v2/db/"+this._getObjectType()+"/"+this._model.owner+"/"+name, this._model, this._postSaveName);
}

QueryBase.prototype._postSaveName = function(o) {
    var obj_type = this._getObjectType();
    if (o.code == 201) {
        var owner = this._model.owner;
        var name = this._model.name;

        YAHOO.util.History.navigate('s', obj_type+'/'+owner+'/'+name);
        Solstice.Message.setSuccess(Solstice.Lang.getMessage('SQLShare', obj_type+'_renamed'));
    }
    else {
        Solstice.Message.setError(Solstice.Lang.getMessage('SQLShare', obj_type+'_rename_failed'));
        if (window.console) {
            window.console.log(o);
        }
    }
};

QueryBase.prototype._resetDescriptionContainer = function() {
    if (!document.getElementById("js-description-container")) {
        return;
    }

    var view = new SQLShare.View.SavedQuery.DescriptionArea(this._model);
    document.getElementById('js-description-container').innerHTML = view.toString();
    view.postRender();


    YAHOO.util.Dom.removeClass(this.id+"_description_container", "hover");
    YAHOO.util.Event.addListener(this.id+'_description_container', "mouseover", this._highlightDescription, this, true);
    YAHOO.util.Event.addListener(this.id+'_description_container', "mouseout", this._removeDescriptionHighlight, this, true);
    YAHOO.util.Event.addListener(this.id+'_description_container', "click", this._openDescriptionDialog, this, true);

    Solstice.YahooUI.PopIn.lower('edit_description_tags');
};

QueryBase.prototype._highlightDescription = function(ev) {
    YAHOO.util.Dom.addClass(this.id+"_description_container", "hover");
};

QueryBase.prototype._removeDescriptionHighlight = function(ev) {
    YAHOO.util.Dom.removeClass(this.id+"_description_container", "hover");
};

QueryBase.prototype._openDescriptionDialog = function(ev) {
    var query = this._model;
    YAHOO.util.Event.removeListener(this.id+'_description_container', "mouseover");
    YAHOO.util.Event.removeListener(this.id+'_description_container', "mouseout");
    YAHOO.util.Event.removeListener(this.id+'_description_container', "click");

    var popin = Solstice.YahooUI.PopIn.init('edit_description_tags', true);
    popin.cfg.setProperty('width', '640px');

    popin.setHeader(Solstice.Lang.getString('SQLShare', 'edit_dataset_description_tags'));

    var view = this._getChangeDescriptionView();
    var body = view.toString();

    this._removeDescriptionHighlight();
    popin.setBody(body);
    popin.show();
    view.postRender();

    this._buildTagger();

    this._description_popin = popin;

    YAHOO.util.Event.addListener(this.id+'_save_description', "click", this._beginDescriptionSave, this, true);
    YAHOO.util.Event.addListener(this.id+'_cancel_description', "click", this._cancelDescriptionSave, this, true);
};

QueryBase.prototype._buildTagger = function() {
    var is_dataset_owner = false;
    if (this._model.owner == solstice_user.login_name) {
        is_dataset_owner = true;
    }

    var raw_tags = this._model.tags;

    var tag_hash = {};
    for (var pc = 0; pc < raw_tags.length; pc++) {
        var person_tags = raw_tags[pc].tags;
        var owner = raw_tags[pc].name;

        var view_only = true;
        if (owner == solstice_user.login_name || is_dataset_owner) {
            view_only = false;
        }

        for (var t = 0; t < person_tags.length; t++) {
            tag_hash[person_tags[t]] = {
                view_only: view_only
            };

        }
    }

    var tag_set = SQLShare._ALL_TAGS || {};
    var datasource = [];
    for (tag in tag_set) {
        datasource.push(tag);
    }

    var me = this;
    YUI().use('tagger', function(Y) {
        var tags = new Y.Tagger('tag_container', {
            tags: tag_hash,
            datasource: datasource
        });
        tags.initialize();
        me._tagger = tags;
    });

};

QueryBase.prototype._cancelDescriptionSave = function(ev) {
    YAHOO.util.Event.stopEvent(ev);
    var container = document.getElementById(this.id+'_description_container');

    var obj_name = this._getObjectDescription();
    container.innerHTML = obj_name.encodeHTML();

    this._resetDescriptionContainer();
};

QueryBase.prototype._beginDescriptionSave = function(ev) {
    if (this._model.owner == solstice_user.login_name) {
        var new_description = document.getElementById(this.id+'_description').value;

        if (new_description == this._getObjectDescription()) {
            this._saveTags();
            return;
        }

        this._setObjectDescription(new_description);

        var container = document.getElementById(this.id+'_description_container');
        container.innerHTML = new_description.encodeHTML();
        this.AsyncPUT(this._getRestRoot()+"/proxy/REST.svc/v2/db/"+this._getURIFragment(), this._model, this._saveTags);
    }
    else {
        this._saveTags();
    }
};

QueryBase.prototype._saveTags = function(o) {
    var data = this._getNewTagData();

    if (data.is_changed) {
        this.AsyncPUT(this._getRestRoot()+"/proxy/REST.svc/v2/db/"+this._getURIFragment()+"/tags", data.tags, this._postSaveDescription, data.tags);
    }
    else {
        return this._postSaveDescription({ code: 200 }, data.tags);
    }

};

QueryBase.prototype._postSaveDescription = function(o, tags) {
    if (o.code == 200) {
        this._model.tags = tags;
        (new SQLShare()).drawSidebarLists();
    }
    this._resetDescriptionContainer();
};

QueryBase.prototype._togglePublic = function() {
    this._model.is_public = !this._model.is_public;
    this.AsyncPUT(this._getRestRoot()+"/proxy/REST.svc/v2/db/"+this._getURIFragment(), this._model, this._postTogglePublic);

    this._renderTo(this.id+'_is_public', 'table/toggling_public.html', {});
};

QueryBase.prototype._postTogglePublic = function(o) {
    // override in subclasses...
}

QueryBase.prototype._processQuery = function() {
    this.abortCurrentRequest();
    var query = this._editor.getCode();
    Solstice.Element.show('new_query_preview_panel');
    Solstice.Element.hide('dataset_preview_header');

    SQLShare.onChangeContent.fire();

    this._renderTo(this.id+"_results", 'query/running.html', {});
    // Should this be configurable anywhere?
    var max_rows = SQLShare.Constants.MAX_PREVIEW_ROWS;
    this.setCurrentRequest(this.AsyncPOST(this._getRestRoot()+"/proxy/REST.svc/v2/db", { sql: query, max_records: max_rows, sleep: 0 }, this._postQuery));
};

QueryBase.prototype._postQuery = function(o) {
    if (o.code == 202) {
        var new_location = o.conn.getResponseHeader['Location'];
        var full_url = new_location;
        this._full_url = full_url;
        this.AsyncGET(full_url, this._postInitialRedirect);
    }
    else {
        var error;
        if (o.data) {
            error = Solstice.String.encodeHTML(o.data.error);
        }
        if (o.code == 414) {
            error = Solstice.Lang.getString('SQLShare', 'error_query_too_long');
        }
        if (error == "") {
            error = Solstice.Lang.getString('SQLShare', 'error_query_generic');
        }
        this._renderTo(this.id+"_results", "query/error.html", { error: error });
    }
};

QueryBase.prototype._postInitialRedirect = function(o) {
    var query = this;
    var full_url = this._full_url;
    if (o.code == 202) {
        this.setResultsTimeout(window.setTimeout(function() { query._waitForQueryResults(full_url, 1) }, 2000));
    }
    else if (o.code == 200) {
        this._finishQuery(o.data);
    }
    else {
        if (o.data) {
            error = Solstice.String.encodeHTML(o.data.error);
        }
        if (o.code == 414) {
            error = Solstice.Lang.getString('SQLShare', 'error_query_too_long');
        }
        if (error == "") {
            error = Solstice.Lang.getString('SQLShare', 'error_query_generic');
        }
        this._renderTo(this.id+"_results", "query/error.html", { error: error });
    }

}

QueryBase.prototype._waitForQueryResults = function(full_url, count) {
    this.AsyncGET(full_url, this._postWaitForQueryResults, { count: count });
};

QueryBase.prototype._cancelQuery = function(ev) {
    var matches = this._full_url.match(/([0-9]+)$/);
    var process_id = matches[0];

    this.AsyncDELETE(this._getRestRoot()+'/proxy/REST.svc/v2/db/process/'+process_id, this._postDelete);
};

QueryBase.prototype._postDelete = function(o) {
    if (o.code == 410) {
        this.clearResultsTimeout();
        Solstice.Element.hide('new_query_preview_panel');

        Solstice.Message.setSuccess(Solstice.Lang.getMessage('SQLShare', 'queued_query_cancelled'));
    }
};

QueryBase.prototype._postWaitForQueryResults = function(o, args) {
    var count = args.count;
    if (count == 1) {
        Solstice.Element.show('query_in_queue');
        YAHOO.util.Event.addListener('cancel_query', "click", this._cancelQuery, this, true);
    }
    var full_url = this._full_url;
    if (o.code == 202) {
        var query = this;
         this.setResultsTimeout(window.setTimeout(function() { query._waitForQueryResults(full_url, count + 1) }, 5000));
    }
    else if (o.code == 200) {
        this._finishQuery(o.data);
    }
    else {
        var error;
        if (o.data) {
            error = Solstice.String.encodeHTML(o.data.error);
        }
        if (o.code == 414) {
            error = Solstice.Lang.getString('SQLShare', 'error_query_too_long');
        }
        if (error == "") {
            error = Solstice.Lang.getString('SQLShare', 'error_query_generic');
        }
        this._renderTo(this.id+"_results", "query/error.html", { error: error });
    }
};

QueryBase.prototype._finishQuery = function(data) {
    var header = document.getElementById('dataset_preview_header');
    if (header) {
        document.getElementById('preview_total_rows').innerHTML = data.rows_total;
        if (data.rows_total < SQLShare.Constants.MAX_PREVIEW_ROWS) {
            document.getElementById('preview_max_rows').innerHTML = data.rows_total;
        }
        else {
            document.getElementById('preview_max_rows').innerHTML = SQLShare.Constants.MAX_PREVIEW_ROWS;
            document.getElementById('preview_total_rows').innerHTML = Solstice.Lang.getString('SQLShare', 'preview_found_max_hits', { max: SQLShare.Constants.MAX_PREVIEW_ROWS });
        }
        var column_count = data.columns.length;
        document.getElementById('preview_total_cols').innerHTML = column_count;
        if (column_count < SQLShare.Constants.MAX_PREVIEW_COLS) {
            document.getElementById('preview_max_cols').innerHTML = column_count;
        }
        else {
            document.getElementById('preview_max_cols').innerHTML = SQLShare.Constants.MAX_PREVIEW_COLS;
        }


        Solstice.Element.show('dataset_preview_header');
    }

    var cols = [];
    var len = data.columns.length;
    for (var i = 0; i < len; i++) {
        cols.push(data.columns[i].name);
    }

    this._drawTable(this.id+"_results", cols, data.sample_data);
};

QueryBase.prototype._saveQueryAs = function() {
    var popin = Solstice.YahooUI.PopIn.init('save_query_as', true);
    popin.cfg.setProperty('width', '440px');

    popin.setHeader(Solstice.Lang.getString('SQLShare', 'save_query_title'));

    var description;
    var name;
    var is_public;
    if (this._model) {
        description = this._model.description;
        name = this._model.name;
        is_public = this._model.is_public;
    }
    var view = new SQLShare.View.Query.SavePanel({
        id: this.id,
        description: description,
        name: name,
        is_public: is_public
    });

    popin.setBody(view.toString());
    popin.show();
    view.postRender();
    this._save_panel_view = view;

    YAHOO.util.Event.addListener(this.id+'_save', "click", this._save, this, true);
    YAHOO.util.Event.addListener(this.id+'_cancel', "click", this._cancelSaveAs, this, true);
};

QueryBase.prototype._cancelSaveAs = function(ev) {
    if (ev) {
        YAHOO.util.Event.stopEvent(ev);
    }
    var popin = Solstice.YahooUI.PopIn.get('save_query_as');
    popin.hide();
};

QueryBase.prototype._save = function() {
    var name = document.getElementById(this.id+"_query_name").value;
    var description = document.getElementById(this.id+"_query_desc").value;


    if (name.match(/[^a-z0-9!@$%^&\*\(\)_\-={}\|;:'",\.<> ]/i)) {
        Solstice.Element.show(this.id+"_query_name_error");
        return;
    }

    var is_public = false;
    if (document.getElementById(this.id+"_is_public_check").checked) {
        is_public = true;
    }

    var query;
    if (this._editor) {
        query = this._editor.getCode();
    }
    else {
        query = this._query;
    }


    var is_snapshot = false;
    if (this._model && this._model.is_snapshot) {
        is_snapshot = true;
        query = this._model.sql_code;
    }

    this.AsyncPUT(this._getRestRoot()+"/proxy/REST.svc/v2/db/dataset/"+solstice_user.sqlshare_schema+"/"+encodeURIComponent(name),
        {
            sql_code: query,
            description: description,
            is_public: is_public,
            is_snapshot: is_snapshot
        }, this._postSave);
};

QueryBase.prototype._postSave = function(o) {
    if (o.code == 201 || o.code == 200) {
        var tags = this._save_panel_view.getTagger().getTags();
        if (tags) {
            this.AsyncPUT(this._getRestRoot()+"/proxy/REST.svc/v2/db/dataset/"+solstice_user.sqlshare_schema+"/"+o.data.name+"/tags", [{"name":solstice_user.sqlshare_schema, "tags":tags }], this._postSaveTags, o);
        }
        else {
            this._postSaveAs(o);
        }
    }
    else {
        Solstice.Message.setError(Solstice.Lang.getMessage('SQLShare', 'error_saving_query'));
    }
};


QueryBase.prototype._postSaveTags = function(o, first_response) {
    if (o.code == 201 || o.code == 200) {
        this._postSaveAs(first_response);
    }
    else {
        Solstice.Message.setError(Solstice.Lang.getMessage('SQLShare', 'error_saving_query'));
    }
};

QueryBase.prototype._getNewTagData = function() {
    var has_change = false;
    var is_dataset_owner = false;

    if (this._model.owner == solstice_user.login_name) {
        is_dataset_owner = true;
    }

    var starting_tags = this._model.tags;

    var starting_tag_hash = {};
    for (var pc = 0; pc < starting_tags.length; pc++) {
        var person_tags = starting_tags[pc].tags;
        var owner = starting_tags[pc].name;

        for (var t = 0; t < person_tags.length; t++) {
            starting_tag_hash[person_tags[t]] = true;
        }
    }

    var current_tags = this._tagger.getTags();
    var current_tag_hash = {};

    var new_tags_for_user = [];
    for (var i = 0; i < current_tags.length; i++) {
        var tag = current_tags[i];
        current_tag_hash[tag] = true;

        if (!starting_tag_hash[tag]) {
            has_change = true;
            new_tags_for_user.push(tag);
        }
    }

    var return_tags = [];

    for (var pc = 0; pc < starting_tags.length; pc++) {
        var person_tags = starting_tags[pc].tags;
        var owner = starting_tags[pc].name;

        if (owner == solstice_user.login_name) {
            for (var t = 0; t < person_tags.length; t++) {
                var tag = person_tags[t];
                if (!current_tag_hash[tag]) {
                    has_change = true;
                }
                else {
                    new_tags_for_user.push(tag);
                }
            }
        }
        else {
            if (is_dataset_owner) {
                var new_user_tags = [];
                for (var t = 0; t < person_tags.length; t++) {
                    var tag = person_tags[t];
                    if (!current_tag_hash[tag]) {
                        has_change = true;
                    }
                    else {
                        new_user_tags.push(tag);
                    }
                }
                return_tags.push({
                    name: owner,
                    tags: new_user_tags
                });
            }
            else {
                return_tags.push(starting_tags[pc]);
            }
        }
    }

    return_tags.push({
        name: solstice_user.login_name,
        tags: new_tags_for_user
    });

    return {
        is_changed: has_change,
        tags: return_tags
    };
};

QueryBase.prototype._getURIFragment = function() {
    return 'dataset/'+this.query_id;
};


