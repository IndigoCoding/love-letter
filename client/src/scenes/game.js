import Card from '../helpers/card';
import Zone from '../helpers/zone';
import Dealer from '../helpers/dealer';
import SelectPlayer from './selectPlayer';
import io from 'socket.io-client';

export default class Game extends Phaser.Scene {
    constructor() {
        super({
            key: 'Game'
        });
    }

    preload() {
        this.load.html('nameform', 'src/assets/text/nameform.html');
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
        this.hand = [];
        this.handSize = 0;
        this.playerList = [];
        this.socket = io('http://localhost:3000');

        this.initDealText();
        this.initOtherComponent();
        this.initPlayCardEvent();

        this.socket.on('currentTurn', function(id){
            self.isMyTurn = self.socket.id === id;
        })

        this.socket.on('isPlayerA', function () {
            self.isPlayerA = true;
            self.dealText.setVisible(true);
        })

        this.socket.on('dealCard', function (cardValue) {
            self.handSize += 1;
            self.hand.push(self.dealer.dealCard(cardValue, self.handSize));
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

        this.socket.on('execute', function(socketId, chooseNumber, isSuccessful){
            if(isSuccessful){
               self.dropCardToDropZone(chooseNumber, socketId);
            }
        })

        this.socket.on('handInfo', function(player){
            self.latestEventText.setText(`Player ${player.name} holds ${player.hand.join(',')}`);
        })

        this.socket.on('discard', function(socketId, discardNumber){
            self.dropCardToDropZone(discardNumber, socketId);
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
                self.cardPlayed = gameObject;
                if(gameObject.data.values.config.targetPlayer || gameObject.data.values.config.chooseNumber){
                    self.playCard(true);
                } else {
                    self.playCard(false);
                }
            } else {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        })
    }

    initOtherComponent() {
        var self = this;
        let text = this.add.text(300, 10, 'Please enter your name');
        this.add.text(600, 10, 'Latest event: ');
        this.latestEventText = this.add.text(600, 70, '');
        this.add.text(300, 70, 'Player List:');
        this.playerListText = this.add.text(450, 70, '');
        this.socket.on('playerState', function(list){
            self.playerList = list;
            self.playerListText.setText(list.map(player => player.name));
            if(list.filter(player => player.status).length === 1){

            }
        });
        this.dealer = new Dealer(this);
        this.zone = new Zone(this);
        this.dropZone = this.zone.renderZone();
        this.zone.renderOutline(this.dropZone);
        let element = this.add.dom(400, 0).createFromCache('nameform');
        element.addListener('click');
        element.on('click', function (event) {
            if (event.target.name === 'playButton') {
                var inputText = this.getChildByName('nameField');
                //  Have they entered anything?
                if (inputText.value !== '') {
                    //  Turn off the click events
                    this.removeListener('click');
                    //  Hide the login element
                    this.setVisible(false);
                    //  Populate the text with whatever they typed in
                    text.setText('Welcome ' + inputText.value);
                    self.socket.emit('registerName', inputText.value);
                } else {
                    //  Flash the prompt
                    this.scene.tweens.add({
                        targets: text,
                        alpha: 0.2,
                        duration: 250,
                        ease: 'Power3',
                        yoyo: true
                    });
                }
            }
        });
        this.tweens.add({
            targets: element,
            y: 300,
            duration: 3000,
            ease: 'Power3'
        });
    }

    playCard(haveConfig, targetPlayer = null, chooseNumber = null){
        if(haveConfig){
            this.scene.pause('Game');
            this.scene.add('SelectPlayer', SelectPlayer, true, {
                gameObject: this.cardPlayed, playerList: this.playerList
            });
        } else {
            this.dropZone.data.values.cards++;
            this.cardPlayed.x = (this.dropZone.x - 350) + (this.dropZone.data.values.cards * 50);
            this.cardPlayed.y = this.dropZone.y;
            this.cardPlayed.disableInteractive();
            this.socket.emit('cardPlayed', this.cardPlayed, targetPlayer, chooseNumber, this.cardPlayed.data.values);
            if(this.hand[0] === this.cardPlayed.data.values.value){
                this.hand.splice(0, 1);
            } else {
                this.hand.splice(1, 1);
            }
        }
    }

    dropCardToDropZone(number, socketId = null){
        let sprite = this.dealer.getTextureKey(number);
        this.dropZone.data.values.cards++;
        let card = new Card(this);
        card.render(((this.dropZone.x - 350) + (this.dropZone.data.values.cards * 50)), (this.dropZone.y), sprite).disableInteractive();
        if (socketId === this.socket.id){
            this.hand[0].destroy();
        }
    }
}