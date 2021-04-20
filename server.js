const server = require('express')();
const http = require('http').createServer(server);
const io = require('socket.io')(http,{
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});

let players = [];
let deck = [1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8];
let gameStarted = false;
shuffle(deck);

// Fisher-Yates shuffle
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startGame(){
    console.log('called');
    players.forEach(function(p){
        p.socket.emit('dealCard', deck.pop());
    });
    players[0].socket.emit('dealCard', deck.pop());
    io.emit('deckRemaining', deck.length);
    gameStarted = true;
}

io.on('connection', function (socket) {
    console.log('A user connected: ' + socket.id);
    if(gameStarted){
        socket.disconnect();
    }

    players.push({
        id: socket.id,
        socket: socket
    });

    if (players.length === 1) {
        io.emit('isPlayerA');
    };

    socket.on('startGame', function(){
        io.emit('startGame');
        startGame();
    })

    socket.on('dealCard', function () {
        io.emit('dealCard');
    });

    socket.on('cardPlayed', function (gameObject, isPlayerA) {
        io.emit('cardPlayed', gameObject, isPlayerA);
    });

    socket.on('disconnect', function () {
        console.log('A user disconnected: ' + socket.id);
        players = players.filter(player => player.id !== socket.id);
    });
});

http.listen(3000, function () {
    console.log('Server started!');
});