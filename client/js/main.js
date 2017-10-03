
var socket; 
socket = io.connect();

game = new Phaser.Game(document.documentElement.clientWidth - 20, document.documentElement.clientHeight - 20, Phaser.CANVAS, 'gameDiv');

var player;
var enemies = [];

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

//Server will tell us when a new enemy player connects to the server.
//We create a new enemy in our game.
function onNewPlayer (data) {
	console.log(data);
	//enemy object 
	var new_enemy = new remote_player(data.id, data.x, data.y); 
	new_enemy.play.anchor.set(0.5);
	enemies.push(new_enemy);
}

//Server tells us there is a new enemy movement. We find the moved enemy
//and sync the enemy movement with the server
function onEnemyMove (data) {
	console.log(data.id);
	console.log(enemies);
	var movePlayer = find_Player_by_id(data.id); 
	
	if (!movePlayer) {
		return;
	}
	movePlayer.play.x = data.x;
	movePlayer.play.y = data.y; 
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
		 game.load.image('backdrop','/assets/backdrop.png');
	},
	create: function() {
		game.world.setBounds(0, 0, 3000, 3000);
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.stage.backgroundColor = 0xE1A193;
		game.add.tileSprite(0,0,3000,3000,'backdrop');
		//  Add a sprite
		player = game.add.sprite(game.world.centerX, game.world.centerY	, 'circle');
		player.anchor.set(0.5);
	    //  Enable if for physics. This creates a default rectangular body.
		game.physics.p2.enable(player);

		cursors = game.input.keyboard.createCursorKeys();

		// add inbuilt follow cam
		game.camera.follow(player, Phaser.Camera.FOLLOW_LOCKON, 1, 1);
		console.log("client started");
		socket.on("connect", onsocketConnected);
		onsocketConnected();
		//listen to new enemy connections
		socket.on("new_enemyPlayer", onNewPlayer);
		//listen to enemy movement 
		socket.on("enemy_move", onEnemyMove);
		
		// when received remove_player, remove the player passed; 
		socket.on('remove_player', onRemovePlayer); 
	},

	update: function () {
		player.body.setZeroVelocity();

	    if (cursors.left.isDown)
	    {
	    	player.body.moveLeft(400);
	    	socket.emit('move_player', { x: player.body.x, y: player.body.y});
	    	console.log(enemies);
	    }
	    else if (cursors.right.isDown)
	    {
	    	player.body.moveRight(400);
	    	socket.emit('move_player', { x: player.body.x, y: player.body.y});
	    }

	    if (cursors.up.isDown)
	    {
	    	player.body.moveUp(400);
	    	socket.emit('move_player', { x: player.body.x, y: player.body.y});
	    }
	    else if (cursors.down.isDown)
	    {
	    	player.body.moveDown(400);
	    	socket.emit('move_player', { x: player.body.x, y: player.body.y});
	    }
	}
}

var gameBootstrapper = {
    init: function(gameContainerElementId){
		game.state.add('main', main);
		game.state.start('main'); 
    }
};;

gameBootstrapper.init("gameDiv");