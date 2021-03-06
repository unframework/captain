var Promise = require('bluebird');
var gphoto2 = require('gphoto2');
var GPhoto = new gphoto2.GPhoto2();

function Camera(camera) {
    this._camera = camera;
    this._currentOp = null;

    this.model = camera.model;
}

Camera.prototype._runOpPromise = function (promiseBodyCb) {
    if (this._currentOp) {
        throw new Error('operation in progress');
    }

    this._currentOp = new Promise(promiseBodyCb).then(function (v) {
        this._currentOp = null;

        return v;
    }.bind(this));

    return this._currentOp;
};

Camera.prototype.getConfig = function (name) {
    var camera = this._camera;

    function walkSettingsMap(obj, cb) {
        var keys = Object.keys(obj);
        keys.forEach(function (key) {
            var info = obj[key];

            cb(key, info);

            if (info.children) {
                walkSettingsMap(info.children, cb);
            }
        });
    }

    return this._runOpPromise(function (resolve, reject) {
        camera.getConfig(function (er, settings) {
            var value = null;

            walkSettingsMap(settings, function (key, info) {
                if (key === name) {
                    value = info.value;
                    console.log(key + ':', info.label, '(' + info.type + (info.choices ? '; ' + info.choices.join(', ') : '') + ') =', info.value);
                }
            });

            resolve(value);
        });
    });
};

Camera.prototype.setConfig = function (name, value) {
    var camera = this._camera;

    return this._runOpPromise(function (resolve, reject) {
        camera.setConfigValue(name, value, function (er) {
            if (er) {
                reject(new Error('error setting config: ' + er));
                return;
            }

            resolve();
        });
    });
};

Camera.prototype.storePicture = function () {
    var camera = this._camera;

    return this._runOpPromise(function (resolve, reject) {
        camera.takePicture({
            download: false,
        }, function (er) {
            if (er) {
                reject(new Error('got error: ' + er));
                return;
            }

            resolve();
        });
    });
};

module.exports = new Promise(function (resolve, reject) {
    GPhoto.list(function (list) {
        if (list.length !== 1) {
            reject(new Error('single camera expected'));
            return;
        }

        var camera = list[0];
        console.log('using camera:', camera.model);

        resolve(new Camera(camera));
    });
});
