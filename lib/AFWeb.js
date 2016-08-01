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

function AFWebAction(h, display, isEnabledCb, actionCb) {
    var isPending = false;

    function onSubmit(e) {
        e.preventDefault();

        // extra safety check
        if (!isEnabledCb()) {
            throw new Error('not enabled!');
        }

        isPending = true;

        // wrap everythin in a promise
        Promise.resolve().then(function () {
            return actionCb();
        }).then(function () {
            isPending = false;
        });
    }

    this._renderVDom = function () {
        var isEnabled = isEnabledCb();

        return h('form', { onsubmit: onSubmit }, [
            h('button', { type: 'submit', disabled: isPending || !isEnabled }, [ display ])
        ]);
    };
}

function AFWebGroup(h, bodyList) {
    // static group of related affordances
    this._renderVDom = function () {
        return h('div', bodyList.map(function (b) {
            return b._renderVDom();
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
        action: AFWebAction.bind(null, h),
        group: AFWebGroup.bind(null, h),
        outcome: AFWebOutcome.bind(null, h)
    };
}

module.exports = AFWeb;
