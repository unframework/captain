var vdomLive = require('vdom-live');

var AFWeb = require('./lib/AFWeb');

var viewportNode = document.createElement('meta');
viewportNode.name = 'viewport';
viewportNode.content = 'width = 480';
document.head.appendChild(viewportNode);

document.body.style.margin = 0;
document.body.style.padding = 0;

var rootNode = document.createElement('div');
rootNode.style.width = '480px';
rootNode.style.margin = 'auto';
rootNode.style.padding = '5px';
rootNode.style.background = '#fafefe';
rootNode.style.fontFamily = 'Roboto, Arial, sans';
rootNode.style.fontSize = '24px';
document.body.appendChild(rootNode);

vdomLive(function (renderLive, h) {
    var server = require('__server')();
    var af = new AFWeb(h);

    currentCameraModel = null;

    var whenCameraReady = server.getWhenCameraReady().then(function (cameraModel) {
        currentCameraModel = cameraModel;
    });

    var root = new af.topic('Do something with camera', function () {
        var requestedExit = false;

        return new af.group([
            new af.action('Exit / Restart', function () { return !requestedExit; }, null, function () {
                return server.exit().then(function () {
                    requestedExit = true;
                });
            }),
            new af.delay(whenCameraReady, 'Connecting to camera...', function () {
                if (currentCameraModel === null) {
                    return new af.outcome('Could not find camera');
                }

                return createMainScreen(af, server, currentCameraModel);
            })
        ]);
    });

    rootNode.appendChild(renderLive(function () {
        return root._renderVDom();
    }));
});

function integerValue(v) {
    var n = parseInt(v, 10);

    if (n + '' !== v) {
        throw new Error('integer required');
    }

    return n;
}

function positiveNumber(n) {
    if (n <= 0) {
        throw new Error('must be positive');
    }

    return n;
}

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
        frameCount: new af.inputText(integerValue, positiveNumber, { value: 1000 }),
        delayMillis: new af.inputText(integerValue, positiveNumber, { value: 5000 })
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
        }, captureForm, function (input) {
            return server.startCapture(input.frameCount, input.delayMillis);
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
