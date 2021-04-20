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
        let self = this;
        this.isPlayerA = false;
        this.isMyTurn = false;
        this.handSize = 0;
        this.opponentCards = [];

        this.initDealText();
        this.initOtherComponent();
        this.initPlayCardEvent();

        this.socket = io('http://localhost:3000');

        this.socket.on('currentTurn', function(id){
            self.isMyTurn = self.socket.id === id;
        })

        this.socket.on('isPlayerA', function () {
            self.isPlayerA = true;
            self.dealText.setVisible(true);
        })

        this.socket.on('dealCard', function (cardValue) {
            self.handSize += 1;
            self.dealer.dealCard(cardValue, self.handSize);
            self.dealText.setVisible(false);
        })

        this.socket.on('cardPlayed', function (gameObject, socketId) {
            if (socketId !== self.socket.id) {
                let sprite = gameObject.textureKey;
                self.dropZone.data.values.cards++;
                let card = new Card(self);
                card.render(((self.dropZone.x - 350) + (self.dropZone.data.values.cards * 50)), (self.dropZone.y), sprite).disableInteractive();
            }
        })
    }

    update() {

    }

    initDealText(){
        var self = this;
        this.dealText = this.add.text (75, 350, ['START GAME']).setFontSize(18).setFontFamily('Trebuchet MS')
            .setColor('#00ffff').setVisible(false).setInteractive();

        this.dealText.on('pointerdown', function () {
            self.socket.emit("startGame");
        })

        this.dealText.on('pointerover', function () {
            self.dealText.setColor('#ff69b4');
        })

        this.dealText.on('pointerout', function () {
            self.dealText.setColor('#00ffff');
        })
    }

    initPlayCardEvent() {
        let self = this;
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
            if(self.isMyTurn){
                dropZone.data.values.cards++;
                gameObject.x = (dropZone.x - 350) + (dropZone.data.values.cards * 50);
                gameObject.y = dropZone.y;
                gameObject.disableInteractive();
                self.socket.emit('cardPlayed', gameObject);
            } else {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        })
    }

    initOtherComponent() {
        this.dealer = new Dealer(this);
        this.zone = new Zone(this);
        this.dropZone = this.zone.renderZone();
        this.outline = this.zone.renderOutline(this.dropZone);
    }
}