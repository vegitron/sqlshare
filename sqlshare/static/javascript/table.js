var Table = function(div_id, table_id) {
    this.id = div_id;
    this.table_id = table_id;
};

Table.prototype = new QueryBase();

Table.prototype.draw = function() {
    this._renderTo(this.id, 'table/loading.html', { id : this.id });
    this._fetchTable();
};

Table.prototype._fetchTable = function() {
    this.AsyncGET(this._getRestRoot()+"/proxy/REST.svc/v1/db/table/"+this.table_id, this._postFetch);
};

Table.prototype._postFetch = function(o) {
    if (o.code == 200) {
        this._drawView(o.data);
    }
    else {
        this._renderTo(this.id, 'table/error.html', {});
    }
};

Table.prototype._drawView = function(table_data) {
    table_data.container_id = this.id;

    this._model = table_data;
    this._renderTo(this.id, new SQLShare.View.Table(table_data));
    var columns = [];
    for (var column in table_data.columns) {
        columns.push(table_data.columns[column].name);
    }

    this._table_name = table_data.tablename;
    this._drawTable(this.id+"_table_preview", columns, table_data.sample_data);
    YAHOO.util.Event.addListener(this.id+'_download_query', "click", this._downloadQuery, this, true);

    this._resetNameContainer();
    this._resetDescriptionContainer();
    YAHOO.util.Event.addListener(this.id+'_is_public', 'click', this._togglePublic, this, true);
};

Table.prototype._downloadQuery = function() {
    var query = "SELECT * FROM ["+this._table_name+"]";
    Solstice.Element.hide(this.id+'_download_error');
    this._downloadFile(query, this._onDownloadError);
};

Table.prototype._onDownloadError = function() {
    var error = this._getDownloadError();
    var error_div = document.getElementById(this.id+'_download_error');
    error_div.innerHTML = error.innerHTML;
    Solstice.Element.show(error_div);
};

Table.prototype._getObjectType = function() { return 'table'; };
Table.prototype._getObjectName = function() { return this._model.tablename; };
Table.prototype._setObjectName = function(name) { this._model.tablename = name; };
Table.prototype._getRenameView = function() { return new SQLShare.View.Table.Rename(this._model); };

Table.prototype._getObjectDescription = function() { return this._model.description; };
Table.prototype._setObjectDescription = function(name) { this._model.description = name; };
Table.prototype._getChangeDescriptionView = function() { return new SQLShare.View.Table.ChangeDescription(this._model); };
