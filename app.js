var exp = require('express');
var app = exp();
var serv = require('http').Server(app);
var ioHandle = require('socket.io').listen(serv);

app.use('/js',exp.static(__dirname + '/client/js'));

app.get('/',function (req, res) {
	res.sendfile(__dirname + '/client/index.html');
})

serv.listen('4040', function () {
	console.log('server initiated');
})