
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
 * // TODO ; debug foodupdate and onfoodDestroyed
 */
var socket; 
socket = io.connect();

game = new Phaser.Game(0.75*document.documentElement.clientWidth , document.documentElement.clientHeight - 20, Phaser.CANVAS, 'gameDiv');
game.config.forceSetTimeOut = true;	
var playerGrp;
var enemyGrp;
var rfoodGrp;
var player;
var foodnum = 100	
var food = new Array(foodnum); // length of the food array is 100
var enemies = [];
var threshold = 0.1;

var main = function(game){
};

function onsocketConnected () {
	console.log("connected to server"); 
	// send the server our initial position and tell it we are connected
	socket.emit('new_player', {x: game.world.centerX, y: game.world.centerY});

}

// When the server notifies us of client disconnection, we find the disconnected
// enemy and remove from our game
function onRemovePlayer (data) {
	var removePlayer = find_Player_by_id(data.id);
	// Player not found
	if (!removePlayer) {
		console.log('Player not found: ', data.id);
		return;
	}

	enemies.splice(enemies.indexOf(removePlayer), 1);
	removePlayer.play.destroy();
}

var remote_player = function(id, startX, startY){
	this.x = startX;
	this.y = startY;
	this.id = id;
	this.play = game.add.sprite(startX, startY, 'circle');
}

var food_wrapper = function(id,startX,startY,group){
	this.id = id;
	this.food = group.create(startX, startY, 'rfood'); 
}

//Server will tell us when a new enemy player connects to the server.
//We create a new enemy in our game.
function onNewPlayer (data) {
	var new_enemy = new remote_player(data.id, data.x, data.y); 
	new_enemy.play.anchor.set(0.5);
	game.physics.p2.enable(new_enemy.play);
	new_enemy.play.body.setCollisionGroup(enemyGrp);
	new_enemy.play.body.collides(enemyGrp,onCollision,this);
	new_enemy.play.body.collides(playerGrp,onCollision,this);
	new_enemy.play.body.collides(rfoodGrp,function (a,b) {console.log(b.sprite.id)},this);
	new_enemy.play.body.damping = 0.7;
	enemies.push(new_enemy);
}

// not implemented yet
//we can get sizes of collided bodies this way, but still need to see how exactly to 'respawn' player after death
function onCollision(body1, body2) {
	console.log("collides");
	// console.log("height of body1: ");
	// console.log(body1.sprite.height);
}

function onFoodUpdate (data) {	
	var rfood = game.add.group();
	rfood.enableBody = true;
	rfood.physicsBodyType = Phaser.Physics.P2JS;

	for (key in data) {
		var col = data[key].color;
		var temp;

		if (col == 0) {
			temp = new food_wrapper(key,data[key].x,data[key].y,rfood);
			temp.food.body.kinematic = true;
			temp.food.body.setCircle(10);
			temp.food.body.setCollisionGroup(rfoodGrp);
			temp.food.body.collides([playerGrp,enemyGrp]);
			temp.food.body.sprite.id = key;
			temp.food.scale.setTo(0.1,0.1);
		}else if (col == 1) {
			temp = game.add.sprite(data[key].x,data[key].y,'gfood');
			temp.scale.setTo(0.1,0.1);
			
		}else{
			temp = game.add.sprite(data[key].x,data[key].y,'bfood');				
			temp.scale.setTo(0.1,0.1);
		}
		// console.log(key);
		food[key] = temp;
	}		
}

function destroyFood (playr,food_particle) {
	socket.emit('food_eaten',{ id : food_particle.sprite.id});
	food_particle.sprite.destroy();
	food_particle.destroy();
}

function onFoodDestroyed (data) {
	console.log(food[data.id]);
	console.log('recieved ' + data.id);
	food[data.id].food.body.sprite.destroy();
	food[data.id].food.body.destroy();
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

main.prototype = {
	preload: function() {
		 game.load.image('circle', '/assets/circle.png');
		 game.load.image('rfood', '/assets/rfood.png');
		 game.load.image('gfood', '/assets/gfood.png');
		 game.load.image('bfood', '/assets/bfood.png');
		 game.load.image('backdrop','/assets/backdrop.png');
	},
	create: function() {
		game.world.setBounds(0, 0, 3000, 3000); // bounds of the world
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.stage.disableVisibilityChange = true;
		game.physics.p2.setImpactEvents(true);
	    game.physics.p2.restitution = 1;
	    playerGrp = game.physics.p2.createCollisionGroup(); 
		enemyGrp = game.physics.p2.createCollisionGroup(); 
		rfoodGrp = game.physics.p2.createCollisionGroup();

		game.stage.backgroundColor = 0xcccccc;
		game.add.tileSprite(0,0,3000,3000,'backdrop');
		game.physics.p2.updateBoundsCollisionGroup();
		//  Add a sprite
		player = game.add.sprite(game.world.centerX, game.world.centerY	, 'circle');
		player.anchor.set(0.5);
    	game.physics.p2.enable(player);
		player.body.setCollisionGroup(playerGrp);
		player.body.collides(enemyGrp,onCollision,this);
		player.body.collides(rfoodGrp,destroyFood,this);
		player.body.damping = 0.7;
	    //  Enable if for physics. This creates a default rectangular body.

		cursors = game.input.keyboard.createCursorKeys();

		// add inbuilt follow cam
		game.camera.follow(player, Phaser.Camera.FOLLOW_LOCKON, 1, 1);
		console.log("client started");

		socket.on("connect", onsocketConnected);
		onsocketConnected();
		//listen to new enemy connections
		
		socket.on('food_update',onFoodUpdate);
		socket.on("new_enemyPlayer", onNewPlayer);
		//listen to enemy movement 
		socket.on("enemy_move", onEnemyMove);
		
		// when received remove_player, remove the player passed; 
		socket.on('remove_player', onRemovePlayer);

		socket.on('food_destroyed', onFoodDestroyed);

	},

	update: function () {
		// player.body.accelaration.x = (-2)*player.body.velocity.x;
		// player.body.accelaration.y = (-2)*player.body.velocity.y;

		// console.log(player.body.velocity.x + " " + player.body.velocity.y);
	    if (cursors.left.isDown)
	    {
	    	player.body.moveLeft(400);
	    	// console.log(enemies);
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

game.state.add('main', main);
game.state.start('main'); 