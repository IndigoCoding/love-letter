export default class SelectPlayer extends Phaser.Scene {
    constructor() {
        super({
            key: 'SelectPlayer'
        });
    }

    init(data){
        this.gameObject = data.gameObject;
        this.playerList = data.playerList;
    }

    preload() {
        this.load.html('chooseNumber', 'src/assets/text/choosenumber.html');
    }

    create() {
        let self = this;
        this.cameras.main.setViewport(0, 0, 300, 500);
        this.cameras.main.setPosition(500, 100);
        this.cameras.main.setBackgroundColor('#ffffff');
        this.add.text(100, 10, 'ZA WARUDO', {fill: 'black'});
        this.add.text(100, 50, 'Select player', {fill: 'black'});
        let el = '';
        this.playerList.forEach((player) => {
            if(player.status){
                el += `<option value="${player.id}">${player.name}</option>`;
            }
        })
        let selectPlayer = this.add.dom(100, 100).createFromHTML(
            `<select class="form-control" id="selectPlayer" name="selectPlayer">${el}</select>`
        );

        if(this.gameObject.data.values.config.chooseNumber){
            this.add.text(100, 150, 'Choose number', {fill: 'black'});
            var chooseNumber = this.add.dom(100, 200).createFromCache('chooseNumber');
        }

        let button = this.add.text(100, 300, 'Commit', {fill: 'black', backgroundColor: 'orange'}).setInteractive();
        button.on('pointerdown', function() {
            self.scene.resume('Game');
            if(self.gameObject.data.values.config.chooseNumber) {
                self.scene.get('Game').playCard(false, selectPlayer.node.firstElementChild.value, chooseNumber.node.firstElementChild.value);
            } else {
                self.scene.get('Game').playCard(false, selectPlayer.node.firstElementChild.value);
            }
            self.scene.remove('SelectPlayer');
        });
    }

    update() {

    }
}