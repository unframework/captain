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
    var currentFrameCount = null;
    var currentDelayMillis = null;
    var currentCounter = null;

    var statusIsPending = false; // @todo show this as spinner?

    setInterval(function () {
        if (statusIsPending) {
            return;
        }

        statusIsPending = true;

        server.getCaptureStatus().then(function (status) {
            statusIsPending = false;

            currentFrameCount = status ? status.frameCount : null;
            currentDelayMillis = status ? status.delayMillis : null;
            currentCounter = status ? status.counter : null;
        });
    }, 500);

    var captureForm = new af.inputMap({
        frameCount: new af.inputText(),
        delayMillis: new af.inputText()
    });

    return new af.group([
        new af.readout(function () {
            return {
                'Camera Model': currentCameraModel,
                'Length': renderNullable(currentFrameCount, 'frame(s)'),
                'Delay': renderNullable(currentDelayMillis, 'ms'),
                'Counter': renderNullable(currentCounter, 'frame(s)')
            };
        }),
        new af.action('Start Capture', function () {
            return currentFrameCount === null;
        }, captureForm, function (data) {
            console.log(data);

            return server.startCapture();
        }),
        new af.action('Stop Capture', function () {
            return currentFrameCount !== null;
        }, null, function () {
            return server.stopCapture();
        })
    ]);
}

function renderNullable(amount, units) {
    return amount !== null ? amount + ' ' + units : '--';
}
