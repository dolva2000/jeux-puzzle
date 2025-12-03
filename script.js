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

    let tiles = [];
    let size = 4;
    let emptyIndex = 15; // Bottom right corner initially
    let moves = 0;
    let timerInterval;
    let seconds = 0;
    let isPlaying = false;

    // Initialize the game
    function initGame() {
        resetGame();
    }

    // Removed createBoard and handleTileClick as they were redundant and causing issues.
    // renderBoard now handles tile creation with correct event listeners.

    // Let's restart the logic with a simpler state approach
    let state = []; // Array of size*size, holding values 1-15, 0 for empty

    function resetGame() {
        stopTimer();
        seconds = 0;
        moves = 0;
        updateDisplay();

        // Reset state to solved
        state = [];
        for (let i = 1; i < size * size; i++) {
            state.push(i);
        }
        state.push(0); // Empty tile
        emptyIndex = 15;

        renderBoard();
        isPlaying = false; // Wait for shuffle to start playing
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
                tile.style.animationDelay = `${i * 0.05}s`;
                tile.addEventListener('click', () => handleTileClickValue(i));
                board.appendChild(tile);
            }
        }

        // Now position them
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
        // Random shuffle
        // To ensure solvability, we can just perform valid moves randomly
        // Or shuffle and check inversions.
        // Performing random valid moves is easier to guarantee solvability.

        let shuffleMoves = 0;
        const maxShuffleMoves = 100;
        const interval = setInterval(() => {
            const emptyIdx = state.indexOf(0);
            const neighbors = [];

            const row = Math.floor(emptyIdx / size);
            const col = emptyIdx % size;

            if (row > 0) neighbors.push(emptyIdx - size); // Up
            if (row < size - 1) neighbors.push(emptyIdx + size); // Down
            if (col > 0) neighbors.push(emptyIdx - 1); // Left
            if (col < size - 1) neighbors.push(emptyIdx + 1); // Right

            const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];

            // Swap in state without rendering every frame for performance if needed, 
            // but for visual effect let's render
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
        }, 10); // Fast shuffle animation
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
        // Small delay to allow display:flex to apply before opacity transition
        setTimeout(() => {
            winMessage.classList.add('visible');
        }, 10);
    }

    shuffleBtn.addEventListener('click', () => {
        if (isPlaying) {
            // Confirm restart? Nah, just shuffle
        }
        shuffle();
    });

    resetBtn.addEventListener('click', resetGame);

    playAgainBtn.addEventListener('click', () => {
        resetGame();
        shuffle();
    });

    // Initial setup
    resetGame();
});
