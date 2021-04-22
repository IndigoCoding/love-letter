export default class Card {
    constructor(scene, cardValue = 1) {
        this.value = cardValue;
        this.config = {};

        this.render = (x, y, sprite) => {
            let card = scene.add.image(x, y, sprite).setScale(0.4, 0.4).setInteractive();
            let config = {
                targetPlayer: false,
                chooseNumber: false
            };
            if([1, 2, 3, 5, 6].includes(cardValue)){
                config.targetPlayer = true;
            }
            if(cardValue === 1){
                config.chooseNumber = true;
            }
            card.setData({value: cardValue, config: config});
            scene.input.setDraggable(card);
            return card;
        }
    }
}