function AFWebTopic(h, display, bodyCb) {
    var body = bodyCb();

    this._renderVDom = function () {
        return h('fieldset', [
            h('legend', [ display ]),
            body._renderVDom()
        ]);
    };
}

function AFWebDelay(h, pendingPromise, display, bodyCb) {
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
}

function AFWebStatus(h, display) {
    this._renderVDom = function () {
        return h('div', [ display ]);
    };
}

function AFWeb(h) {
    return {
        topic: AFWebTopic.bind(null, h),
        delay: AFWebDelay.bind(null, h),
        status: AFWebStatus.bind(null, h)
    };
}

module.exports = AFWeb;
