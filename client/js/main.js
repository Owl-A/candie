/**
 * @file Manages main client side rendering of the game
 * @author sudoofus
*/


/** the collision group of our player to implement collsion with food */
var playerGrp;
/** the collision group containing all the enemy players */
var enemyGrp;
/** the collision group containing all the food particles */
var rfoodGrp;
/** the player
 * @type {Player} */
var player;
/** the maximum number of food particles in the game at any point of time 
 * @type {Number} */
var foodnum = 100;
/** the array containing all the food particles
 * @type {list} */
var food = new Array(foodnum); // length of the food array is 100
/** the array containing all the enemy players
 * @type {list} */
var enemies = [];
/** the threshold for ignoring messages involving small changes in positions 
 * @type {Number} */
var threshold = 0.1;
/** the top 5 players of the session
 * @type {list} */
var leaderBoard;
/** food particle */
var rfood;
/** max width of the chat box
 * @type {Number} */
var widthT = 200;
/** list of all the chats in the game
 * @type {list} */
var textChat = [];
/** the text of the leaderboard
 * @type {list} */
var leaderboard = [];
/** the textbox containing the score of the player */
var textscore;
/** The space where the leaderboard is to be displayed
 * @type {list} */
var round = [];

var main = function(game){
};

// Called when the client connects to the server, or in other words, as soon as we open the game in the browser.
// Tells server to add a new player, and assigns an ID to the player.
/**
 * Called as soon as client connects to the server, and sends message to the server to add a player.
 * @function onsocketConnected
*/
function onsocketConnected () {
	socket.emit('new_player', {x: player.body.X, y: player.body.Y, name: Name});
	player.body.sprite.id = socket.id; // try !!
}

// When the server notifies us of client disconnection, we find the disconnected
// enemy and remove from our game
/**
 * Called when server tells client to remove an enemy player, removes player from enemy list and destroys the player.
 * @function onRemovePlayer
 * @param {dictionary} data - contains ID of the destroyed enemy player
*/
function onRemovePlayer (data) {
	if (data.id == socket.id){ 
		onDeath();
		return;
	}

	var removePlayer = find_Player_by_id(data.id);
	// Player not found
	if (!removePlayer) {return;	}

	enemies.splice(enemies.indexOf(removePlayer), 1);
	removePlayer.play.destroy();
}

/**
 * Definition for the enemy player class
 * @class
 * @param {Number} id - ID of the enemy
 * @param {Number} startX - starting x position of the enemy
 * @param {Number} startY - starting y position of the enemy
 * @param {string} name - name of the enemy 
 */
var remote_player = function(id, startX, startY, name){
	/** @member {Number} */
	this.x = startX;
	/** @member {Number} */
	this.y = startY;
	/** @member {Number} */
	this.id = id;
	/** @member {string} */
	this.name = name;
	/** @member {sprite} */
	this.play = game.add.sprite(startX, startY, 'circle');
}

/**
 * Definition for the food particle class
 * @class
 * @param {Number} id - ID of the food particle
 * @param {Number} startX - the initial x position
 * @param {Nmuber} startY - the initial y position
 * @param {CollisionGroup} group - the group of the particle
 * @param {Number} type - the color code of the particle
*/
var food_wrapper = function(id,startX,startY,group,type){
	/** @member {Number} */
	this.id = id;
	if(type == 0){
		/** @member {list} */
		this.food = group.create(startX, startY, 'rfood');
	}else if (type == 1) {
		this.food = group.create(startX, startY, 'bfood');
	}else{
		this.food = group.create(startX, startY, 'gfood');
	} 
}

