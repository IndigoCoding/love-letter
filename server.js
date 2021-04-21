const server = require('express')();
const http = require('http').createServer(server);
const io = require('socket.io')(http,{
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});

let players = [];
let deck = initDeck();
let gameStarted = false;
shuffle(deck);

function initDeck(){
    let deck = [1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8];
    shuffle(deck);
    return deck;
}

// Fisher-Yates shuffle
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startGame(){
    players.forEach(function(p){
        p.socket.emit('dealCard', deck.pop());
    });
    dealCard(0);
    gameStarted = true;
}

function dealCard(position){
    let card = deck.pop();
    players[position].socket.emit('dealCard', card);
    players[position].hand.push(card);
    io.emit('currentTurn', players[position].id);
    io.emit('deckRemaining', deck.length);
}

io.on('connection', function (socket) {
    console.log('A user connected: ' + socket.id);
    socket.emit('playerState', players.map(player => player.name));
    if(gameStarted){
        socket.disconnect();
    }

    players.push({
        id: socket.id,
        socket: socket,
        name: null,
        hand: []
    });

    if (players.length === 1) {
        io.emit('isPlayerA');
    }

    socket.on('startGame', function(){
        io.emit('startGame');
        startGame();
    })

    socket.on('registerName', function(name){
        players = players.map((player) => {
            if(player.id === socket.id){
                return {...player, name};
            } else {
                return player;
            }
        })
        io.emit('playerState', players.map(player => player.name));
    })

    socket.on('cardPlayed', function (gameObject) {
        io.emit('cardPlayed', gameObject, socket.id);
        let position = 0;
        players.some(function(player, index){
            if(player.id === socket.id){
                position = index;
                return true;
            } else return false;
        })
        if(position === players.length - 1){
            position = 0;
        } else {
            position += 1;
        }
        dealCard(position);
    });

    socket.on('disconnect', function () {
        console.log('A user disconnected: ' + socket.id);
        players = players.filter(player => player.id !== socket.id);
        if(players.length === 0 && gameStarted){
            gameStarted = false;
            deck = initDeck();
        }
    });
});

http.listen(3000, function () {
    console.log('Server started!');
});