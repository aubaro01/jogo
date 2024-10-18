// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path'); // Importando a biblioteca path
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Middleware para servir arquivos estáticos
app.use(express.static(__dirname)); // Serve arquivos estáticos na pasta do projeto

// Rota para a página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Usando path.join para construir o caminho
});

// Armazenamento de salas e jogadores
const rooms = {}; // Armazena informações sobre as salas e jogadores

// Perguntas do quiz
const questions = [
    // Suas perguntas aqui (como no código anterior)
];

// Função para gerar um código de sala único
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Escutar conexões de socket.io
io.on('connection', (socket) => {
    console.log('Um jogador se conectou:', socket.id);
    
    // Lógica para manipulação de salas e eventos de jogo
    // ...
    
    socket.on('disconnect', () => {
        console.log('Jogador desconectado:', socket.id);
        // Remover jogador da sala
    });
});

// Inicia o servidor
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});



