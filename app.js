var exp = require('express');
var app = exp();
var serv = require('http').Server(app);
var io = require('socket.io').listen(serv);

app.use('/js',exp.static(__dirname + '/client/js'));
app.use('/phaser',exp.static(__dirname + '/client/phaser'));
app.use('/assets',exp.static(__dirname + '/client/assets'));


app.get('/',function (req, res) {
	res.sendFile(__dirname + '/client/index.html');
})

// A List for all the food in the game
var food = {};

// Randomly assigns positions to food items in the array
for (var i = 0; i < 100; ++i) {
	food[i.toString()] = { 
		x: 3000*Math.random(),
		y: 3000*Math.random(),
		color: i%3 
	};
};
serv.listen('4040', function () {
	console.log('server initiated');
})

// A list for all the players in the game
var playerList = [];

// A list for the leaderboard (top5 scorers)
var leaderBoard = [];
var Chat = [];

// Player class in the server
var Player = function (startX, startY, init_color, name, score) {
  this.x = startX;
  this.y = startY;
  this.color = init_color;
  this.name = name;
  this.score = score;
}

// This function is called when any new client connects to the server
function onNewplayer (data) {
console.log(data);
	//new player instance
	var newPlayer = new Player(data.x, data.y, 0, data.name, 0);
	
	console.log("created new player with id " + this.id);
	newPlayer.id = this.id; 	
	//information to be sent to all clients except sender
	var current_info = {
		id: newPlayer.id, 
		x: newPlayer.x,
		y: newPlayer.y,
		color: 0,
		name: newPlayer.name
	}; 
	
	//send to the new player about everyone who is already connected. 	
	for (i = 0; i < playerList.length; i++) {
		existingPlayer = playerList[i];
		var player_info = {
			id: existingPlayer.id,
			x: existingPlayer.x,
			y: existingPlayer.y, 
			color: existingPlayer.color,
			name: existingPlayer.name
		};
		console.log("pushing player");

		//send message to the sender-client only
		this.emit("new_enemyPlayer", player_info);
	}
	
	// Updating Leaderboard if required
	if (leaderBoard.length < 5) {leaderBoard.push({
		id : newPlayer.id,
		name : newPlayer.name,
		score : 0
	})};

	// send message to every connected client except the sender
	this.broadcast.emit('new_enemyPlayer', current_info);
	
	this.emit('food_update',food); // send state of food

	playerList.push(newPlayer);

	this.emit('leaderBoard',leaderBoard);
	this.broadcast.emit('leaderBoard',leaderBoard);
}

// Called as soon as any client disconnects from the server. For example, when he refreshes the page, or closes it.
function onClientdisconnect() {
	console.log('disconnected');
	var removePlayer = findPlayer(this.id);
	
	// Remove from the list of players
	if (removePlayer) {
		playerList.splice(playerList.indexOf(removePlayer), 1);
	}

	// Remove from Leaderboard
	for (var i = 0; i < leaderBoard.length; i++) {
		if (leaderBoard[i].id == this.id) leaderBoard.splice(i,1);
	}

	console.log("removing player " + this.id);
	
	// send message to every connected client except the sender
	this.broadcast.emit('remove_player', {id: this.id});
	this.broadcast.emit('leaderBoard',leaderBoard);
}

function chatMessage(data){
	// var l = chat_message.length;
	// l = Math.min(15,l);
	// for(var i = l; i>0;i++){
	// 	chat_message[i] = chat_message[i-1];
	// }
	// chat_message[0] = data.text;
	// console.log(data);
	console.log(data);
	this.broadcast.emit('newChatmessage', data);
	this.emit('newChatmessage', data)
}	


// Called when a client eats a food item.
// The parameter data also contains information regarding the 'eater' and that is used for changing the color, if needed,
// and also updating the other clients
function onFoodEaten (data) {
	this.broadcast.emit('food_destroyed',data);
	food[data.id].x = 3000*Math.random();
	food[data.id].y = 3000*Math.random();

	console.log(data.Pid + " ate " + data.id );

	temp = {};
	temp[data.id] = food[data.id];

	temp_play  = {};
	temp_play[data.Pid] = food[data.id].color;

	findPlayer(data.Pid).color = food[data.id].color;

	this.broadcast.emit('change_color',temp_play);
	this.broadcast.emit('food_update',temp);
	this.emit('food_update',temp);
}

// Function is called as soon as server is informed by a client regarding any movement.
// Each other client is informed of the same movement, with help of data provided to the function.
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
	// send message to every connected client except the sender
	this.broadcast.emit('enemy_move', moveplayerData);
}

// Returns player of the specific ID
function findPlayer (id){
	for (var i = 0; i < playerList.length; i++) {
		if (playerList[i].id == id) {
			return playerList[i]; 
		}
	}
}

// Function updates Leaderboard with the top 5 players currently.
// Called whenever there is 'annhilation' of any player.
function update_board (data) {
	for (var i = 0; i < leaderBoard.length; i++) {
		if (leaderBoard[i].id == data.id) leaderBoard.splice(i,1);
	};
	var i;
	for ( i = 0; i < leaderBoard.length; i++) {
		if (leaderBoard[i].score <= data.score) {
			leaderBoard.splice(i,0,{ 
					id : data.id,
					name : data.name,
					score : data.score
				});
			return;
		}
	}
	if (i < 5) {		
		leaderBoard.push({ 
			id : data.id,
			name : data.name,
			score : data.score
		});
	}

}	

// Called when server recieves message from client that it's player has killed another player.
// The killed guy's info comes in as data to the function
function onKill (data) {
	var removePlayer = findPlayer(data.id);
	var scoredBy = findPlayer(this.id);
	if (removePlayer) {
		// removing killed guy from player list of the server
		playerList.splice(playerList.indexOf(removePlayer), 1);
		// updating score of killer in the server database
		scoredBy.score += 10;
		// update leaderboard
		update_board(scoredBy);
		console.log(leaderBoard);
		console.log(removePlayer.id + " died");
		// tell the killer client to update it's own score as well, used for displaying the same.
		this.emit('update_score', scoredBy.score);
	}
	
	// tell everyone to remove the killed player from the screen.
	this.broadcast.emit('remove_player', {id: data.id});
	this.emit('remove_player', {id: data.id});
}

io.sockets.on('connection', function(socket){
	console.log("socket connected"); 
	
	socket.on('chat_message', chatMessage);
	socket.on('disconnect', onClientdisconnect); 
	
	socket.on("new_player", onNewplayer);
	
	socket.on("move_player", onMovePlayer);

	socket.on("food_eaten",onFoodEaten);

	socket.on('kill',onKill);
});