var vdomLive = require('vdom-live');

vdomLive(function (renderLive, h) {
    var server = require('__server')();
    var af = new AFWeb(h);

    currentCameraStatus = null;

    var whenCameraReady = server.getWhenCameraReady().then(function (cameraStatus) {
        currentCameraStatus = cameraStatus;
    });

    function getAffordances(af) {
        return af.topic('Do something with camera', function () {
            return af.delay(whenCameraReady, 'Connecting to camera...', function () {
                if (currentCameraStatus === null) {
                    return af.status('Could not find camera');
                }

                return af.status('Camera loaded! ' + currentCameraStatus);
            });
        });
    }

    document.body.appendChild(renderLive(function () {
        return getAffordances(af);
    }));
});

// @todo construct actual affordance state to render
function AFWeb(h) {
    return {
        topic: function (display, bodyCb) {
            return h('fieldset', [
                h('legend', [ display ]),
                bodyCb()
            ]);
        },

        delay: function (pendingPromise, display, bodyCb) {
            return pendingPromise.isFulfilled()
                ? bodyCb()
                : h('div', [
                    h('span', [ display ])
                ]);
        },

        status: function (display) {
            return h('div', [ display ]);
        }
    };
}
