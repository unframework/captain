var fs = require('fs');
var gphoto2 = require('gphoto2');
var Promise = require('bluebird');

var GPhoto = new gphoto2.GPhoto2();

function findCamera() {
    return new Promise(function (resolve, reject) {
        GPhoto.list(function (list) {
            if (list.length !== 1) {
                reject(new Error('single camera expected'));
                return;
            }

            var camera = list[0];
            console.log('using camera:', camera.model);

            resolve(camera);
        });
    });
}

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

function getCameraConfig(camera, name) {
    return new Promise(function (resolve, reject) {
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
}

function setCameraConfig(camera, name, value) {
    return new Promise(function (resolve, reject) {
        camera.setConfigValue(name, value, function (er) {
            if (er) {
                reject(new Error('error setting config: ' + er));
                return;
            }

            resolve(camera);
        });
    });
}

function takePicture(camera) {
    return new Promise(function (resolve, reject) {
        camera.takePicture({
            download: true
        }, function (er, output) {
            if (er) {
                reject(new Error('got error: ' + er));
                return;
            }

            resolve(output);
        });
    });
}

findCamera().then(function (camera) {
    return setCameraConfig(camera, 'capture', 'on');
}).then(function (camera) {
    return takePicture(camera).then(function (output) {
        console.log('writing output size:', output.length);

        // async file write on the side
        fs.writeFile(__dirname + '/picture.jpg', output, function (err) {
            if (err) {
                throw new Error('got error writing file: ' + err);
            }

            console.log('wrote output file!');
        });

        return camera;
    });
});
