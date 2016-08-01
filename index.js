var fs = require('fs');
var Promise = require('bluebird');

var frameCount = parseInt(process.argv[2], 10) || (function () { throw new Error('need frame count'); })();
var delayMillis = parseInt(process.argv[3], 10) || (function () { throw new Error('need delay in millis'); })();

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
