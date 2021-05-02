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
    players.forEach(function(p, index){
        dealCard(index);
    });
    dealCard(0);
    gameStarted = true;
}

function dealCard(position, afterDiscard = false){
    let card = deck.pop();
    players[position].socket.emit('dealCard', card);
    players[position].hand.push(card);
    if(!afterDiscard){
        io.emit('currentTurn', players[position].id);
    }
    io.emit('deckRemaining', deck.length);
}

function emitPlayerInfo(player){
    return {id: player.id, name: player.name, status: player.status, currentEffect: player.currentEffect};
}

function playerStateAnnounce(socket = null){
    if(socket){
        socket.emit('playerState', players.map(emitPlayerInfo));
    } else {
        io.emit('playerState', players.map(emitPlayerInfo));
    }
}

function handleCardPlayed(gameObject, position, targetPlayer, chooseNumber){
    let cardValue = parseInt(gameObject.data.value);
    if(players[position].hand[0] === cardValue){
        players[position].hand.splice(0, 1);
    } else {
        players[position].hand.splice(1, 1);
    }
    switch (cardValue){
        case 4:
            players[position].currentEffect = 4;
            break;
        case 1:
            players.forEach(function(player, index){
               if(player.id === targetPlayer){
                   if (player.hand.includes(parseInt(chooseNumber))){
                       players[index].status = false;
                       io.emit('execute', player.id, chooseNumber, true);
                   } else {
                       io.emit('execute', player.id, chooseNumber, false);
                   }
               }
            });
            break;
        case 2:
            players.forEach(function(player, index){
                if(player.id === targetPlayer){
                    players[position].socket.emit('handInfo', {
                        hand: player.hand,
                        name: player.name
                    });
                }
            });
            break;
        case 3:
            players.forEach(function(player, index){
                if(player.id === targetPlayer){
                    if(player.hand[0] < players[position].hand[0]){
                        players[index].status = false;
                        io.emit('execute', player.id, player.hand[0], true);
                    } else if (player.hand[0] > players[position].hand[0]){
                        players[position].status = false;
                        io.emit('execute', players[position].id, players[position].hand[0], true);
                    } else {
                        io.emit('execute', player.id, null, false);
                    }
                }
            });
            break;
        case 5:
            players.forEach(function(player, index){
                if(player.id === targetPlayer){
                    if(player.hand[0] === 8){
                        players[index].status = false;
                        io.emit('execute', player.id, 8, true);
                    } else {
                        io.emit('discard', player.id, players[index].hand.pop());
                        dealCard(index, true);
                    }
                }
            });
            break;
        case 6:
            players.forEach(function(player, index){
                if(player.id === targetPlayer){
                    let tmp;
                    tmp = players[position].hand[0];
                    players[position].hand[0] = players[index].hand[0];
                    players[index].hand[0] = tmp;
                    players[index].socket.emit('newHand', players[index].hand[0]);
                    players[position].socket.emit('newHand', players[position].hand[0]);
                }
            });
            break;
        default:
    }
    io.emit('playerState', players.map(emitPlayerInfo));
}

io.on('connection', function (socket) {
    console.log('A user connected: ' + socket.id);
    playerStateAnnounce(socket);
    if(gameStarted){
        socket.disconnect();
    }

    players.push({
        id: socket.id,
        socket: socket,
        name: null,
        hand: [],
        currentEffect: [],
        status: true
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
        playerStateAnnounce();
    })

    socket.on('cardPlayed', function (gameObject, targetPlayer, chooseNumber, cardData) {
        gameObject.data = cardData;
        io.emit('cardPlayed', gameObject, socket.id);
        let position = 0;
        players.some(function(player, index){
            if(player.id === socket.id){
                position = index;
                return true;
            } else return false;
        })
        handleCardPlayed(gameObject, position, targetPlayer, chooseNumber);
        while(true){
            if(position === players.length - 1){
                position = 0;
            } else {
                position += 1;
            }
            if(players[position].status){
                break;
            }
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