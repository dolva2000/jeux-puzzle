document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const moveCountDisplay = document.getElementById('move-count');
    const timerDisplay = document.getElementById('timer');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const resetBtn = document.getElementById('reset-btn');
    const winMessage = document.getElementById('win-message');
    const playAgainBtn = document.getElementById('play-again-btn');
    const finalMovesDisplay = document.getElementById('final-moves');
    const finalTimeDisplay = document.getElementById('final-time');
    const difficultySelect = document.getElementById('difficulty-select');
    const helpBtn = document.getElementById('help-btn');
    const tipText = document.getElementById('tip-text');
    const fireworksCanvas = document.getElementById('fireworks-canvas');

    let state = [];
    let size = 4;
    let moves = 0;
    let timerInterval;
    let seconds = 0;
    let isPlaying = false;
    let tipInterval;
    let helpActive = false;
    let gameStarted = false;
    let lastHelpTime = 0;

    // Conseils de base
    const generalTips = [
        "Conseil : Commencez par résoudre la première ligne de gauche à droite.",
        "Astuce : Une fois la première ligne complète, ne la touchez plus !",
        "Conseil : Résolvez ensuite la première colonne de haut en bas.",
        "Astuce : Travaillez en spirale : ligne, colonne, ligne, colonne...",
        "Conseil : Les 4 dernières tuiles se placeront automatiquement.",
        "Astuce : Créez des espaces temporaires pour manœuvrer les tuiles.",
        "Conseil : Parfois il faut éloigner une tuile pour mieux la replacer.",
        "Astuce : Visualisez 2-3 mouvements à l'avance avant d'agir.",
        "Conseil : Ne paniquez pas si vous défaites du progrès temporairement.",
        "Astuce : Utilisez le bouton Aide pour un coup stratégique !"
    ];

    // Conseils contextuels basés sur la progression
    function getContextualTip() {
        const progress = calculateProgress();

        if (progress < 20) {
            return "Conseil : Commencez par placer les tuiles 1, 2, 3, 4 dans la première ligne.";
        } else if (progress < 40) {
            return "Astuce : Maintenant, concentrez-vous sur la première colonne.";
        } else if (progress < 60) {
            return "Conseil : Continuez ligne par ligne, vous progressez bien !";
        } else if (progress < 80) {
            return "Astuce : Plus que quelques tuiles ! Restez concentré.";
        } else if (progress < 95) {
            return "Conseil : Presque fini ! Les dernières tuiles sont les plus délicates.";
        } else {
            return "Astuce : Vous y êtes presque ! Encore quelques mouvements !";
        }
    }

    // Calcule le pourcentage de tuiles bien placées
    function calculateProgress() {
        let correctCount = 0;
        for (let i = 0; i < state.length - 1; i++) {
            if (state[i] === i + 1) correctCount++;
        }
        return (correctCount / (state.length - 1)) * 100;
    }

    // Initialize the game
    function initGame() {
        resetGame();
        startTipRotation();
    }

    function startTipRotation() {
        // Change tip every 12 seconds
        if (tipInterval) clearInterval(tipInterval);
        showSmartTip();
        tipInterval = setInterval(showSmartTip, 12000);
    }

    function showSmartTip() {
        let tip;

        if (isPlaying) {
            // Pendant le jeu, montrer des conseils contextuels 70% du temps
            if (Math.random() < 0.7) {
                tip = getContextualTip();
            } else {
                tip = generalTips[Math.floor(Math.random() * generalTips.length)];
            }
        } else {
            // Avant le jeu, conseils généraux
            tip = generalTips[Math.floor(Math.random() * generalTips.length)];
        }

        tipText.textContent = tip;
        tipText.style.animation = 'none';
        setTimeout(() => {
            tipText.style.animation = 'fadeIn 0.5s ease';
        }, 10);
    }

    function resetGame() {
        stopTimer();
        seconds = 0;
        moves = 0;
        updateDisplay();
        helpActive = false;

        // Clear board
        board.innerHTML = '';

        // Reset state to solved
        state = [];
        for (let i = 1; i < size * size; i++) {
            state.push(i);
        }
        state.push(0); // Empty tile

        // Update CSS variables for grid size
        document.documentElement.style.setProperty('--grid-size', size);

        renderBoard();
        isPlaying = false;
        winMessage.classList.remove('visible');
        winMessage.classList.add('hidden');

        // Update button states
        if (!gameStarted) {
            resetBtn.textContent = 'Démarrer';
            resetBtn.classList.remove('secondary');
            resetBtn.classList.add('primary');
            shuffleBtn.style.display = 'none';
        } else {
            resetBtn.textContent = 'Réinitialiser';
            resetBtn.classList.remove('primary');
            resetBtn.classList.add('secondary');
            shuffleBtn.style.display = 'inline-block';
        }
    }

    function renderBoard() {
        // Only create tiles if they don't exist
        if (board.children.length === 0) {
            for (let i = 1; i < size * size; i++) {
                const tile = document.createElement('div');
                tile.classList.add('tile');
                tile.textContent = i;
                tile.dataset.value = i;
                tile.style.animation = `popIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards`;
                tile.style.animationDelay = `${i * 0.03}s`;
                tile.addEventListener('click', () => handleTileClickValue(i));
                board.appendChild(tile);
            }
        }

        // Position tiles
        const tileElements = Array.from(board.children);

        state.forEach((value, index) => {
            if (value === 0) return; // Empty slot

            const tile = tileElements.find(el => parseInt(el.dataset.value) === value);
            const row = Math.floor(index / size);
            const col = index % size;

            tile.style.transform = `translate(${col * 100}%, ${row * 100}%)`;

            // Highlight correct position
            if (value === index + 1) {
                tile.classList.add('correct');
            } else {
                tile.classList.remove('correct');
            }

            // Remove hint class
            tile.classList.remove('hint');
        });
    }

    function handleTileClickValue(val) {
        if (!isPlaying) return;

        const currentIndex = state.indexOf(val);
        const emptyIdx = state.indexOf(0);

        if (isAdjacent(currentIndex, emptyIdx)) {
            swap(currentIndex, emptyIdx);
            moves++;
            updateDisplay();
            checkWin();
        } else {
            const tileElements = Array.from(board.children);
            const tile = tileElements.find(el => parseInt(el.dataset.value) === val);
            if (tile) {
                tile.classList.add('error');
                setTimeout(() => tile.classList.remove('error'), 400);
            }
        }
    }

    function isAdjacent(idx1, idx2) {
        const row1 = Math.floor(idx1 / size);
        const col1 = idx1 % size;
        const row2 = Math.floor(idx2 / size);
        const col2 = idx2 % size;

        return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
    }

    function swap(idx1, idx2) {
        [state[idx1], state[idx2]] = [state[idx2], state[idx1]];
        renderBoard();
    }

    function shuffle() {
        gameStarted = true;
        let shuffleMoves = 0;
        const maxShuffleMoves = size * size * 10;
        const interval = setInterval(() => {
            const emptyIdx = state.indexOf(0);
            const neighbors = [];

            const row = Math.floor(emptyIdx / size);
            const col = emptyIdx % size;

            if (row > 0) neighbors.push(emptyIdx - size);
            if (row < size - 1) neighbors.push(emptyIdx + size);
            if (col > 0) neighbors.push(emptyIdx - 1);
            if (col < size - 1) neighbors.push(emptyIdx + 1);

            const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];

            [state[emptyIdx], state[randomNeighbor]] = [state[randomNeighbor], state[emptyIdx]];
            renderBoard();

            shuffleMoves++;
            if (shuffleMoves >= maxShuffleMoves) {
                clearInterval(interval);
                isPlaying = true;
                moves = 0;
                seconds = 0;
                updateDisplay();
                startTimer();

                // Update buttons after shuffle
                resetBtn.textContent = 'Réinitialiser';
                resetBtn.classList.remove('primary');
                resetBtn.classList.add('secondary');
                shuffleBtn.style.display = 'inline-block';
            }
        }, 10);
    }

    function checkWin() {
        // Check if sorted
        for (let i = 0; i < state.length - 1; i++) {
            if (state[i] !== i + 1) return;
        }

        // Win!
        isPlaying = false;
        stopTimer();
        showWinMessage();
        launchFireworks();
    }

    function startTimer() {
        stopTimer();
        timerInterval = setInterval(() => {
            seconds++;
            updateDisplay();
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function updateDisplay() {
        moveCountDisplay.textContent = moves;

        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
    }

    function showWinMessage() {
        finalMovesDisplay.textContent = moves;
        finalTimeDisplay.textContent = timerDisplay.textContent;
        winMessage.classList.remove('hidden');
        setTimeout(() => {
            winMessage.classList.add('visible');
        }, 10);
    }

    // Fireworks animation
    function launchFireworks() {
        const ctx = fireworksCanvas.getContext('2d');
        fireworksCanvas.width = window.innerWidth;
        fireworksCanvas.height = window.innerHeight;

        const particles = [];
        const particleCount = 100;
        const gravity = 0.05;
        const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#ffd700', '#ff6b6b'];

        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * 8;
                this.vy = (Math.random() - 0.5) * 8;
                this.alpha = 1;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.size = Math.random() * 3 + 2;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += gravity;
                this.alpha -= 0.01;
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        function createFirework() {
            const x = Math.random() * fireworksCanvas.width;
            const y = Math.random() * fireworksCanvas.height * 0.5;

            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(x, y));
            }
        }

        let frameCount = 0;
        function animate() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

            particles.forEach((particle, index) => {
                particle.update();
                particle.draw();

                if (particle.alpha <= 0) {
                    particles.splice(index, 1);
                }
            });

            frameCount++;
            if (frameCount % 30 === 0 && frameCount < 300) {
                createFirework();
            }

            if (frameCount < 400) {
                requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
            }
        }

        createFirework();
        animate();
    }

    // Algorithme d'aide intelligent amélioré
    function showHelp() {
        if (!isPlaying || helpActive) return;

        // Limite l'utilisation de l'aide à une fois toutes les 3 secondes
        const now = Date.now();
        if (now - lastHelpTime < 3000) {
            tipText.textContent = "⏳ Attendez quelques secondes avant de redemander de l'aide.";
            return;
        }
        lastHelpTime = now;

        helpActive = true;
        const bestMove = findBestMove();

        if (bestMove !== null) {
            const tileValue = state[bestMove.tileIndex];
            const tileElements = Array.from(board.children);
            const tile = tileElements.find(el => parseInt(el.dataset.value) === tileValue);

            if (tile) {
                tile.classList.add('hint');

                // Afficher un conseil personnalisé
                const moveReason = bestMove.reason;
                tipText.textContent = `💡 ${moveReason}`;

                setTimeout(() => {
                    tile.classList.remove('hint');
                    helpActive = false;
                    showSmartTip(); // Retour au conseil normal
                }, 3000);
            }
        } else {
            tipText.textContent = "🤔 Continuez à explorer, vous êtes sur la bonne voie !";
            helpActive = false;
        }
    }

    // Trouve le meilleur mouvement possible
    function findBestMove() {
        const emptyIdx = state.indexOf(0);
        const neighbors = getNeighbors(emptyIdx);

        if (neighbors.length === 0) return null;

        let bestMove = null;
        let bestScore = -1000;
        let bestReason = "";

        neighbors.forEach(idx => {
            const value = state[idx];
            let score = 0;
            let reason = "";

            // Priorité 1 : Placer une tuile à sa position correcte
            if (value === emptyIdx + 1) {
                score = 1000;
                reason = `Déplacez la tuile ${value} - elle sera à sa place finale !`;
            }
            // Priorité 2 : Déplacer une tuile mal placée qui bloque une position importante
            else if (isBlockingImportantPosition(idx, value)) {
                score = 500;
                reason = `Déplacez la tuile ${value} - elle bloque une position importante.`;
            }
            // Priorité 3 : Rapprocher une tuile de sa destination
            else {
                const currentDistance = getManhattanDistance(idx, value - 1);
                const newDistance = getManhattanDistance(emptyIdx, value - 1);

                if (newDistance < currentDistance) {
                    score = 300 - newDistance * 10;
                    reason = `Déplacez la tuile ${value} - elle se rapproche de sa position.`;
                } else {
                    score = 100;
                    reason = `Déplacez la tuile ${value} pour créer de l'espace.`;
                }
            }

            // Bonus : Favoriser les tuiles de faible numéro (stratégie ligne par ligne)
            if (value <= size) {
                score += 50;
            }

            // Pénalité : Éviter de déplacer les tuiles déjà bien placées
            if (state[idx] === idx + 1) {
                score -= 2000;
                reason = `⚠️ Ne déplacez PAS la tuile ${value} - elle est déjà bien placée !`;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMove = { tileIndex: idx, score: score, reason: reason };
            }
        });

        return bestMove;
    }

    // Obtient les voisins d'une position
    function getNeighbors(idx) {
        const neighbors = [];
        const row = Math.floor(idx / size);
        const col = idx % size;

        if (row > 0) neighbors.push(idx - size);
        if (row < size - 1) neighbors.push(idx + size);
        if (col > 0) neighbors.push(idx - 1);
        if (col < size - 1) neighbors.push(idx + 1);

        return neighbors;
    }

    // Distance de Manhattan entre deux positions
    function getManhattanDistance(currentIdx, targetIdx) {
        const currentRow = Math.floor(currentIdx / size);
        const currentCol = currentIdx % size;
        const targetRow = Math.floor(targetIdx / size);
        const targetCol = targetIdx % size;

        return Math.abs(currentRow - targetRow) + Math.abs(currentCol - targetCol);
    }

    // Vérifie si une tuile bloque une position importante
    function isBlockingImportantPosition(idx, value) {
        // Les positions importantes sont celles de la première ligne et première colonne
        const row = Math.floor(idx / size);
        const col = idx % size;

        // Si on est dans la première ligne ou colonne
        if (row === 0 || col === 0) {
            // Et que la tuile n'est pas à sa place
            if (value !== idx + 1) {
                return true;
            }
        }

        return false;
    }

    // Event listeners
    shuffleBtn.addEventListener('click', () => {
        shuffle();
    });

    resetBtn.addEventListener('click', () => {
        if (!gameStarted) {
            shuffle();
        } else {
            gameStarted = false;
            resetGame();
        }
    });

    playAgainBtn.addEventListener('click', () => {
        resetGame();
        shuffle();
    });

    difficultySelect.addEventListener('change', (e) => {
        size = parseInt(e.target.value);
        gameStarted = false;
        resetGame();
    });

    helpBtn.addEventListener('click', showHelp);

    // Handle window resize for fireworks canvas
    window.addEventListener('resize', () => {
        if (fireworksCanvas.width > 0) {
            fireworksCanvas.width = window.innerWidth;
            fireworksCanvas.height = window.innerHeight;
        }
    });

    // Initial setup
    initGame();
});

// Add CSS animation for tips
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-5px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
