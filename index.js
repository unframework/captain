var fs = require('fs');
var gphoto2 = require('gphoto2');

var GPhoto = new gphoto2.GPhoto2();

// list cameras
GPhoto.list(function (list) {
    if (list.length !== 1) throw new Error('single camera expected');

    var camera = list[0];
    console.log('using camera:', camera.model);

    // // get configuration tree
    // camera.getConfig(function (er, settings) {
    //     console.log(settings);
    // });

    // Set configuration values
    camera.setConfigValue('capture', 'on', function (er) {
        if (er) {
            throw new Error('got error: ' + er);
        }

        camera.takePicture({
            download: true
        }, function (er, output) {
            if (er) {
                throw new Error('got error: ' + er);
            }

            console.log('writing output size:', output.length);
            fs.writeFile(__dirname + '/picture.cr2', output, function (err) {
                if (err) {
                    throw new Error('got error writing file: ' + err);
                }

                console.log('wrote output file!');
            });
        });
    });
});
