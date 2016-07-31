var vdomLive = require('vdom-live');

var AFWeb = require('./lib/AFWeb');

vdomLive(function (renderLive, h) {
    var server = require('__server')();
    var af = new AFWeb(h);

    currentCameraModel = null;

    var whenCameraReady = server.getWhenCameraReady().then(function (cameraModel) {
        currentCameraModel = cameraModel;
    });

    var root = new af.topic('Do something with camera', function () {
        return new af.delay(whenCameraReady, 'Connecting to camera...', function () {
            if (currentCameraModel === null) {
                return new af.outcome('Could not find camera');
            }

            return createMainScreen(af, server, currentCameraModel);
        });
    });

    document.body.appendChild(renderLive(function () {
        return root._renderVDom();
    }));
});

function createMainScreen(af, server, currentCameraModel) {
    return new af.readout(function () {
        return {
            'Camera Model': currentCameraModel
        }
    });
}
