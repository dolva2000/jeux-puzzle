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

    // Liste de conseils
    const tips = [
        "Conseil : Commencez par résoudre la première ligne !",
        "Astuce : Travaillez ligne par ligne de haut en bas.",
        "Conseil : Placez d'abord les coins, puis les bords.",
        "Astuce : Ne déplacez pas les tuiles déjà bien placées.",
        "Conseil : Visualisez plusieurs coups à l'avance.",
        "Astuce : Parfois il faut défaire pour mieux avancer !",
        "Conseil : Concentrez-vous sur une section à la fois.",
        "Astuce : Les dernières tuiles se placent automatiquement.",
        "Conseil : Prenez votre temps, la précision compte !",
        "Astuce : Utilisez le bouton Aide si vous êtes bloqué !"
    ];

    // Initialize the game
    function initGame() {
        resetGame();
        startTipRotation();
    }

    function startTipRotation() {
        // Change tip every 10 seconds
        if (tipInterval) clearInterval(tipInterval);
        showRandomTip();
        tipInterval = setInterval(showRandomTip, 10000);
    }

    function showRandomTip() {
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        tipText.textContent = randomTip;
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
        const gapSize = 10; // Match CSS --gap

        state.forEach((value, index) => {
            if (value === 0) return; // Empty slot

            const tile = tileElements.find(el => parseInt(el.dataset.value) === value);
            const row = Math.floor(index / size);
            const col = index % size;

            // Calculate position including gaps
            const translateX = col * 100 + col * (gapSize / (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tile-size')) / 100));
            const translateY = row * 100 + row * (gapSize / (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tile-size')) / 100));

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
        let shuffleMoves = 0;
        const maxShuffleMoves = size * size * 10; // More moves for harder difficulties
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

    // Help feature
    function showHelp() {
        if (!isPlaying || helpActive) return;

        helpActive = true;
        const emptyIdx = state.indexOf(0);
        const neighbors = [];

        const row = Math.floor(emptyIdx / size);
        const col = emptyIdx % size;

        if (row > 0) neighbors.push(emptyIdx - size);
        if (row < size - 1) neighbors.push(emptyIdx + size);
        if (col > 0) neighbors.push(emptyIdx - 1);
        if (col < size - 1) neighbors.push(emptyIdx + 1);

        // Find the best move (tile that should be in the empty position)
        let bestMove = null;
        let bestScore = -1;

        neighbors.forEach(idx => {
            const value = state[idx];
            // Check if moving this tile would place it correctly
            if (value === emptyIdx + 1) {
                bestMove = idx;
                bestScore = 100;
            } else if (bestScore < 50) {
                // Otherwise, suggest a random valid move
                bestMove = idx;
                bestScore = 50;
            }
        });

        if (bestMove !== null) {
            const tileValue = state[bestMove];
            const tileElements = Array.from(board.children);
            const tile = tileElements.find(el => parseInt(el.dataset.value) === tileValue);
            
            if (tile) {
                tile.classList.add('hint');
                setTimeout(() => {
                    tile.classList.remove('hint');
                    helpActive = false;
                }, 2000);
            }
        }
    }

    // Event listeners
    shuffleBtn.addEventListener('click', () => {
        shuffle();
    });

    resetBtn.addEventListener('click', resetGame);

    playAgainBtn.addEventListener('click', () => {
        resetGame();
        shuffle();
    });

    difficultySelect.addEventListener('change', (e) => {
        size = parseInt(e.target.value);
        resetGame();
    });

    helpBtn.addEventListener('click', showHelp);

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
