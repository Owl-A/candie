
var socket; 
socket = io.connect();

canvas_width = window.innerWidth * window.devicePixelRatio;
canvas_height = window.innerHeight * window.devicePixelRatio;

game = new Phaser.Game(canvas_width,canvas_height, Phaser.CANVAS, 'gameDiv');

var player;
var speed = 1;


var main = function(game){
};

main.prototype = {
	create: function() {
		var posX = game.rnd.integerInRange(0, canvas_height - 70);
		var posY = game.rnd.integerInRange(0, canvas_width - 70);
		player = new Phaser.Rectangle(posX, posY, 70, 70);
	},

	update: function () {

	    if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT))
	    {
	        player.centerX -= speed;
	    }
	    else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT))
	    {
	        player.centerX += speed;
	    }

	    if (game.input.keyboard.isDown(Phaser.Keyboard.UP))
	    {
	        player.centerY -= speed;
	    }
	    else if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN))
	    {
	        player.centerY += speed;
	    }
	}
}

function render () {

    game.debug.geom(player,'#0fffff');

}
