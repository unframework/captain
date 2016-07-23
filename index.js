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
