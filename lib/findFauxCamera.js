function FauxCamera() {
    this.model = 'Fake Camera MkIII';
}

function createTimeoutPromise() {
    return new Promise(function (resolve) {
        setTimeout(resolve, 750);
    });
}

FauxCamera.prototype.getConfig = function (name) {
    return createTimeoutPromise().then(function () { return null; });
};

FauxCamera.prototype.setConfig = function (name, value) {
    return createTimeoutPromise();
};

FauxCamera.prototype.storePicture = function () {
    console.log('faux shutter click!');

    return createTimeoutPromise();
};

module.exports = Promise.resolve(new FauxCamera());
