
var socket; 
socket = io.connect();

canvas_width = window.innerWidth * window.devicePixelRatio;
canvas_height = window.innerHeight * window.devicePixelRatio;

game = new Phaser.Game(canvas_width,canvas_height, Phaser.CANVAS, 'gameDiv');

var player;
var speed = 5;


var main = function(game){
};

main.prototype = {
	preload: function() {
		 game.load.image('circle', '/assets/circle.png');
	},
	create: function() {

		game.physics.startSystem(Phaser.Physics.P2JS);

		    //  Add a sprite
		player = game.add.sprite(200, 200, 'circle');

    	//  Enable if for physics. This creates a default rectangular body.
		game.physics.p2.enable(player);

		cursors = game.input.keyboard.createCursorKeys();
	},

	update: function () {
		player.body.setZeroVelocity();

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
	}
}

var gameBootstrapper = {
    init: function(gameContainerElementId){
		game.state.add('main', main);
		game.state.start('main'); 
    }
};;

gameBootstrapper.init("gameDiv");