var nconf = require('nconf');
nconf.argv().env().file({file: './config/config.json'});

var lang = nconf.get('defaultLanguage');
var db = require('mongoose');
db.connect(nconf.get('db-cnn'));

function init(app) {

    var server = app.listen(nconf.get('port'), nconf.get('domain'), function () {
        var host = server.address().address;
        var port = server.address().port;
        console.log('Example app listening at http://%s:%s', host, port)
    });

    app.set('views', './' + nconf.get('way_to_views'));
    app.set('view engine', nconf.get('views_format'));

    var bodyParser = require('body-parser');
    app.use(bodyParser.json());       // to support JSON-encoded bodies
    app.use(bodyParser.urlencoded({// to support URL-encoded bodies
        extended: true
    }));
    return server;
};

exports.init = init;
exports.lang = lang;
exports.db = db;