import Card from './card';

export default class Dealer {
    constructor(scene) {
        let cardMap = {
            1: 'guard', 2: 'priest', 3: 'baron', 4: 'handmaid', 5: 'prince', 6: 'king', 7: 'countess', 8: 'princess'
        };

        this.dealCard = (cardValue, handSize = 0) => {
            let card = new Card(scene, cardValue);
            card = card.render(300 + handSize * 50, 550, cardMap[cardValue]);
            return card;
        }

        this.getTextureKey = cardValue => cardMap[cardValue];
    }
}