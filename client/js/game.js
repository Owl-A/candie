/**
 * @file this file is the first step of firing up the game. It is used to initiaite the graphics engine and also to call the start.js file for setting up the introduction page.
*/

var socket; 

game = new Phaser.Game(document.documentElement.clientWidth - 20 , document.documentElement.clientHeight - 20, Phaser.CANVAS, 'gameDiv');

game.config.forceSetTimeOut = true;

game.state.add('start', start);
game.state.add('main', main);

game.state.start('start');