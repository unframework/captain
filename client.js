var vdomLive = require('vdom-live');

vdomLive(function (renderLive) {
    var server = require('__server')();

    currentCameraStatus = null;

    var whenCameraReady = server.getWhenCameraReady().then(function (cameraStatus) {
        console.log('found camera');
        currentCameraStatus = cameraStatus;
    });

    var liveDOM = renderLive(function (h) {
        return h('div', [
            JSON.stringify(currentCameraStatus)
        ]);
    });

    document.body.appendChild(liveDOM);
});
