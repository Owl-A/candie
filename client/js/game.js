

var socket; 

game = new Phaser.Game(document.documentElement.clientWidth - 20 , document.documentElement.clientHeight - 20, Phaser.CANVAS, 'gameDiv');

game.config.forceSetTimeOut = true;

game.state.add('start', start);
game.state.add('main', main);

game.state.start('start');