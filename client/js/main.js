
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
	create: function() {
		var graphics = game.add.graphics(0,0);
		graphics.beginFill(0x2621c4, 1);
		player = graphics;
	},

	update: function () {

	    if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT))
	    {
	        player.x -= speed;

	    }
	    else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT))
	    {
	        player.x += speed;
	    }

	    if (game.input.keyboard.isDown(Phaser.Keyboard.UP))
	    {
	        player.y -= speed;
	    }
	    else if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN))
	    {
	        player.y += speed;
	    }
	    player.drawCircle(300,300,100);
	}
}

var gameBootstrapper = {
    init: function(gameContainerElementId){
		game.state.add('main', main);
		game.state.start('main'); 
    }
};;

gameBootstrapper.init("gameDiv");