const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let rooms = {}; // Armazena as salas e os jogadores

io.on('connection', (socket) => {
    console.log('Novo jogador conectado:', socket.id);

    // Criar sala
    socket.on('createRoom', (roomCode) => {
        if (!rooms[roomCode]) {
            rooms[roomCode] = []; // Cria a sala se não existir
            socket.join(roomCode); // Adiciona o jogador à sala
            socket.emit('roomCreated', roomCode); // Confirma a criação da sala
            console.log(`Sala criada: ${roomCode}`);
        } else {
            socket.emit('errorMessage', 'Sala já existe!'); // Mensagem de erro
        }
    });

    // Entrar na sala
    socket.on('joinRoom', ({ roomCode, playerName, avatar }) => {
        if (rooms[roomCode]) {
            socket.join(roomCode); // Adiciona o jogador à sala
            const playerId = socket.id; // Usando socket.id como ID do jogador
            rooms[roomCode].push({ playerId, playerName, avatar }); // Adiciona o jogador à sala
            socket.emit('playerJoined', { playerId, playerName, avatar }); // Confirma a entrada
            socket.to(roomCode).emit('playerJoined', { playerId, playerName, avatar }); // Notifica outros jogadores
            console.log(`Jogador ${playerName} entrou na sala: ${roomCode}`);
        } else {
            socket.emit('errorMessage', 'Sala não encontrada!'); // Mensagem de erro
        }
    });

    // Evento de desconexão do jogador
    socket.on('disconnect', () => {
        console.log('Jogador desconectado:', socket.id);
        // Aqui você pode adicionar lógica para remover o jogador da sala, se necessário
    });
});

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});


