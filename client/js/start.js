

widthTex = 600;
var start =function(game){

};

start.prototype = {

	preload: function() {
		 game.load.spritesheet('circle', '/assets/ballsf.png',81,81,3);
		 game.load.image('rfood', '/assets/rfood.png');
		 game.load.image('gfood', '/assets/gfood.png');
		 game.load.image('bfood', '/assets/bfood.png');
		 game.load.image('backdrop','/assets/backdrop.png');
	},

	create: function() {
		game.add.plugin(PhaserInput.Plugin);
		game.world.setBounds(0, 0, 3000, 3000); // bounds of the world
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.stage.disableVisibilityChange = true;
		game.physics.p2.setImpactEvents(true);
		game.physics.p2.restitution = 1;
		if (socket) {socket.close()};
		socket = io.connect();

		game.stage.backgroundColor = 0xc0aeef;
		game.add.tileSprite(0,0,3000,3000,'backdrop');
		var wkey = game.input.keyboard.addKey(Phaser.Keyboard.W);
		wkey.onDown.add(this.star, this);

		var Tex = game.add.inputField(document.documentElement.clientWidth/2 - widthTex/2, document.documentElement.clientHeight/2 - 10,  {
		    font: '35px Arial',
		    fill: '#212121',
		    fontWeight: 'bold',
		    width: widthTex,
		    padding: 8,
		    borderWidth: 4,
		    borderColor: '#000',
		    borderRadius: 10,
		    placeHolder: 'Enter Your Name',
		    type: PhaserInput.InputType.text
		});
		
	},

	star: function(){
		game.state.start('main');
	}
};