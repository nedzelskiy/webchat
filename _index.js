var config = require('./config');
var fs = require("fs");

var express = require('express');
var app = express();
var server = config.init(app);
var socket = require('socket.io');
var io = socket.listen(server);

var User = require('./models/User').init(config.db);

var services = require('./modules/services');
var common_texts = require('./texts/' + config.lang + '/common');


function renderLogin(res, params) {
    var renderParams = {
        'texts': require('./texts/' + config.lang + '/login'),
        'common': common_texts,
        'avatars':(fs.readdirSync('./public/avatars/')).sort(function(a, b) {
                    return Math.random() - 0.5;
                })
    };
    for (property in params) {
        renderParams[property] = params[property];
    }
    res.render('login', renderParams);
}
;

function renderChat(res, params) {
    var texts = require('./texts/' + config.lang + '/chat');
    var renderParams = {
        'texts': texts,
        'userTableTemplate':fs.readFileSync('./public/templates/userTable.ejs', "utf8"),
        'sysMessageTemplate':fs.readFileSync('./public/templates/sysMessage.ejs', "utf8"),
        'messageTemplate':fs.readFileSync('./public/templates/message.ejs', "utf8"),
        'smiles':fs.readdirSync('./public/smiles/')
    };
    renderParams.name = params.name;
    renderParams.title = params.title;
    renderParams.id = params.id;
    res.render('chat', renderParams);
};

io.sockets.on('connection', function(socket){
    var countUsers = Object.keys(io.sockets.connected).length;
    var currentUsers = [];
    for (var i = 0; i < countUsers; i++) {
        var id = Object.keys(io.sockets.connected)[i];
        if (id === socket.id) continue;
        currentUsers.push({
            name: io.sockets.connected[id].nickname,
            date: io.sockets.connected[id].handshake.time,
            status: io.sockets.connected[id].userstatus,
            active: common_texts.active,
            avatar: io.sockets.connected[id].avatar,
            delete_id: io.sockets.connected[id].delete_id
        });
    };
    socket.emit('connect_', {
        'success':true,
        'id':socket.id,
        'countUsers':countUsers,
        'currentUsers':currentUsers
    });
    socket.on('connect_accept',function(data){
        User.findById(data.id, function (err, user) {
            if (user) {
                for (var i = 0; i < Object.keys(io.sockets.connected).length; i++) {
                    var id = Object.keys(io.sockets.connected)[i];
                    if (io.sockets.connected[id].nickname === user.name) {
                        io.sockets.connected[id].emit('killsession',{});
                        io.sockets.connected[id].disconnect(true);
                    }
                }
                socket.nickname = user.name;
                socket.userstatus = common_texts[user.status];
                socket.avatar = user.avatar;
                socket.delete_id = user._id;
                console.log(common_texts.connected + ': ' + socket.nickname + ' | ' + socket.handshake.address + ' | ' + socket.id);
                io.sockets.emit('sysmessage',{
                    'success':true,
                    'data':{
                        'mess': common_texts.welcome + ', ' + socket.nickname + '!',
                        'date':(new Date())
                    }
                });
                io.sockets.emit('adduser',{
                    'success':true,
                    'countUsers':Object.keys(io.sockets.connected).length,
                    'data':{
                        name: socket.nickname,
                        date: io.sockets.connected[socket.id].handshake.time,
                        status: socket.userstatus,
                        active: common_texts.active,
                        avatar: socket.avatar,
                        delete_id: socket.delete_id
                    }
                });
            }
        });
    });
    socket.on('message', function(data){
        io.sockets.emit('message',{
            'success':true,
            'data':{
                'mess': services.setSmilesToText(services.HTML.encode(data.mess)),
                'date':(new Date()),
                'name':socket.nickname,
                'avatar':socket.avatar
            }
        });
    });
    socket.on('disconnect', function(){
        socket.broadcast.emit('delluser',{
            'success':true,
            'countUsers':Object.keys(io.sockets.connected).length,
            'data':{
                'id': socket.delete_id
            }
        });
        socket.broadcast.emit('sysmessage',{
            'success':true,
            'data':{
                'mess': common_texts.disconnected + ', ' + socket.nickname + '!',
                'date':(new Date())
            }
        });
        console.log(common_texts.disconnected + ': ' + socket.nickname + ' | ' + socket.handshake.address + ' | ' + socket.id);
    });
});



