var AllTables = function(div_id) {
    this.id = div_id;
};

AllTables.prototype = new SSBase();

AllTables.prototype.draw = function() {
    this._renderTo(this.id, 'all_tables/loading.html', { id : this.id });
    this._fetchTables();
};

AllTables.prototype._fetchTables = function() {
    this.AsyncGET(this._getRestRoot()+"/proxy/REST.svc/v1/db/table", this._postFetch);
};

AllTables.prototype._postFetch = function(o) {
    if (o.code == 200) {
        this._drawTables(o.data);
    }
    else {
        this._renderTo(this.id, 'all_tables/error.html', {});
    }
};

AllTables.prototype._drawTables = function(table_data) {
    this._renderTo(this.id, 'all_tables/list.html', { tables: table_data });
};


