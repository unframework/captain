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

function AFWebInputMap(h, inputMap) {
    // static outcome message
    this._renderVDom = function () {
        return h('div', {}, Object.keys(inputMap).map(function (inputKey) {
            return h('label', { style: { display: 'block' } }, [ inputKey, ' ', inputMap[inputKey]._renderVDom() ]);
        }));
    };

    this._collectInput = function () {
        // collect resolved key-value pairs and then return map
        return Promise.all(Object.keys(inputMap).map(function (inputKey) {
            return inputMap[inputKey]._collectInput().then(function (v) {
                return [ inputKey, v ];
            });
        })).then(function (list) {
            var outMap = Object.create(null);

            list.forEach(function (kv) {
                outMap[kv[0]] = kv[1];
            });

            return outMap;
        });
    };
}

function AFWebInputText(h) {
    var inputNode = document.createElement('input');
    inputNode.type = 'text';

    var widget = {
        type: 'Widget',
        init: function () {
            return inputNode;
        }
    };

    // static outcome message
    this._renderVDom = function () {
        return widget;
    };

    this._collectInput = function () {
        return Promise.resolve(inputNode.value);
    };
}

function AFWebAction(h, display, isEnabledCb, dataBody, actionCb) {
    var isPending = false;

    // @todo this whole thing could be broken into smaller pieces: pending action affordance and data-collect
    function collectInput() {
        return dataBody
            ? dataBody._collectInput()
            : Promise.resolve();
    }

    function onSubmit(e) {
        e.preventDefault();

        // extra safety check
        if (!isEnabledCb()) {
            throw new Error('not enabled!');
        }

        isPending = true;

        collectInput().then(function (input) {
            return actionCb(input);
        }).then(function () {
            isPending = false;
        });
    }

    this._renderVDom = function () {
        var isEnabled = isEnabledCb();

        return h('form', { onsubmit: onSubmit }, [
            dataBody ? dataBody._renderVDom() : null,
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
        inputMap: AFWebInputMap.bind(null, h),
        inputText: AFWebInputText.bind(null, h),
        action: AFWebAction.bind(null, h),
        group: AFWebGroup.bind(null, h),
        outcome: AFWebOutcome.bind(null, h)
    };
}

module.exports = AFWeb;