app.get('/', function (req, res) {
    renderLogin(res, {});
});

app.post('/', function (req, res) {
    req.body.login = services.trim(req.body.login);
    req.body.password = services.trim(req.body.password);
    if (req.body.login && req.body.password) {
        User.findOne({'name': req.body.login}, function (err, user) {
            if (user && user.checkPassword(req.body.password)) {
                if ('unknown' !== req.body.avatar) {
                    user.avatar = req.body.avatar;
                    user.save();
                }
                renderChat(res,{
                    'name':user.name,
                    'id':user._id,
                    'title':user.name + ': WEB CHAT'
                });
            } else if(user){
                renderLogin(res, {
                    'error': {
                        'field': 'password',
                        'message': common_texts.password_wrong + ', ' + req.body.login + '!'
                    }
                });
            } else {
                var user = new User({
                    name: req.body.login,
                    password: req.body.password,
                    avatar:req.body.avatar
                });
                user.save(function (err) {
                    if (err) {
                        renderLogin(res, {'error': {'message': err.message} });
                        console.log(err);
                    } else {
                        renderChat(res,{
                            'name':req.body.login,
                            'id':user._id,
                            'title':user.name + ': WEB CHAT'
                        });
                    }

                });
            }
        });
    }
});
app.get('/bootstrap/:file', function (req, res) {
    if ('css' === services.getExt(req.params.file)) {
        res.sendFile(__dirname + '/node_modules/bootstrap/dist/css/' + req.params.file);
    } else if ('js' === services.getExt(req.params.file)) {
        res.sendFile(__dirname + '/node_modules/bootstrap/dist/js/' + req.params.file);
    }
});
app.get('/jquery/:file', function (req, res) {
    if ('js' === services.getExt(req.params.file)) {
        res.sendFile(__dirname + '/node_modules/jquery/dist/' + req.params.file);
    }
});
app.get('/lodash/:file', function (req, res) {
    if ('js' === services.getExt(req.params.file)) {
        res.sendFile(__dirname + '/node_modules/lodash/' + req.params.file);
    }
});
app.get('/slick/:file', function (req, res) {
    if ('css' === services.getExt(req.params.file)) {
        res.sendFile(__dirname + '/node_modules/slick-carousel/slick/' + req.params.file);
    } else if ('js' === services.getExt(req.params.file)) {
        res.sendFile(__dirname + '/node_modules/slick-carousel/slick/' + req.params.file);
    } else if ('gif' === services.getExt(req.params.file)) {
        res.sendFile(__dirname + '/node_modules/slick-carousel/slick/' + req.params.file);
    }
});
app.get('/slick/fonts/:file', function (req, res) {
    if ('woff' === services.getExt(req.params.file)) {
        res.sendFile(__dirname + '/node_modules/slick-carousel/slick/fonts/' + req.params.file);
    } else if ('ttf' === services.getExt(req.params.file)) {
        res.sendFile(__dirname + '/node_modules/slick-carousel/slick/fonts/' + req.params.file);
    }
});
app.get('/avatars/:file', function (req, res) {
    if ('unknown.png' === req.params.file) {
        res.sendFile(__dirname + '/public/img/unknown.png');
    } else if ('png' === services.getExt(req.params.file)) {
        res.sendFile(__dirname + '/public/avatars/' + req.params.file);
    }
});
app.get('/smiles/:file', function (req, res) {
    if ('gif' === services.getExt(req.params.file)) {
        res.sendFile(__dirname + '/public/smiles/' + req.params.file);
    }
});
app.get('/:file', function (req, res) {
    switch (services.getExt(req.params.file)) {
        case 'css':
            res.sendFile(__dirname + '/public/css/' + req.params.file);
            break;
            
        case 'js':
            res.sendFile(__dirname + '/public/js/' + req.params.file);
            break;

        case 'jpg':
        case 'jpeg':
        case 'bmp':
        case 'gif':
        case 'png':
        case 'ico':
            res.sendFile(__dirname + '/public/img/' + req.params.file);
            break;
    }
});