/**
 * Called when server notifies of new player connection, which means addition of new enemy, A new enemy is created, and pushed into the enemies list. Also, collision groups are updated.
 * @function onNewPlayer
 * @param {dicionary} data - info regarding the new enemy player
*/
function onNewPlayer (data) {
	var new_enemy = new remote_player(data.id, data.x, data.y, data.name); 
	new_enemy.play.anchor.set(0.5);

	new_enemy.play.frame = data.color; 	
	new_enemy.play.type = data.color;  // PLayer properties, needed in collision callbacks.
	
	game.physics.p2.enable(new_enemy.play);
	new_enemy.play.body.setCollisionGroup(enemyGrp);
	new_enemy.play.body.collides([enemyGrp,playerGrp]);
	new_enemy.play.body.collides(rfoodGrp,function (a,b) {},this);
	new_enemy.play.body.damping = 0.7;
	new_enemy.play.body.sprite.id = data.id;
	enemies.push(new_enemy);
}

/**
 * Called when enemy collides with the client's player. Sends message to server to remove it from the game.
 * @function onCollision
 * @param {sprite.body} me - the client's player
 * @param {sprite.body} enemy - the enemy player
*/
function onCollision(me, enemy) {
	if ((me.sprite.frame + 1)%3 == enemy.sprite.frame) {
		socket.emit('kill', { id : enemy.sprite.id});
	};
}

// Client side death management
// basically everything is destroyed
/**
 * Called when our client is eaten up by some enemy. Basically everything is supposed to be destroyed.
 * @function onDeath
*/
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

