var fs = require('fs');
var gphoto2 = require('gphoto2');
var Promise = require('bluebird');

var GPhoto = new gphoto2.GPhoto2();

var frameCount = parseInt(process.argv[2], 10) || (function () { throw new Error('need frame count'); })();
var delayMillis = parseInt(process.argv[3], 10) || (function () { throw new Error('need delay in millis'); })();

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

function storePicture(camera) {
    return new Promise(function (resolve, reject) {
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
}

function runSeries(frameCount, delayMillis, doFrame) {
    var counter = 0;

    return new Promise(function (resolve, reject) {
        var currentOp = null;

        var interval = setInterval(function () {
            // track frame count and stop next invocation when needed
            counter += 1;

            if (counter > frameCount) {
                clearInterval(interval);
                resolve();
                return;
            }

            if (currentOp !== null) {
                reject(new Error('operation in progress!'));
                return;
            }

            currentOp = doFrame(counter).then(function () {
                currentOp = null;
            }).catch(function (err) {
                clearInterval(interval);
                reject(err);
            });
        }, delayMillis);
    });
}

findCamera().then(function (camera) {
    // save files locally
    return setCameraConfig(camera, 'capturetarget', 'Memory card'); // per http://gphoto-software.10949.n7.nabble.com/Problem-setting-capturetarget-on-Canon-G9-td13758.html
}).then(function (camera) {
    var prefix = 'pic_' + new Date().getTime() + '_';

    return runSeries(frameCount, delayMillis, function (counter) {
        console.log(new Date(), 'frame:', counter);

        var fileName = prefix + counter + '.jpg';

        return storePicture(camera).then(function () {
            console.log(new Date(), 'done frame:', counter);
        });
    });
}).catch(function (e) {
    console.error(e);
});
