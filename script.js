// Conectando ao servidor WebSocket
const socket = io('https://biblical-game-server.onrender.com'); // Substitua com sua URL do Render

let playerName;
let avatar;
let playerId;
let players = {}; // Mapa de jogadores {playerId: {name, avatar}}
let roomCode;
let currentQuestionIndex = 0;
let score = 0;
let timer;

// Perguntas combinadas
const questions = [
    // (as perguntas vão aqui)
        
];

// Função para gerar um código de sala único
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase(); // Gera um código de sala aleatório
}

// Função para criar sala
function createRoom() {
    roomCode = generateRoomCode(); // Gere um código de sala único
    console.log("Tentando criar sala com código:", roomCode);
    socket.emit('createRoom', roomCode); // Envia a solicitação para o servidor criar a sala
}

// Função para entrar em sala
function joinRoom() {
    const inputRoomCode = document.getElementById('room-input').value.trim(); // Remove espaços em branco
    console.log("Tentando entrar na sala:", inputRoomCode);
    
    if (!inputRoomCode) {
        alert("Por favor, insira um código de sala válido.");
        return; // Previne o envio se o campo estiver vazio
    }
    socket.emit('joinRoom', inputRoomCode); // Solicita ao servidor para entrar na sala
}

// Escuta a confirmação de criação de sala do servidor
socket.on('roomCreated', (createdRoomCode) => {
    console.log('Sala criada com sucesso:', createdRoomCode);
    roomCode = createdRoomCode;
    document.getElementById('code-display').textContent = roomCode; // Mostra o código da sala
    document.getElementById('room-code').style.display = 'block';
    document.getElementById('game-setup').style.display = 'block';
});

// Quando o jogador entra na sala com sucesso
socket.on('playerJoined', (playerData) => {
    console.log('Jogador entrou na sala:', playerData);
    players[playerData.playerId] = { name: playerData.playerName, avatar: playerData.avatar };
    displayPlayerList(); // Atualiza a lista de jogadores na interface
});

// Recebe uma mensagem de erro caso a sala não seja encontrada
socket.on('errorMessage', (message) => {
    alert(message); // Exibe uma mensagem de erro se a sala não for encontrada
});

// Função para iniciar o jogo
function startGame() {
    playerName = document.getElementById('player-name').value;
    if (!playerName || !avatar) {
        alert('Por favor, insira seu nome e escolha um avatar!');
        return;
    }
    playerId = Object.keys(players).length + 1; // Gera um ID único
    players[playerId] = { name: playerName, avatar: avatar }; // Adiciona o jogador ao objeto players

    // Envia os dados do jogador ao servidor WebSocket
    socket.emit('playerJoined', { playerId, playerName, avatar, roomCode });

    document.getElementById('game-setup').style.display = 'none';
    document.getElementById('waiting-room').style.display = 'block';
    displayPlayerList();
    if (playerId === 1) {
        document.getElementById('start-buttons').style.display = 'block'; // Exibe botões para o criador da sala
    }
}

// Exibe a lista de jogadores
function displayPlayerList() {
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = ''; // Limpa a lista de jogadores
    Object.keys(players).forEach(id => {
        const player = players[id];
        const playerDiv = document.createElement('div');
        playerDiv.innerHTML = `<img src="${player.avatar}" alt="${player.name}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">${player.name}`;
        playerList.appendChild(playerDiv);
    });
}

// Iniciar modo de perguntas
function startQuestionMode() {
    socket.emit('startQuiz', roomCode); // Envia o evento para iniciar o quiz
    document.getElementById('waiting-room').style.display = 'none';
    document.getElementById('quiz').style.display = 'block';
    document.getElementById('total-questions').textContent = questions.length; // Define o total de perguntas
    startQuiz();
}

// Função para iniciar o quiz
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    displayQuestion();
}

// Exibe a pergunta atual
function displayQuestion() {
    const questionElement = document.getElementById('question');
    const optionsElement = document.getElementById('options');
    const timerElement = document.getElementById('timer');
    const questionCounter = document.getElementById('current-question');

    questionElement.textContent = questions[currentQuestionIndex].question;
    optionsElement.innerHTML = '';

    questions[currentQuestionIndex].options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = () => checkAnswer(option);
        optionsElement.appendChild(button);
    });

    questionCounter.textContent = currentQuestionIndex + 1; // Atualiza a contagem de perguntas
    startTimer();
}

// Iniciar o cronômetro
function startTimer() {
    let timeLeft = 15; // Tempo em segundos
    const timerElement = document.getElementById('timer');

    timerElement.textContent = timeLeft;

    timer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            nextQuestion(); // Passa para a próxima pergunta quando o tempo acabar
        }
    }, 1000);
}

// Verifica a resposta selecionada
function checkAnswer(selected) {
    clearInterval(timer);
    const correct = questions[currentQuestionIndex].correct;
    const questionElement = document.getElementById('question');
    const optionsElement = document.getElementById('options');

    if (selected === correct) {
        questionElement.classList.add('correct');
        score++;
    } else {
        questionElement.classList.add('incorrect');
    }

    optionsElement.childNodes.forEach(button => {
        button.disabled = true; // Desabilita os botões após a resposta
        if (button.textContent === correct) {
            button.classList.add('correct');
        } else {
            button.classList.add('incorrect');
        }
    });

    setTimeout(nextQuestion, 2000); // Espera 2 segundos antes de passar para a próxima pergunta
}

// Avança para a próxima pergunta
function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        endGame();
    }
}

// Finaliza o jogo
function endGame() {
    document.getElementById('quiz').style.display = 'none';
    document.getElementById('final-result').style.display = 'block';
    document.getElementById('final-score').textContent = `Seu resultado: ${score} de ${questions.length}`;
    document.getElementById('final-avatar').src = avatar; // Exibe o avatar final
    document.getElementById('score-board').textContent = `Jogadores: ${Object.keys(players).map(id => `${players[id].name}: ${score}`).join(', ')}`;
}

// Reinicia o jogo
function restartGame() {
    document.getElementById('final-result').style.display = 'none';
    document.getElementById('waiting-room').style.display = 'block';
    displayPlayerList();
}

// Sai da sala
function leaveRoom() {
    alert("Você saiu da sala.");
    players = {}; // Reseta os jogadores
    document.getElementById('room-code').style.display = 'block';
    document.getElementById('waiting-room').style.display = 'none';
    document.getElementById('final-result').style.display = 'none';
}

// Receber eventos de atualização do jogo
socket.on('updateGame', (data) => {
    if (data.action === 'startQuiz') {
        startQuiz();
    }
    // Outros eventos podem ser tratados aqui
});

// Quando outro jogador se junta à sala
socket.on('playerJoined', (playerData) => {
    players[playerData.playerId] = { name: playerData.playerName, avatar: playerData.avatar };
    displayPlayerList(); // Atualiza a lista de jogadores na interface
});

// Ouvintes de eventos no carregamento da página
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('create-room-button').onclick = createRoom;
    document.getElementById('join-room-button').onclick = joinRoom;
});
