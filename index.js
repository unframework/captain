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

function previewPicture(camera) {
    return new Promise(function (resolve, reject) {
        camera.takePicture({
            preview: true
        }, function (er, output) {
            if (er) {
                reject(new Error('got preview error: ' + er));
                return;
            }

            resolve(output);
        });
    });
}

function takeSeries(camera) {
    var frameCount = 25;
    var prefix = 'pic_' + new Date().getTime() + '_';
    var counter = 0;

    function doFrame() {
        console.log('frame:', counter);

        var fileName = prefix + counter + '.jpg';
        var filePath = __dirname + '/' + filePath;

        return storePicture(camera).then(function () {
            console.log('done frame:', counter);
        });

        // return takePicture(camera).then(function (output) {
        //     console.log('writing output size:', output.length);

        //     // async file write on the side
        //     fs.writeFile(filePath, output, function (err) {
        //         if (err) {
        //             throw new Error('got error writing file: ' + err);
        //         }

        //         console.log('wrote output file!');
        //     });
        // });
    }

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
                throw new Error('operation in progress!');
            }

            currentOp = doFrame().then(function () {
                currentOp = null;
            }).catch(function (err) {
                clearInterval(interval);
                reject(err);
            });
        }, 5000);
    });
}

findCamera().then(function (camera) {
    return camera;
    // // drop mirror to allow for remote focus drive
    // return previewPicture(camera).then(function (value) {
    //     return camera;
    // });
}).then(function (camera) {
    // save files locally
    return setCameraConfig(camera, 'capturetarget', 'Memory card'); // per http://gphoto-software.10949.n7.nabble.com/Problem-setting-capturetarget-on-Canon-G9-td13758.html
}).then(function (camera) {
    return camera;
    // return getCameraConfig(camera, 'autofocusdrive').then(function (value) {
    //     if (value !== 0) {
    //         console.log('turning off AF');
    //         return setCameraConfig(camera, 'autofocusdrive', 0);
    //     } else {
    //         console.log('already turned off AF');
    //         return camera;
    //     }
    // });
}).then(function (camera) {
    return takeSeries(camera);
}).catch(function (e) {
    console.error(e);
});
