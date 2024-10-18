const socket = io('https://biblical-game-server.onrender.com'); // Substitua com sua URL do Render

        let playerName;
        let avatar = "link-do-avatar-aqui"; // Defina um avatar padrão ou escolha um método para o jogador selecionar
        let playerId;
        let players = {}; // Mapa de jogadores {playerId: {name, avatar}}
        let roomCode;
        let currentQuestionIndex = 0;
        let score = 0;
        let timer;

        // Perguntas combinadas
        const questions = [
            // (As perguntas que você forneceu anteriormente)
        ];

        // Função para gerar um código de sala único
        function generateRoomCode() {
            return Math.random().toString(36).substring(2, 8).toUpperCase(); // Gera um código de sala aleatório
        }

        // Função para criar sala
        function createRoom() {
            roomCode = generateRoomCode(); // Gere um código de sala único
            socket.emit('createRoom', roomCode); // Envia a solicitação para o servidor criar a sala
            console.log("Sala criada com código:", roomCode);
        }

        // Função para entrar em sala
        function joinRoom() {
            playerName = document.getElementById('player-name').value; // Obtém o nome do jogador
            const inputRoomCode = document.getElementById('room-input').value;

            if (!playerName) {
                alert('Por favor, insira seu nome!');
                return;
            }

            socket.emit('joinRoom', { roomCode: inputRoomCode, playerName, avatar }); // Envia dados ao servidor
        }

        // Escuta a confirmação de criação de sala do servidor
        socket.on('roomCreated', (createdRoomCode) => {
            console.log('Sala criada com sucesso:', createdRoomCode);
            roomCode = createdRoomCode;
            document.getElementById('code-display').textContent = roomCode; // Mostra o código da sala
            document.getElementById('room-code').style.display = 'block'; // Mostra a tela de código da sala
            document.getElementById('game-setup').style.display = 'none'; // Esconde a tela de configuração do jogo
            document.getElementById('waiting-room').style.display = 'block'; // Mostra a sala de espera
        });

        // Quando o jogador entra na sala com sucesso
        socket.on('playerJoined', (playerData) => {
            players[playerData.playerId] = { name: playerData.playerName, avatar: playerData.avatar };
            displayPlayerList(); // Atualiza a lista de jogadores na interface

            if (playerId === 1) { // Se for o criador da sala, mostra o botão para iniciar o quiz
                document.getElementById('start-buttons').style.display = 'block';
            }
        });

        // Recebe uma mensagem de erro caso a sala não seja encontrada
        socket.on('errorMessage', (message) => {
            alert(message); // Exibe uma mensagem de erro se a sala não for encontrada
        });

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
