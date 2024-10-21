// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

const roomScores = {}; // Objeto para armazenar as pontuações de cada sala

io.on('connection', (socket) => {
    console.log('Novo jogador conectado:', socket.id);

    // Evento para criar sala
    socket.on('createRoom', () => {
        const roomCode = generateRoomCode();
        socket.join(roomCode);
        console.log('Sala criada:', roomCode);
        socket.emit('roomCreated', roomCode);
    });

    // Evento para entrar em uma sala existente
    socket.on('joinRoom', (roomCode) => {
        const room = io.sockets.adapter.rooms.get(roomCode);
        if (room && room.size > 0) { // Se a sala existir e tiver jogadores
            socket.join(roomCode);
            console.log(`Jogador ${socket.id} entrou na sala ${roomCode}`);
            io.to(roomCode).emit('playerJoined', { playerId: socket.id });
        } else {
            socket.emit('errorMessage', 'Sala não encontrada ou já vazia');
        }
    });

    // Evento para atualizar pontuações e enviar a tabela de classificação
    socket.on('endGame', ({ roomCode, playerId, score }) => {
        if (!roomScores[roomCode]) roomScores[roomCode] = [];
        roomScores[roomCode].push({ playerId, score });

        // Ordenar a classificação pela pontuação
        roomScores[roomCode].sort((a, b) => b.score - a.score);

        // Enviar a classificação atualizada para todos na sala
        io.to(roomCode).emit('updateLeaderboard', roomScores[roomCode]);
    });

    // Evento de desconexão do jogador
    socket.on('disconnect', () => {
        console.log('Jogador desconectado:', socket.id);
    });
});

// Função para gerar um código de sala aleatório
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase(); // Ex: "A1B2C3"
}

// Inicia o servidor
server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});



