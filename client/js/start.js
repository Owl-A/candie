// widthTex = 600;
var Name;
var start =function(game){
};

start.prototype = { 
	preload: function() {
		 game.load.spritesheet('circle', '/assets/ballsf.png',81,81,3);
		 game.load.image('rfood', '/assets/rfood.png');
		 game.load.image('gfood', '/assets/gfood.png');
		 game.load.image('bfood', '/assets/bfood.png');
		 game.load.image('backdrop','/assets/backdrop.png');
		 game.load.spritesheet('intro','/assets/intro_sheet.png',547,472,3);
		 game.load.image('round-rect','/assets/rect.png');
	},

	create: function() {
		game.add.plugin(PhaserInput.Plugin);
		game.world.setBounds(0, 0, document.documentElement.clientWidth, document.documentElement.clientHeight); // bounds of the world
		// game.physics.startSystem(Phaser.Physics.P2JS);
		// game.stage.disableVisibilityChange = true;
		// game.physics.p2.setImpactEvents(true);
		// game.physics.p2.restitution = 1;
		if (socket) {socket.close()};
		socket = io.connect();
		var intro = game.add.sprite(document.documentElement.clientWidth/2, 10, 'intro');
		intro.anchor.set(0.5,0);
		intro.scale.setTo(0.75*document.documentElement.clientHeight/intro.height);
		intro.animations.add('flicker');
		intro.animations.play('flicker',0.5,true);

		game.stage.backgroundColor = 0xc0aeef;
		// game.add.tileSprite(0,0,3000,3000,'backdrop');
		var wkey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
		wkey.onDown.add(this.star, this);

		Name = game.add.inputField(document.documentElement.clientWidth/2 - intro.width/2, document.documentElement.clientHeight*(0.82) ,  {
		    font: '35px Arial',
		    fill: '#212121',
		    fontWeight: 'bold',
		    width: intro.width,
		    padding: 8,
		    borderWidth: 4,
		    borderColor: '#000',
		    borderRadius: 10,
		    placeHolder: 'Enter Your Name',

		    type: PhaserInput.InputType.text
		});
		Name.focusOutOnEnter = true;
		//Name.OnEnter = this.star();
		Name.startFocus();
	},

	star: function(){
		X = Name.value;
		Name.endFocus();
		Name = X;
		game.state.start('main');
	}
};