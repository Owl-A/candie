/*
 * messages exchanged with the server.
 * 
 * food_init:
 * connect:
 * new_player:
 * new_enemyplayer:
 * enemy_move:
 * remove_player:
 * move_player:
 * food_eaten:
 *
 *
 */
//game.config.forceSetTimeOut = true;

var playerGrp;
var enemyGrp;
var rfoodGrp;
var player;
var foodnum = 100	
var food = new Array(foodnum); // length of the food array is 100
var enemies = [];
var threshold = 0.1;
var leaderBoard;
var rfood;
var widthT = 200;
var textChat = [];
var leaderboard = [];
var textscore;
var round = [];

var main = function(game){
};

// Called when the client connects to the server, or in other words, as soon as we open the game in the browser.
// Tells server to add a new player, and assigns an ID to the player.
function onsocketConnected () {
	console.log("connected to server"); 
	socket.emit('new_player', {x: game.world.centerX, y: game.world.centerY, name: Name});
	player.body.sprite.id = socket.id;
}

// When the server notifies us of client disconnection, we find the disconnected
// enemy and remove from our game
function onRemovePlayer (data) {
	if (data.id == socket.id){ 
		onDeath();
		return;
	}

	var removePlayer = find_Player_by_id(data.id);
	// Player not found
	if (!removePlayer) {
		console.log('Player not found: ', data.id);
		return;
	}

	enemies.splice(enemies.indexOf(removePlayer), 1);
	removePlayer.play.destroy();
}

// Class for enemy players
var remote_player = function(id, startX, startY, name){
	this.x = startX;
	this.y = startY;
	this.id = id;
	this.name = name;
	this.play = game.add.sprite(startX, startY, 'circle');
}


var food_wrapper = function(id,startX,startY,group,type){
	this.id = id;
	if(type == 0){
		this.food = group.create(startX, startY, 'rfood');
	}else if (type == 1) {
		this.food = group.create(startX, startY, 'bfood');
	}else{
		this.food = group.create(startX, startY, 'gfood');
	} 
}

// Called when server notifies of new player connection, which means addition of new enemy
// A new enemy is created, and pushed into the enemies list.
// Also, collision groups are updated.
function onNewPlayer (data) {
	var new_enemy = new remote_player(data.id, data.x, data.y, data.name); 
	new_enemy.play.anchor.set(0.5);

	console.log(data.color);
	new_enemy.play.frame = data.color; 	
	new_enemy.play.type = data.color;  // PLayer properties, needed in collision callbacks.
	
	game.physics.p2.enable(new_enemy.play);
	new_enemy.play.body.setCollisionGroup(enemyGrp);
	new_enemy.play.body.collides([enemyGrp,playerGrp]);
	new_enemy.play.body.collides(rfoodGrp,function (a,b) {console.log(b.sprite.id)},this);
	new_enemy.play.body.damping = 0.7;
	new_enemy.play.body.sprite.id = data.id;
	enemies.push(new_enemy);
}

// Called when 'enemy' collides with client's player.
// Send message to server to remove it from the game.
function onCollision(me, enemy) {
	if ((me.sprite.frame + 1)%3 == enemy.sprite.frame) {
		socket.emit('kill', { id : enemy.sprite.id});
	};
}

// Client side death management
// basically everything is destroyed
function onDeath () {
	for (var i = 0; i < enemies.length; i++) {
			 enemies[i].play.destroy();
	}		
	for (var i = 0; i < foodnum; i++) {
		if (i in food) {
			food[i].food.body.sprite.destroy();
			if (food[i].food.body) {food[i].food.body.destroy()};
			delete food[i];
		}
	}	
	enemies = [];
	if(player.body) player.body.sprite.destroy();
	game.state.start('start');
}

// Function to update positions of food particles
function onFoodUpdate (data) {	
	console.log(data);
	for (key in data) {
		var col = data[key].color;
		var temp;

		temp = new food_wrapper(key,data[key].x,data[key].y,rfood,col);
		temp.food.body.kinematic = true;
		temp.food.body.setCircle(10);
		temp.food.body.setCollisionGroup(rfoodGrp);
		temp.food.body.collides([playerGrp,enemyGrp]);
		temp.food.body.sprite.id = key;
		temp.food.scale.setTo(0.1,0.1);
		temp.food.body.sprite.color = col;
		food[key] = temp;
	}		
}


function destroyFood (playr,food_particle) {
	socket.emit('food_eaten',{ id : food_particle.sprite.id , Pid : playr.sprite.id}); // test
	// console.log(playr.body.sprite.frame);	
	playr.sprite.frame = food_particle.sprite.color;
	playr.sprite.type = food_particle.sprite.color;
	food_particle.sprite.destroy();
	food_particle.destroy();
}


function onColorChange(data){
	for (id in data){
		change_player = find_Player_by_id(id);
		change_player.play.body.sprite.frame = data[id];
		change_player.play.body.sprite.color = data[id];
		console.log("change " + id + " to color " + data[id] );
	}
}

function onFoodDestroyed (data) {
	console.log(food[data.id]);
	console.log('recieved ' + data.id);
	food[data.id].food.body.sprite.destroy();
	if(food[data.id].food.body) {
		food[data.id].food.body.destroy();
	}
	delete food[data.id];
}

//Server tells us there is a new enemy movement. We find the moved enemy
//and sync the enemy movement with the server
function onEnemyMove (data) {
	var movePlayer = find_Player_by_id(data.id); 
	
	if (!movePlayer) {
		return;
	}
		movePlayer.play.body.x = data.x;
		movePlayer.play.body.y = data.y; 
}

function find_Player_by_id (id){
	for (var i = 0; i < enemies.length; i++) {
		if (enemies[i].id == id) {
			return enemies[i]; 
		}
	}
}

