var vdomLive = require('vdom-live');

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

function AFWeb(h) {
    return {
        topic: function (display, bodyCb) {
            var body = bodyCb();

            this._renderVDom = function () {
                return h('fieldset', [
                    h('legend', [ display ]),
                    body._renderVDom()
                ]);
            };
        },

        delay: function (pendingPromise, display, bodyCb) {
            var body = null;
            var isFulfilled = false;

            pendingPromise.then(function () {
                body = bodyCb();
                isFulfilled = true;
            });

            this._renderVDom = function () {
                return isFulfilled
                    ? body._renderVDom()
                    : h('div', [
                        h('span', [ display ])
                    ]);
            };
        },

        status: function (display) {
            this._renderVDom = function () {
                return h('div', [ display ]);
            };
        }
    };
}
