// Conectando ao servidor WebSocket
const socket = io('http://localhost:3000'); // Substitua pela URL do seu servidor se estiver hospedado externamente

let playerName;
let selectedAvatar = null; // Variável para armazenar o avatar escolhido
let playerId;
let players = {}; // Mapa de jogadores {playerId: {name, avatar}}
let roomCode;
let currentQuestionIndex = 0;
let score = 0;
let timer;

// Função para selecionar o avatar
function selectAvatar(avatarId) {
    selectedAvatar = avatarId;
    const avatars = document.querySelectorAll('.avatar');
    avatars.forEach(avatar => avatar.classList.remove('selected')); // Remove a seleção de todos os avatares
    document.getElementById(avatarId).classList.add('selected'); // Adiciona a seleção ao avatar clicado
}

// Função para criar sala
function createRoom() {
    roomCode = generateRoomCode();
    socket.emit('createRoom', roomCode);
    console.log("Sala criada com código:", roomCode);
    document.getElementById('code-display').textContent = roomCode;
    document.getElementById('room-code').style.display = 'block';
    document.getElementById('game-setup').style.display = 'block';
}

// Função para iniciar o jogo
function startGame() {
    playerName = document.getElementById('player-name').value;
    if (!playerName || !selectedAvatar) { // Verifica se o nome e o avatar foram preenchidos
        alert('Por favor, insira seu nome e escolha um avatar!');
        return;
    }
    playerId = Object.keys(players).length + 1; // Gera um ID único para o jogador
    players[playerId] = { name: playerName, avatar: selectedAvatar }; // Adiciona o jogador à lista

    // Envia os dados do jogador ao servidor WebSocket
    socket.emit('playerJoined', { playerId, playerName, avatar: selectedAvatar, roomCode });

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

// Receber e exibir a tabela de classificação
socket.on('updateLeaderboard', (leaderboard) => {
    const leaderboardElement = document.getElementById('score-board');
    leaderboardElement.innerHTML = '<h2>Tabela de Classificação</h2>';
    leaderboard.forEach((player, index) => {
        leaderboardElement.innerHTML += `<p>${index + 1}. ${players[player.playerId].name}: ${player.score} pontos</p>`;
    });
});
