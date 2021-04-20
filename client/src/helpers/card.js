export default class Card {
    constructor(scene, cardValue = 1) {
        this.render = (x, y, sprite) => {
            let card = scene.add.image(x, y, sprite).setScale(0.7, 0.7).setInteractive();
            card.setData({value: cardValue});
            scene.input.setDraggable(card);
            return card;
        }
    }
}