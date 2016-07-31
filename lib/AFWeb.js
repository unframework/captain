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

function AFWebReadout(h, infoMapCb) {
    // live-updated info readout
    this._renderVDom = function () {
        var infoMap = infoMapCb();

        return h('dl', Object.keys(infoMap).map(function (infoMapKey) {
            return [
                h('dt', [ infoMapKey ]),
                h('dd', [ infoMap[infoMapKey] ])
            ];
        }));
    };
}

function AFWebOutcome(h, display) {
    // static outcome message
    this._renderVDom = function () {
        return h('div', [ display ]);
    };
}

function AFWeb(h) {
    return {
        topic: AFWebTopic.bind(null, h),
        delay: AFWebDelay.bind(null, h),
        readout: AFWebReadout.bind(null, h),
        outcome: AFWebOutcome.bind(null, h)
    };
}

module.exports = AFWeb;
