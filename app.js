var exp = require('express');
var app = exp();
var serv = require('http').Server(app);
var ioHandle = require('socket.io').listen(serv);

app.use('/js',exp.static(__dirname + '/client/js'));
app.use('/phaser',exp.static(__dirname + '/client/phaser'));


app.get('/',function (req, res) {
	res.sendFile(__dirname + '/client/index.html');
})

serv.listen('4040', function () {
	console.log('server initiated');
})