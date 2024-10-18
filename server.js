// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Serve index.html
});

// Serve arquivos estáticos (como style.css e script.js)
app.use(express.static(__dirname)); // Serve todos os arquivos na raiz

// Armazenamento de salas e jogadores
const rooms = {}; // Armazena informações sobre as salas e jogadores

// Perguntas do quiz
const questions = [
    {
        question: "Quem liderou os israelitas para fora do Egito?",
        options: ["Moisés", "Abraão", "Davi"],
        correct: "Moisés"
    },
    {
        question: "Quem enfrentou o gigante Golias?",
        options: ["Davi", "Sansão", "Gideão"],
        correct: "Davi"
    },
    {
        question: "Quantos dias Noé e sua família ficaram na arca durante o dilúvio?",
        options: ["40 dias", "150 dias", "100 dias"],
        correct: "150 dias"
    },
    {
        question: "Qual mar foi dividido para que os israelitas escapassem dos egípcios?",
        options: ["Mar Vermelho", "Mar Mediterrâneo", "Rio Jordão"],
        correct: "Mar Vermelho"
    },
    {
        question: "Quem foi o primeiro rei de Israel?",
        options: ["Saul", "Davi", "Salomão"],
        correct: "Saul"
    },
    {
        question: "Quantas pragas houve no Egito?",
        options: ["10", "7", "12"],
        correct: "10"
    },
    {
        question: "Quem foi chamado de amigo de Deus?",
        options: ["Abraão", "Moisés", "Noé"],
        correct: "Abraão"
    },
    {
        question: "Qual o nome da mãe de Jesus?",
        options: ["Maria", "Sara", "Madalena"],
        correct: "Maria"
    },
    {
        question: "Quem escreveu os Salmos?",
        options: ["Davi", "Salomão", "Elias"],
        correct: "Davi"
    },
    {
        question: "Quantos livros há no Novo Testamento?",
        options: ["27", "39", "66"],
        correct: "27"
    },
    {
        question: "Quem traiu Jesus?",
        options: ["Judas", "Pedro", "João"],
        correct: "Judas"
    },
    {
        question: "Qual é o primeiro livro da Bíblia?",
        options: ["Gênesis", "Êxodo", "Levítico"],
        correct: "Gênesis"
    },
    {
        question: "Qual o nome do apóstolo que duvidou da ressurreição de Jesus?",
        options: ["Tomé", "André", "Mateus"],
        correct: "Tomé"
    },
    {
        question: "Qual o nome do profeta que foi engolido por um grande peixe?",
        options: ["Jonas", "Elias", "Miquéias"],
        correct: "Jonas"
    },
    {
        question: "Qual foi o último livro da Bíblia?",
        options: ["Apocalipse", "Judas", "Tiago"],
        correct: "Apocalipse"
    },
    {
        question: "Quantos apóstolos Jesus teve?",
        options: ["12", "10", "14"],
        correct: "12"
    },
];

// Função para gerar um código de sala único
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Escutar conexões de socket.io
io.on('connection', (socket) => {
    console.log('Um jogador se conectou:', socket.id);

    socket.on('createRoom', (roomCode) => {
        if (!rooms[roomCode]) {
            rooms[roomCode] = {
                players: {},
                currentQuestionIndex: 0,
                scores: {}
            };
            socket.join(roomCode);
            socket.emit('roomCreated', roomCode);
            console.log('Sala criada:', roomCode);
        } else {
            socket.emit('errorMessage', 'Código de sala já existe!');
        }
    });

    socket.on('joinRoom', (roomCode) => {
        const room = rooms[roomCode];
        if (room) {
            socket.join(roomCode);
            socket.emit('playerJoined', { playerId: socket.id, roomCode });
            room.players[socket.id] = { name: `Jogador ${Object.keys(room.players).length + 1}` }; // Nome padrão, pode ser alterado
            io.to(roomCode).emit('updateGame', { action: 'playerJoined', playerData: room.players });
            console.log('Jogador entrou na sala:', roomCode);
        } else {
            socket.emit('errorMessage', 'Sala não encontrada!');
        }
    });

    socket.on('playerJoined', ({ playerId, playerName, avatar, roomCode }) => {
        const room = rooms[roomCode];
        if (room) {
            room.players[playerId] = { name: playerName, avatar };
            room.scores[playerId] = 0; // Inicializa a pontuação
            io.to(roomCode).emit('updateGame', { action: 'playerList', players: room.players });
        }
    });

    socket.on('startQuiz', (roomCode) => {
        const room = rooms[roomCode];
        if (room) {
            room.currentQuestionIndex = 0; // Reseta a pergunta atual
            io.to(roomCode).emit('updateGame', { action: 'startQuiz', questions: questions });
            console.log('Quiz iniciado na sala:', roomCode);
        }
    });

    socket.on('answerQuestion', ({ roomCode, answer }) => {
        const room = rooms[roomCode];
        const currentQuestion = questions[room.currentQuestionIndex];

        if (currentQuestion && answer === currentQuestion.correct) {
            room.scores[socket.id] += 1; // Aumenta a pontuação
            io.to(roomCode).emit('updateGame', { action: 'correctAnswer', playerId: socket.id });
        } else {
            io.to(roomCode).emit('updateGame', { action: 'wrongAnswer', playerId: socket.id });
        }

        // Avança para a próxima pergunta
        room.currentQuestionIndex++;
        if (room.currentQuestionIndex >= questions.length) {
            io.to(roomCode).emit('updateGame', { action: 'endGame', scores: room.scores });
            delete rooms[roomCode]; // Remove a sala após o fim do jogo
        } else {
            io.to(roomCode).emit('updateGame', { action: 'nextQuestion', question: questions[room.currentQuestionIndex] });
        }
    });

    socket.on('disconnect', () => {
        console.log('Jogador desconectado:', socket.id);
        // Remover jogador da sala
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            if (room.players[socket.id]) {
                delete room.players[socket.id];
                io.to(roomCode).emit('updateGame', { action: 'playerLeft', playerId: socket.id });
                break;
            }
        }
    });
});

// Inicia o servidor
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});


