var vdomLive = require('vdom-live');

var AFWeb = require('./lib/AFWeb');

vdomLive(function (renderLive, h) {
    var server = require('__server')();
    var af = new AFWeb(h);

    currentCameraStatus = null;

    var whenCameraReady = server.getWhenCameraReady().then(function (cameraStatus) {
        currentCameraStatus = cameraStatus;
    });

    var root = new af.topic('Do something with camera', function () {
        return new af.delay(whenCameraReady, 'Connecting to camera...', function () {
            if (currentCameraStatus === null) {
                return new af.status('Could not find camera');
            }

            return new af.status('Camera loaded! ' + currentCameraStatus);
        });
    });

    document.body.appendChild(renderLive(function () {
        return root._renderVDom();
    }));
});
