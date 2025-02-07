let currentPlayer = "X";
let turnsCounter = 0;
let board = [];
let isHumanTurn = true;
let gridSize = 3;

const statusElement = document.createElement('div');
statusElement.id = 'status';
document.querySelector('.container').prepend(statusElement);

const sizeSelect = document.createElement('select');
sizeSelect.innerHTML = `
            <option value="3">3x3</option>
            <option value="4">4x4</option>
            <option value="5">5x5</option>
            <option value="6">6x6</option>
        `;
sizeSelect.addEventListener('change', () => {
    gridSize = parseInt(sizeSelect.value);
    resetBoard();
});
document.querySelector('.container').insertBefore(sizeSelect, document.querySelector('#reset'));

// Creates empty game board array.
const createBoardArray = () => {
    return Array.from({ length: gridSize }, () =>
        Array.from({ length: gridSize }, () => "_")
    );
};

/*
Checks if a line (row/column/diagonal) contains all same marks.
line - Array of cells to check.
mark - Player mark (X/O).
*/
const checkLine = (line, mark) => line.every(cell => cell === mark);

//Checks all win conditions for the specified player.

const checkWin = (mark) => {
    // Check rows and columns
    for (let i = 0; i < gridSize; i++) {
        if (checkLine(board[i], mark)) return true;
        if (checkLine(board.map(row => row[i]), mark)) return true;
    }

    // Check diagonals
    const diag1 = board.map((row, i) => row[i]);
    const diag2 = board.map((row, i) => row[gridSize - 1 - i]);
    return checkLine(diag1, mark) || checkLine(diag2, mark);
};

//Gets all empty cells coordinates.

const getEmptyCells = () => {
    const cells = [];
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (board[i][j] === "_") cells.push([i, j]);
        }
    }
    return cells;
};

const countWinningMoves = (mark) => {
    let winCount = 0;
    const emptyCells = getEmptyCells();

    for (const [i, j] of emptyCells) {
        board[i][j] = mark;
        if (checkWin(mark)) winCount++;
        board[i][j] = "_";  // Reset the cell after testing
    }
    return winCount;
};


const findForkMove = (mark) => {
    const emptyCells = getEmptyCells();

    for (const [i, j] of emptyCells) {
        board[i][j] = mark;
        const winCount = countWinningMoves(mark);
        board[i][j] = "_";

        // If this move creates two chances to win → Fork
        if (winCount >= 2) {
            return [i, j];
        }
    }
    return null;
};


//Generates computer move.

const computerMove = () => {
    const emptyCells = getEmptyCells();

    // Try to win
    for (const [i, j] of emptyCells) {
        board[i][j] = "O";
        if (checkWin("O")) return [i, j];
        board[i][j] = "_";
    }

    // Block player win
    for (const [i, j] of emptyCells) {
        board[i][j] = "X";
        if (checkWin("X")) {
            board[i][j] = "O";
            return [i, j];
        }
        board[i][j] = "_";
    }


    const forkMove = findForkMove("O");
    if (forkMove) return forkMove;


    const blockFork = findForkMove("X");
    if (blockFork) return blockFork;

    // Random move fallback
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
};

//Handles computer move sequence.
const makeComputerMove = () => {
    if (!isHumanTurn) {
        updateStatus("Computer is thinking...", 'computer');
        setTimeout(() => {
            const [row, col] = computerMove();
            const index = row * gridSize + col;
            const cell = document.querySelectorAll(".cell")[index];

            // Update game state
            setTimeout(() => {
                board[row][col] = "O";

            }, 500)
            turnsCounter++;
            // Update UI
            cell.querySelector(".value").textContent = "O";
            cell.classList.add("cell--O");

            // Check game outcome
            if (checkWin("O")) {
                showMessage("Computer Wins!");
                resetBoard();
            } else if (turnsCounter === gridSize ** 2) {
                showMessage("Draw!");
                resetBoard();
            } else {
                isHumanTurn = true;
                currentPlayer = "X";
                updateStatus("Your turn (X)");
                setTimeout(() => { enableInputs(); }, 600)
            }
        }, 500);
    }
};

const disableInputs = () => {
    // Disable board cells by disabling pointer events on the board container
    const boardEl = document.querySelector(".board");
    if (boardEl) {
        boardEl.style.pointerEvents = "none";
    }
    // Disable reset button
    const resetButton = document.querySelector("#reset");
    if (resetButton) resetButton.disabled = true;
    // Disable sizeSelect
    if (sizeSelect) sizeSelect.disabled = true;
};

