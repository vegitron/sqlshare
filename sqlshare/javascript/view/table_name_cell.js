SQLShare.View.TableNameCell = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'all_queries/table_name_cell.html';
};

SQLShare.View.TableNameCell.prototype = new SQLShare.View();

SQLShare.View.TableNameCell.prototype.generateParams = function() {
    var model = this.model;

    var name_length = this._getStringPixelWidth(model.name);
    var workspace_width = document.getElementById('ss_app_workspace_table').offsetWidth;

    // The offset here is for the other columns/padding/whatever.  another guessed offset
    var name_column_width = workspace_width - 300;
    var desc_max = name_column_width - name_length;

    var name = this._getTruncatedString(model.description, desc_max);
    if (name.length != model.description.length) {
        name += "...";
    }

    var url = model.url.replace(/^\/REST.svc\/v2\/db\/dataset/, 'query');

    this.setParam('description', name.encodeHTML());
    this.setParam('owner', encodeURIComponent(model.owner).encodeHTML());
    this.setParam('name', model.name.encodeHTML());
    this.setParam('uri_name', encodeURIComponent(model.name).encodeHTML());
    this.setParam('url', url.encodeHTML());

    for (var i = 0; i < model.tags.length; i++) {
        this.addParam('tags', {
            name: model.tags[i].encodeHTML(),
            url_name: encodeURIComponent(model.tags[i])
        });
    }
};


