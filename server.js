const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', socket => {
    console.log('Novo jogador conectado:', socket.id);

    socket.on('createRoom', roomCode => {
        socket.join(roomCode);
        console.log('Sala criada:', roomCode);
        socket.emit('roomCreated', roomCode); // Confirmação de criação de sala
    });

    socket.on('joinRoom', roomCode => {
        const room = io.sockets.adapter.rooms[roomCode];
        if (room) {
            socket.join(roomCode);
            io.to(roomCode).emit('playerJoined', { playerId: socket.id });
        } else {
            socket.emit('errorMessage', 'Sala não encontrada');
        }
    });

    socket.on('playerMove', (roomCode, moveData) => {
        socket.to(roomCode).emit('updateGame', moveData);
    });

    socket.on('disconnect', () => {
        console.log('Jogador desconectado:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
