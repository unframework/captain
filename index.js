var fs = require('fs');
var Promise = require('bluebird');
var RemoteControl = require('remote-control');

var currentCamera = null;

var whenCameraReady = require('./lib/findCamera').then(function (camera) {
    console.log('found camera');
    currentCamera = camera;
});

var currentCaptureSeries = null;

function CaptureSeries(camera, frameCount, delayMillis) {
    this.frameCount = frameCount;
    this.delayMillis = delayMillis;
    this.counter = 0;

    this._stopSignal = false;

    this.whenStopped = (function () {
        // save files locally
        return camera.setConfig('capturetarget', 'Memory card'); // per http://gphoto-software.10949.n7.nabble.com/Problem-setting-capturetarget-on-Canon-G9-td13758.html
    })().then(function () {
        return runSeries(frameCount, delayMillis, function (counter) {
            if (this._stopSignal) {
                throw new Error('capture interrupted!');
            }

            this.counter = counter;
            console.log(new Date(), 'frame:', counter);

            return camera.storePicture().then(function () {
                console.log(new Date(), 'done frame:', counter);
            });
        }.bind(this));
    }.bind(this)).catch(function (e) {
        console.error(e);
    });
}

CaptureSeries.prototype.stop = function () {
    this._stopSignal = true;
}

var server = {
    getWhenCameraReady: function () {
        // returning failure to connect as non-error
        // (to keep real transport errors distinct)
        return whenCameraReady.then(function () {
            return currentCamera.model;
        }).catch(function () {
            return null;
        });
    },
    getCaptureStatus: function () {
        if (!currentCaptureSeries) {
            return null;
        }

        return {
            frameCount: currentCaptureSeries.frameCount,
            delayMillis: currentCaptureSeries.delayMillis,
            counter: currentCaptureSeries.counter
        };
    },
    startCapture: function () {
        if (currentCaptureSeries) {
            throw new Error('already capturing');
        }

        currentCaptureSeries = new CaptureSeries(currentCamera, 100, 5000);
        currentCaptureSeries.whenStopped.then(function () {
            currentCaptureSeries = null;
        });
    },
    stopCapture: function () {
        currentCaptureSeries.stop();
    }
};

var rc = new RemoteControl(server, './client.js');
console.log('listening for Web client');

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

            currentOp = Promise.resolve().then(function () {
                return doFrame(counter);
            }).then(function () {
                currentOp = null;
            }).catch(function (err) {
                clearInterval(interval);
                reject(err);
            });
        }, delayMillis);
    });
}


if (false) {
    var frameCount = parseInt(process.argv[2], 10) || (function () { throw new Error('need frame count'); })();
    var delayMillis = parseInt(process.argv[3], 10) || (function () { throw new Error('need delay in millis'); })();

    require('./lib/findCamera').then(function (camera) {
        // save files locally
        return camera.setConfig('capturetarget', 'Memory card').then(function () { return camera; }); // per http://gphoto-software.10949.n7.nabble.com/Problem-setting-capturetarget-on-Canon-G9-td13758.html
    }).then(function (camera) {
        var prefix = 'pic_' + new Date().getTime() + '_';

        return runSeries(frameCount, delayMillis, function (counter) {
            console.log(new Date(), 'frame:', counter);

            var fileName = prefix + counter + '.jpg';

            return camera.storePicture().then(function () {
                console.log(new Date(), 'done frame:', counter);
            });
        });
    }).catch(function (e) {
        console.error(e);
    });
}