/**
 * Function to update the food distribution. Info of new particle is provided as parameter.
 * @function onFoodUpdate
 * @param {dictionary} data - food particles
*/
function onFoodUpdate (data) {	
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

/**
 * called when client eats a food particle (collision occurs between player and food group)
 * @function destroyFood
 * @param {sprite.body} playr - the client's player
 * @param {sprite.body} food_particle - the destroyed food particle's body
*/
function destroyFood (playr,food_particle) {
	socket.emit('food_eaten',{ id : food_particle.sprite.id , Pid : playr.sprite.id}); // test
	playr.sprite.frame = food_particle.sprite.color;
	playr.sprite.type = food_particle.sprite.color;
	food_particle.sprite.destroy();
	food_particle.destroy();
}

/**
 * called when server tells client to change color upon eating of food particle.
 * @function onColorChange
 * @param {dictionary} data - contains ID of the player that ate the particle.
*/
function onColorChange(data){
	for (id in data){
		change_player = find_Player_by_id(id);
		change_player.play.body.sprite.frame = data[id];
		change_player.play.body.sprite.color = data[id];
	}
}

/**
 * called when server notifies client of another client eating a food particle. Removes it from the game, the food list.
 * @function onFoodDestroyed
 * @param {dictionary} data - contains ID of the destroyed food particle.
*/
function onFoodDestroyed (data) {
	food[data.id].food.body.sprite.destroy();
	if(food[data.id].food.body) {
		food[data.id].food.body.destroy();
	}
	delete food[data.id];
}

/**
 * used to update the chat text in the game. the data(text) is provided as parameter
 * @function onChatUpdate
 * @param {dictionary} data - contains name of the sender and the chat text.
*/
function onChatUpdate (data){
	if(data.text != ""){

	if(data.name == ""){
		data.text = "Unknown Candi: " + data.text;
	}
	else{
		data.text  = data.name + ": " + data.text;
	}
	var textLength = 25
	n = parseInt(data.text.length/textLength) + 1;
	for(var j=0;j<n;j++){
		for(var i=13;i>=0;i--){
			textChat[i+1].setText(textChat[i].text + "");
			textChat[i+1].visible = true;
		}
	}
	var j = Math.max(0,n-1);
	for(var i = 0; i<data.text.length;i+=textLength){
		textChat[j].setText(data.text.substring(i, Math.min(i + textLength, data.text.length)) + "-");
		j--;
	}
	textChat[j+1].setText(textChat[j+1].text.substring(0,textChat[j+1].text.length - 1));
}
}

//Server tells us there is a new enemy movement. We find the moved enemy
//and sync the enemy movement with the server
/**
 * Used to sync enemy movement with the server. Called when server notifies us of the same.
 * @function onEnemyMove
 * @param {dictionary} data - contains information of the enemy player that has moved.
*/
function onEnemyMove (data) {
	var movePlayer = find_Player_by_id(data.id); 
	
	if (!movePlayer) {
		return;
	}
		movePlayer.play.body.x = data.x;
		movePlayer.play.body.y = data.y; 
}

/**
 * finds player, given it's ID
 * @function find_Player_by_id
 * @param {Number} id - the ID of the player to be found
*/
function find_Player_by_id (id){
	for (var i = 0; i < enemies.length; i++) {
		if (enemies[i].id == id) {
			return enemies[i]; 
		}
	}
}

/**
 * updates the leaderboard text when server gives the signal to do so.
 * @function onBoardUpdate
 * @param {dictionary} data - contains the leaderboard details, to be put on the textboxes.
*/
function onBoardUpdate (data) {
	leaderBoard = data;
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


/**
 Entire game logic for the client side including creation of sprites, HUD, physics and event listeners resides within main.prototype
*/
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
		player = game.add.sprite(game.world.randomX, game.world.randomY	, 'circle');
		
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

		chat = game.add.inputField(document.documentElement.clientWidth - 335, document.documentElement.clientHeight - 55,  {
		    font: '15px Arial',
		    fill: '#212121',
		    fontWeight: 'bold',
		    width: 280,
		    padding: 8,
		    borderWidth: 4,
		    borderColor: 'green',
		    placeHolder: 'Enter Your Name',

		    type: PhaserInput.InputType.text
		});
		chat.fixedToCamera = true;

		for(var i = 1; i<16;i++){




			tempchat = game.add.text(document.documentElement.clientWidth -65- 120, document.documentElement.clientHeight - 43 - 20*i, '', { 
					font: "15px Courier",
					fill: "#000",
					fontWeight: 'bold',
					stroke: "#ffffff",
					strokeThickness: 5
				});
			tempchat.anchor.set(0.5);
			tempchat.fixedToCamera = true;
			textChat[i-1] = tempchat;
		}

		var wkey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
		wkey.onDown.add(this.star, this);

		temprect = game.add.sprite(document.documentElement.clientWidth - 120, 36, 'round-rect');

		temprect.width = 170;
		temprect.height = 19;
		temprect.anchor.set(0.5);
		temprect.fixedToCamera = true;

		lead = game.add.text(document.documentElement.clientWidth - 120, 40, 'Leaderboard', { 
				font: "15px Courier",
				fill: "#000",
				fontWeight: 'bold',
				stroke: "#ffffff",
				strokeThickness: 5,
			});
		lead.anchor.set(0.5);
		lead.fixedToCamera = true;


		// for adding name in the bottom middle
		nametext = game.add.text(document.documentElement.clientWidth/2 -10, document.documentElement.clientHeight - 70, Name, { 
				font: "35px Ubuntu",
				fill: "#000",
				fontWeight: 'bold',
				align: "center",
				stroke: "#ffffff",
				strokeThickness: 10,
	
			});
			nametext.anchor.set(0.5);
			nametext.fixedToCamera = true;

		// for adding leaderboard in the upper right corner
		for(var i = 1; i<6;i++){

			temprect = game.add.sprite(document.documentElement.clientWidth - 120, 16 + 20*(i+1), 'round-rect');
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


		temprect = game.add.sprite(90, 38, 'round-rect');
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

		socket.on("connect", onsocketConnected);
		onsocketConnected();
		
		socket.on('food_update',onFoodUpdate);
		socket.on('change_color',onColorChange);
		socket.on("new_enemyPlayer", onNewPlayer);
		socket.on('leaderBoard',onBoardUpdate);
		//listen to enemy movement 
		socket.on("enemy_move", onEnemyMove);
		socket.on("update_score",function(data){ textscore.setText("Score:- " + data);
		// when received remove_player, remove the player passed; 
		socket.on('remove_player', onRemovePlayer);

		socket.on('food_destroyed', onFoodDestroyed);

		socket.on('newChatmessage', onChatUpdate);
        })
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
	},

	star: function(){
		X = chat.value;
		socket.emit('chat_message', {name: Name, text: X});
		chat.value = '';
		onChatUpdate({name: Name, text: X});
	}
}

