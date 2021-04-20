import Card from '../helpers/card';
import Zone from '../helpers/zone';
import Dealer from '../helpers/dealer';
import io from 'socket.io-client';

export default class Game extends Phaser.Scene {
    constructor() {
        super({
            key: 'Game'
        });
    }

    preload() {
        this.load.image('cyanCardFront', 'src/assets/CyanCardFront.png');
        this.load.image('cyanCardBack', 'src/assets/CyanCardBack.png');
        this.load.image('magentaCardFront', 'src/assets/MagentaCardFront.png');
        this.load.image('guard', 'src/assets/guard.jpg');
        this.load.image('priest', 'src/assets/priest.jpg');
        this.load.image('baron', 'src/assets/baron.jpg');
        this.load.image('handmaid', 'src/assets/handmaid.jpg');
        this.load.image('prince', 'src/assets/prince.jpg');
        this.load.image('king', 'src/assets/king.jpg');
        this.load.image('countess', 'src/assets/countess.jpg');
        this.load.image('princess', 'src/assets/princess.jpg');
    }

    create() {
        this.isPlayerA = false;
        this.opponentCards = [];

        this.dealText = this.add.text (75, 350, ['START GAME']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff');
        let self = this;

        this.dealer = new Dealer(this);

        this.dealText.on('pointerdown', function () {
            self.socket.emit("startGame");
        })

        this.dealText.on('pointerover', function () {
            self.dealText.setColor('#ff69b4');
        })

        this.dealText.on('pointerout', function () {
            self.dealText.setColor('#00ffff');
        })

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
            gameObject.x = dragX;
            gameObject.y = dragY;
        })

        this.input.on('dragstart', function (pointer, gameObject) {
            gameObject.setTint(0xff69b4);
            self.children.bringToTop(gameObject);
        })

        this.input.on('dragend', function (pointer, gameObject, dropped) {
            gameObject.setTint();
            if (!dropped) {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        })

        this.input.on('drop', function (pointer, gameObject, dropZone) {
            dropZone.data.values.cards++;
            gameObject.x = (dropZone.x - 350) + (dropZone.data.values.cards * 50);
            gameObject.y = dropZone.y;
            gameObject.disableInteractive();
            self.socket.emit('cardPlayed', gameObject, self.isPlayerA);
        })

        this.zone = new Zone(this);
        this.dropZone = this.zone.renderZone();
        this.outline = this.zone.renderOutline(this.dropZone);

        this.socket = io('http://localhost:3000');

        this.socket.on('connect', function () {
            console.log('Connected!');
        });

        this.socket.on('isPlayerA', function () {
            self.isPlayerA = true;
            self.dealText.setInteractive();
        })

        this.socket.on('dealCard', function (cardValue) {
            self.dealer.dealCard(cardValue);
            self.dealText.disableInteractive();
        })

        this.socket.on('cardPlayed', function (gameObject, isPlayerA) {
            if (isPlayerA !== self.isPlayerA) {
                let sprite = gameObject.textureKey;
                self.opponentCards.shift().destroy();
                self.dropZone.data.values.cards++;
                let card = new Card(self);
                card.render(((self.dropZone.x - 350) + (self.dropZone.data.values.cards * 50)), (self.dropZone.y), sprite).disableInteractive();
            }
        })
    }

    update() {

    }
}