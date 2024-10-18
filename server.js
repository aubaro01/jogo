const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path'); // Importando o módulo path

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000; // Usar a porta fornecida pelo Render

// Serve o arquivo index.html na rota raiz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Serve index.html
});

// Serve arquivos estáticos (como style.css e script.js)
app.use(express.static(__dirname)); // Serve todos os arquivos na raiz

io.on('connection', (socket) => {
    console.log('Novo jogador conectado:', socket.id);

    // Eventos e lógica do jogo...

    socket.on('disconnect', () => {
        console.log('Jogador desconectado:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

