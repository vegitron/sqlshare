/**
* @constructor
* @class SolsticeUploader
* @extends YAHOO.widget.Uploader
*/
YAHOO.widget.SolsticeUploader = function(containerId, buttonSkin, forceTransparent) {
    YAHOO.widget.Uploader.SWFURL = Solstice.getDocumentBase() + "static/javascript/yui/build/uploader/assets/uploader.swf";

    YAHOO.widget.SolsticeUploader.superclass.constructor.call(this, containerId, buttonSkin, forceTransparent);

    this.createEvent("beforeUploadStart");
    this.createEvent("uploadCompleteSuccess");
    this.createEvent("uploadCompleteError");
    this.createEvent("uploadAllFinished");

    this.addListener('contentReady', this.onContentReady, this, true);
    this.addListener('fileSelect', this.onFileSelect, this, true);
    this.addListener('uploadStart', this.onUploadStart, this, true);
    this.addListener('uploadProgress', this.onUploadProgress, this, true);
    this.addListener('uploadCancel', this.onUploadCancel, this, true);
    this.addListener('uploadComplete', this.onUploadComplete, this, true);
    this.addListener('uploadCompleteData', this.onUploadCompleteData, this, true);
    this.addListener('uploadError', this.onUploadError, this, true);

};

YAHOO.lang.extend(YAHOO.widget.SolsticeUploader, YAHOO.widget.Uploader, {
    _uploadURL: Solstice.getDocumentBase() + "/sqlshare/upload/",

    setUploadURL: function(url) {
        if (url !== null) {
            this._uploadURL = url;
        }
    },
    
    _uploadParams: {
        is_clean: true,
        is_json : true
    },

    setUploadParams: function(params) {
        this._uploadParams = params;
    },

    onContentReady: function() { 
        // Allows the uploader to send log messages to trace, as well as to YAHOO.log
        this.setAllowLogging(false);

        // Multiple files by default
        this.setAllowMultipleFiles(true);            
    },

    onFileSelect: function(event) {
        this._filelist = event.fileList;
        this.startUpload();
    },

    startUpload: function() {
        if (this._filelist !== null && this._uploadURL !== null) {
            var ret = this.fireEvent("beforeUploadStart", this._filelist);
            if (ret === false) {
                return;
            }

            this.disable();
            this._currentCount = 0; 
            for (var item in this._filelist) {
                this._currentCount++;
            }
            this._finishedCount = 0;
            this.setSimUploadLimit(3);
            var params = this._uploadParams;

            params["csrfmiddlewaretoken"] = $("input[name=csrfmiddlewaretoken]").val();
            this.uploadAll(this._uploadURL, 'POST', this._uploadParams, 'file');
        }
    },

    onUploadProgress: function(event) {
    },

    onUploadComplete: function(event) {
        this.enable();
    },

    onUploadStart: function(event) { 
    },

    onUploadError: function(event) {
    },

    onUploadCancel: function(event) {
    },

    onUploadCompleteData: function(event) {
        event.data = JSON.parse(event.data);
        if (event.data && event.data.error === undefined) {
            this.fireEvent("uploadCompleteSuccess", event);
        } else {
            this.fireEvent("uploadCompleteError", event);
        }

        this._finishedCount++;
        if (this._finishedCount == this._currentCount) {
            this.clearFileList();
            this.fireEvent("uploadAllFinished", event);
        }
    },

    setAllowImagesOnly: function(val) {
        this.setFileFilters([]);
        if (val) {
            var ff = new Array({description:'Images', extensions:'*.jpg;*.jpeg;*.png;*.gif;*.bmp'});
            this.setFileFilters(ff);
        }
    }

});

