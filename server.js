// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Middleware para servir arquivos estáticos
// Rota para a página principal
app.get('/', (req, res) => {
    res.sendFile(__dirname  + 'index.html'); // Certifique-se de que o caminho para seu arquivo HTML está correto
});

// Escutar conexões de socket.io
io.on('connection', (socket) => {
    console.log('Um jogador se conectou:', socket.id);
    
    // Lógica de sala e eventos de jogo aqui...

    socket.on('disconnect', () => {
        console.log('Jogador desconectado:', socket.id);
    });
});

// Inicia o servidor
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});


