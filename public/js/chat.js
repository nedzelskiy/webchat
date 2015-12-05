var socket = io.connect('http://' + location.hostname + ':' + location.port);
var chat = $(".panel-info .media-list");
var userTable = $(".panel-primary .media-list");
var userTableTemplate = _.template($("#user-table-template").text());
var sysMessageTemplate = _.template($("#system-message-template").text());
var messageTemplate = _.template($("#message-template").text());
var id = $("input[name='id']").val();
var userstatus = $("input[name='userstatus']").val();
var userCount = $(".users_count");
var send = $(".btn.send");
var inputText = $(".input-group").find("input[type='text']");


$(window).unload(function(){
    socket.disconnect();
});

function throwSysMessage(data){
    var sysmess = $(sysMessageTemplate(data));
    chat.append(sysmess);
    sysmess.fadeIn(800);
};

function throwMessage(data){
    var mess = $(messageTemplate(data));
    chat.append(mess);
    mess.fadeIn(800);
};

function addUser(data){
    var existUser = userTable.find("li[data-id='"+data.delete_id+"']");
    if ('undefined' !== typeof existUser[0]) {
        existUser.remove();
    }
    var user = $(userTableTemplate(data));
    userTable.append(user);
    user.fadeIn(800);
};

function delUser(_id){
    // если сервер пытается удалить Вас в обход disconnect
    if (id == _id) {
        return false;
    }
    userTable.find("li[data-id='"+id+"']").remove();
};

function sendMessage(mess){
    if ('' !== mess ) {
        socket.emit('message',{
            'mess':mess
        });
        inputText.val('');
    }
};

socket.on('connect_', function(data){
    if (data.success && data.id === socket.id) {
        userCount.text(data.countUsers);
        data.currentUsers.forEach(function(v){
            addUser(v);
        });
        socket.emit('connect_accept',{
            'id':id
        });
    }
});
socket.on('adduser',function(data){
    if (data.success && data.data) {
        userCount.text(data.countUsers);
        addUser(data.data);
    }
});
socket.on('delluser',function(data){
    if (data.success && data.data) {
        userCount.text(data.countUsers);
        delUser(data.data.id);
    }
});
socket.on('sysmessage', function(data){
    if (data.success && data.data) {
        throwSysMessage(data.data);
    }
});
socket.on('message', function(data){
    if (data.success && data.data) {
        throwMessage(data.data);
    }
});
socket.on('disconnect', function(){
    alert("You have been disconnected from server!");
    document.location.assign("/");
});

send.click(function(){
    sendMessage(inputText.val());
});
inputText.keyup(function(event) {
    if(event.keyCode==13) {
        sendMessage($(this).val());
    }
});