/**
 * Enables user interactions for board cells, reset button, and sizeSelect.
 */
const enableInputs = () => {
    const boardEl = document.querySelector(".board");
    if (boardEl) {
        boardEl.style.pointerEvents = "auto";
    }
    const resetButton = document.querySelector("#reset");
    if (resetButton) resetButton.disabled = false;
    if (sizeSelect) sizeSelect.disabled = false;
};

/*
Shows game outcome message.
text - Message to display.
*/
const showMessage = (text) => {
    const gameMessage = document.querySelector('.game-message');
    const messageText = document.querySelector('.message-text');
    messageText.textContent = text;
    gameMessage.classList.remove('hidden');
    disableInputs();
};

/**
 Updates game status display.
message - Status text.
type - Display type (player/computer).
*/
const updateStatus = (message, type = 'player') => {
    statusElement.textContent = message;
    statusElement.className = '';
    if (type === 'computer') statusElement.classList.add('thinking');
};

//Handles cell click events.

const cellClickHandler = (event, index) => {
    if (!isHumanTurn) return;

    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    // Check that the cell is empty before continuing
    if (board[row][col] !== "_") return;

    const valueElement = event.target.querySelector(".value");

    // Check if the element exists to avoid error
    if (!valueElement) return;

    turnsCounter++;
    board[row][col] = currentPlayer;

    valueElement.textContent = currentPlayer;
    event.target.classList.add(`cell--${currentPlayer}`);

    if (checkWin(currentPlayer)) {
        showMessage("Player Won!");
        resetBoard();
    } else if (turnsCounter === gridSize ** 2) {
        showMessage("Draw!");
        resetBoard();
    } else {
        // Switch turns
        isHumanTurn = false;
        currentPlayer = "O";
        updateStatus("Computer's turn (O)");
        disableInputs();
        makeComputerMove();
    }
};

//Resets game state variables.
const resetGameState = () => {
    board = createBoardArray();
    turnsCounter = 0;
    currentPlayer = "X";
    isHumanTurn = true;
};

/*
Creates a single board cell element with event listeners.
index - The cell index (0 to gridSize² - 1).
returns (HTMLElement) The cell element.
*/
const createCell = (index) => {
    const cellTemplate = `<div class="cell" role="button" tabindex="${index + 1}">
        <span class="value"></span></div>
        `;
    // Convert the string template into a DOM element
    const cellFragment = document.createRange().createContextualFragment(cellTemplate);
    const cell = cellFragment.querySelector(".cell");

    // Attach event listeners to the cell
    cell.onclick = (event) => cellClickHandler(event, index);
    cell.onkeydown = (event) => {
        if (event.key === "Enter") {
            cellClickHandler(event, index);
        }
    };

    return cell;
};

//Initializes the entire game for first run
const initializeGame = () => {
    // Create UI elements
    createBoardUI();

    // Set initial game state
    resetGameState();

    // Set initial status
    updateStatus("Your turn (X)");
};

//Creates the board UI by generating cells and appending them to the board container.
const createBoardUI = () => {

    // Remove existing board if any
    document.querySelector(".board")?.remove();

    // Create new board container
    const boardDiv = document.createElement("div");
    boardDiv.className = "board";
    document.documentElement.style.setProperty("--grid-rows", gridSize);

    // Create and append cells
    for (let i = 0; i < gridSize ** 2; i++) {
        const cell = createCell(i);
        boardDiv.appendChild(cell);
    }

    // Insert the board into the DOM
    document.querySelector(".container").insertBefore(boardDiv, sizeSelect);
};

//Resets the entire game board: clears the previous board, resets state, and creates a new board UI.

const resetBoard = () => {
    // Reset game state
    resetGameState();

    createBoardUI();

    // Clear existing marks
    document.querySelectorAll('.cell').forEach(cell => {
        cell.querySelector('.value').textContent = '';
        cell.classList.remove('cell--X', 'cell--O');
    });


    // Update status
    updateStatus("Your turn (X)");
};

document.querySelector("#reset").onclick = resetBoard;
document.querySelector('.play-again').addEventListener('click', () => {
    document.querySelector('.game-message').classList.add('hidden');
    enableInputs();
    initializeGame();
});

initializeGame();