function onBoardUpdate (data) {
	leaderBoard = data;
	console.log(leaderBoard);
	var l = leaderBoard.length;
	for(var i=0;i<l;i++){
		if(data[i].name.length > 14){
			leaderboard[i].setText(data[i].name.substring(0,11) + "...   " + data[i].score);
		}else{
			leaderboard[i].setText(data[i].name + "   " + data[i].score);
		}
		round[i].visible = true;
	}
	for(var i =l;i<5;i++){
		leaderboard[i].setText("");
		round[i].visible = false;
	}
}

main.prototype = {
	create: function() {
		this.state.start('Startup');
		game.world.setBounds(0, 0, 3000, 3000); // bounds of the world
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.stage.disableVisibilityChange = true;
		game.physics.p2.setImpactEvents(true);
	    game.physics.p2.restitution = 1;
	    playerGrp = game.physics.p2.createCollisionGroup(); 
		enemyGrp = game.physics.p2.createCollisionGroup(); 
		rfoodGrp = game.physics.p2.createCollisionGroup();

		game.stage.backgroundColor = 0xbec4ce;
		game.add.tileSprite(0,0,3000,3000,'backdrop');
		game.physics.p2.updateBoundsCollisionGroup();
		//  Add a sprite
		player = game.add.sprite(game.world.centerX, game.world.centerY	, 'circle');
		
		player.frame = 0; 	
		player.type = 0;  // PLayer properties, needed in collision callbacks. 

		player.anchor.set(0.5);
    	game.physics.p2.enable(player);
		player.body.setCollisionGroup(playerGrp);
		player.body.collides(enemyGrp,onCollision,this);
		player.body.collides(rfoodGrp,destroyFood,this);
		player.body.damping = 0.7;
	    //  Enable if for physics. This creates a default rectangular body.

		rfood = game.add.group();
		rfood.enableBody = true;
		rfood.physicsBodyType = Phaser.Physics.P2JS;

		cursors = game.input.keyboard.createCursorKeys();

		player.body.tint = 0x000000;
    	player.body.alpha = 0.6;

		temprect = game.add.sprite(document.documentElement.clientWidth -120, 40, 'round-rect');
		temprect.width = 170;
		temprect.height = 19;
		temprect.anchor.set(0.5);
		temprect.fixedToCamera = true;

		lead = game.add.text(document.documentElement.clientWidth -120, 40, 'Leaderboard', { 
				font: "15px Courier",
				fill: "#000",
				fontWeight: 'bold',
				stroke: "#ffffff",
				strokeThickness: 5,
			});
		lead.anchor.set(0.5);
		lead.fixedToCamera = true;

		// for adding name in the bottom middle
		nametext =game.add.text(document.documentElement.clientWidth/2 -10, document.documentElement.clientHeight - 70, Name, { 
				font: "35px Ubuntu",
				fill: "#000",
				fontWeight: 'bold',
				align: "center",
				stroke: "#ffffff",
				strokeThickness: 5,
	
			});
			nametext.anchor.set(0.5);
			nametext.fixedToCamera = true;

		// for adding leaderboard in the upper right corner
		for(var i = 1; i<6;i++){

			temprect = game.add.sprite(document.documentElement.clientWidth -120, 20 + 20*(i+1), 'round-rect');
			temprect.width = 170;
			temprect.height = 21;
			temprect.anchor.set(0.5);
			temprect.fixedToCamera = true;
			round[i-1] = temprect;

			temptext = game.add.text(document.documentElement.clientWidth -120, 20 + 20*(i+1), '', { 
				font: "15px Ubuntu",
				fill: "#000",
				fontWeight: 'bold',
				align: "center",
				stroke: "#ffffff",
				strokeThickness: 5,
			});
			temptext.anchor.set(0.5);
			temptext.fixedToCamera = true;
			leaderboard[i-1] = temptext;
		}

		// adds score of the client
		temprect = game.add.sprite(90, 40, 'round-rect');
		temprect.width = 170;
		temprect.height = 19;
		temprect.anchor.set(0.5);
		temprect.fixedToCamera = true;

		tempscore = game.add.text(90, 40, 'Score:- 0', { 
				font: "15px Ubuntu",
				fill: "#000",
				fontWeight: 'bold',
				stroke: "#ffffff",
				strokeThickness: 5,});
		textscore = tempscore;
		textscore.anchor.set(0.5);
		textscore.fixedToCamera = true;

		// add inbuilt follow cam
		game.camera.follow(player, Phaser.Camera.FOLLOW_LOCKON, 1, 1);
		console.log("client started");

		socket.on("connect", onsocketConnected);
		onsocketConnected();
		
		socket.on('food_update',onFoodUpdate);
		socket.on('change_color',onColorChange);
		socket.on("new_enemyPlayer", onNewPlayer);
		socket.on('leaderBoard',onBoardUpdate);
		//listen to enemy movement 
		socket.on("enemy_move", onEnemyMove);
		socket.on("update_score",function(data){ textscore.setText("Score:- " + data);
		console.log(textscore);});		
		// when received remove_player, remove the player passed; 
		socket.on('remove_player', onRemovePlayer);

		socket.on('food_destroyed', onFoodDestroyed);

	},

	update: function () {
	    if (cursors.left.isDown)
	    {
	    	player.body.moveLeft(400);
	    }
	    else if (cursors.right.isDown)
	    {
	    	player.body.moveRight(400);
	    }

	    if (cursors.up.isDown)
	    {
	    	player.body.moveUp(400);
	    }
	    else if (cursors.down.isDown)
	    {
	    	player.body.moveDown(400);
	    }
	socket.emit('move_player', { 
		x: player.body.x, 
		y: player.body.y
	});
	}
}

