var exp = require('express');
var app = exp();
var serv = require('http').Server(app);
var io = require('socket.io').listen(serv);

app.use('/js',exp.static(__dirname + '/client/js'));
app.use('/phaser',exp.static(__dirname + '/client/phaser'));
app.use('/assets',exp.static(__dirname + '/client/assets'))


app.get('/',function (req, res) {
	res.sendFile(__dirname + '/client/index.html');
})

serv.listen('4040', function () {
	console.log('server initiated');
})

var playerList = [];

//a player class in the server
var Player = function (startX, startY) {
  this.x = startX;
  this.y = startY;
}

function onNewplayer (data) {
console.log(data);
	//new player instance
	var newPlayer = new Player(data.x, data.y);
	
	console.log("created new player with id " + this.id);
	newPlayer.id = this.id; 	
	//information to be sent to all clients except sender
	var current_info = {
		id: newPlayer.id, 
		x: newPlayer.x,
		y: newPlayer.y
	}; 
	
	//send to the new player about everyone who is already connected. 	
	for (i = 0; i < playerList.length; i++) {
		existingPlayer = playerList[i];
		var player_info = {
			id: existingPlayer.id,
			x: existingPlayer.x,
			y: existingPlayer.y, 
		};
		console.log("pushing player");
		//send message to the sender-client only
		this.emit("new_enemyPlayer", player_info);
	}
	
	//send message to every connected client except the sender
	this.broadcast.emit('new_enemyPlayer', current_info);
	

	playerList.push(newPlayer); 
}

function onClientdisconnect() {
	console.log('disconnected');
	var removePlayer = findPlayer(this.id);
	
	if (removePlayer) {
		playerList.splice(playerList.indexOf(removePlayer), 1);
	}
	
	console.log("removing player " + this.id);
	
	//send message to every connected client except the sender
	this.broadcast.emit('remove_player', {id: this.id});
}

//update the player position and send the information back to every client except sender
function onMovePlayer (data) {
	var movePlayer = findPlayer(this.id);
	if(!movePlayer){return;}
	movePlayer.x = data.x;
	movePlayer.y = data.y;
	
	var moveplayerData = {
		id: this.id,
		x: data.x,
		y: data.y,
	}
	//send message to every connected client except the sender
	this.broadcast.emit('enemy_move', moveplayerData);
}

function findPlayer (id){
	for (var i = 0; i < playerList.length; i++) {
		if (playerList[i].id == id) {
			return playerList[i]; 
		}
	}
}

io.sockets.on('connection', function(socket){
	console.log("socket connected"); 
	
	socket.on('disconnect', onClientdisconnect); 
	
	socket.on("new_player", onNewplayer);
	
	socket.on("move_player", onMovePlayer);
});