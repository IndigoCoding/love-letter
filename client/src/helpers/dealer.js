import Card from './card';

export default class Dealer {
    constructor(scene) {
        let cardMap = {
            1: 'guard', 2: 'priest', 3: 'baron', 4: 'handmaid', 5: 'prince', 6: 'king', 7: 'countess', 8: 'princess'
        };

        this.dealCards = () => {
            let playerSprite;
            let opponentSprite;
            if (scene.isPlayerA) {
                playerSprite = 'cyanCardFront';
                opponentSprite = 'magentaCardBack';
            } else {
                playerSprite = 'magentaCardFront';
                opponentSprite = 'cyanCardBack';
            }
            for (let i = 0; i < 5; i++) {
                let playerCard = new Card(scene);
                playerCard.render(475 + (i * 100), 650, playerSprite);

                let opponentCard = new Card(scene);
                scene.opponentCards.push(opponentCard.render(475 + (i * 100), 125, opponentSprite).disableInteractive());
            }
        }

        this.dealCard = (cardValue, handSize = 0) => {
            let card = new Card(scene, cardValue);
            card.render(475 + handSize * 50, 650, cardMap[cardValue]);
        }
    }
}