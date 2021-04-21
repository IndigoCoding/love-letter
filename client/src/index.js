import Phaser from 'phaser';
import Game from './scenes/game';

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 1280,
    height: 700,
    dom: {
        createContainer: true
    },
    scene: [
        Game
    ]
};

const game = new Phaser.Game(config);
