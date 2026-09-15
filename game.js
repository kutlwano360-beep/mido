const HOLES = 16;
const STARTING_STONES = 3;
const WINNING_STONES = 48;

const DEFAULT_SETTINGS = {
sound: true,
animations: true,
darkMode: true,
largeNumbers: true
};

let gameSettings = loadSettings();

const gameMode =
localStorage.getItem("midoGameMode") ||
"human-human";

const difficulty =
localStorage.getItem("midoDifficulty") ||
"medium";

/* =========================
GAME STATE
========================= */

let player1 = Array(HOLES).fill(STARTING_STONES);
let player2 = Array(HOLES).fill(STARTING_STONES);

let currentPlayer = 1;
let gameOver = false;
let androidThinking = false;
let gamePaused = false;

let gameStartTime = Date.now();
let timerInterval = null;
let finalGameTime = 0;

/* =========================
DOM
========================= */

const board1 =
document.getElementById("player1Board");

const board2 =
document.getElementById("player2Board");

const player1Section =
document.getElementById("player1Section");

const player2Section =
document.getElementById("player2Section");

const player1Total =
document.getElementById("player1Total");

const player2Total =
document.getElementById("player2Total");

const player2Name =
document.getElementById("player2Name");

const turnDisplay =
document.getElementById("turnDisplay");

const gameMessage =
document.getElementById("gameMessage");

const gameTimer =
document.getElementById("gameTimer");

const pauseButton =
document.getElementById("pauseButton");

const pauseOverlay =
document.getElementById("pauseOverlay");

const continueButton =
document.getElementById("continueButton");

const pauseRestartButton =
document.getElementById("pauseRestartButton");

const winnerOverlay =
document.getElementById("winnerOverlay");

const winnerTitle =
document.getElementById("winnerTitle");

const winnerName =
document.getElementById("winnerName");

const winnerMessage =
document.getElementById("winnerMessage");

const winnerTime =
document.getElementById("winnerTime");

const winnerHighScore =
document.getElementById("winnerHighScore");

const winnerPlayAgainButton =
document.getElementById("winnerPlayAgainButton");

const winnerHighScoresButton =
document.getElementById("winnerHighScoresButton");

const highScoresOverlay =
document.getElementById("highScoresOverlay");

const highScoresContent =
document.getElementById("highScoresContent");

const closeHighScoresButton =
document.getElementById("closeHighScoresButton");

const menuHighScoresButton =
document.getElementById("menuHighScoresButton");

/* =========================
SETTINGS
========================= */

function loadSettings() {

try {

    const saved =
        localStorage.getItem("midoSettings");

    if (saved) {

        return {
            ...DEFAULT_SETTINGS,
            ...JSON.parse(saved)
        };

    }

} catch (error) {

    console.log(
        "Settings could not be loaded."
    );

}

return {
    ...DEFAULT_SETTINGS
};

}

function applyGameSettings() {

document.body.classList.toggle(
    "no-animations",
    !gameSettings.animations
);

document.body.classList.toggle(
    "light-mode",
    !gameSettings.darkMode
);

document.body.classList.toggle(
    "small-stone-numbers",
    !gameSettings.largeNumbers
);

}

/* =========================
SOUND
========================= */

function playMoveSound() {

if (!gameSettings.sound) {
    return;
}

try {

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContext) {
        return;
    }

    const context =
        new AudioContext();

    const oscillator =
        context.createOscillator();

    const gain =
        context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 280;

    gain.gain.setValueAtTime(
        0.0001,
        context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.07,
        context.currentTime + 0.01
    );

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + 0.12
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();

    oscillator.stop(
        context.currentTime + 0.12
    );

} catch (error) {

    console.log(
        "Move sound unavailable."
    );

}

}

function playWinSound() {

if (!gameSettings.sound) {
    return;
}

try {

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContext) {
        return;
    }

    const context =
        new AudioContext();

    const notes = [
        392,
        523,
        659,
        784
    ];

    notes.forEach(
        function (frequency, index) {

            const oscillator =
                context.createOscillator();

            const gain =
                context.createGain();

            oscillator.type = "sine";

            oscillator.frequency.value =
                frequency;

            const startTime =
                context.currentTime +
                index * 0.14;

            gain.gain.setValueAtTime(
                0.0001,
                startTime
            );

            gain.gain.exponentialRampToValueAtTime(
                0.12,
                startTime + 0.02
            );

            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                startTime + 0.22
            );

            oscillator.connect(gain);
            gain.connect(context.destination);

            oscillator.start(startTime);

            oscillator.stop(
                startTime + 0.23
            );

        }
    );

} catch (error) {

    console.log(
        "Win sound unavailable."
    );

}

}

/* =========================
HOLE COLORS
========================= */

function getHoleColor(stones) {

if (stones === 0) {
    return "#ffffff";
}

const hue =
    (stones * 45) % 360;

return (
    "hsl(" +
    hue +
    ", 80%, 60%)"
);

}

/* =========================
CREATE BOARD
========================= */

function createBoard(
boardElement,
playerNumber
) {

if (!boardElement) {

    console.error(
        "Mido board element not found."
    );

    return;
}

boardElement.innerHTML = "";

const visualOrder = [
    0, 1, 2, 3,
    4, 5, 6, 7,
    15, 14, 13, 12,
    11, 10, 9, 8
];

visualOrder.forEach(
    function (index) {

        const hole =
            document.createElement("button");

        hole.type = "button";
        hole.className = "hole";

        hole.dataset.index =
            index;

        hole.dataset.player =
            playerNumber;

        const stoneCount =
            document.createElement("span");

        stoneCount.className =
            "stone-count";

        stoneCount.textContent =
            STARTING_STONES;

        hole.appendChild(
            stoneCount
        );

        hole.addEventListener(
            "click",
            function () {

                handleHoleClick(
                    playerNumber,
                    index
                );

            }
        );

        boardElement.appendChild(
            hole
        );

    }
);

}

/* =========================
RENDER BOARD
========================= */

function renderBoard(
boardElement,
stones,
playerNumber
) {

if (!boardElement) {
    return;
}

const holes =
    boardElement.querySelectorAll(
        ".hole"
    );

holes.forEach(
    function (hole) {

        const index =
            Number(
                hole.dataset.index
            );

        const count =
            stones[index];

        const countElement =
            hole.querySelector(
                ".stone-count"
            );

        if (countElement) {

            countElement.textContent =
                count;

        }

        hole.style.background =
            getHoleColor(count);

        hole.classList.toggle(
            "empty",
            count === 0
        );

        const isCurrentBoard =
            playerNumber === currentPlayer;

        const isAndroidBoard =
            gameMode === "human-android" &&
            playerNumber === 2;

        hole.disabled =
            gameOver ||
            gamePaused ||
            androidThinking ||
            !isCurrentBoard ||
            (
                isAndroidBoard &&
                currentPlayer === 2
            );

    }
);

}

/* =========================
TOTALS
========================= */

function getTotalStones(stones) {

return stones.reduce(
    function (total, value) {

        return total + value;

    },
    0
);

}

/* =========================
ACTIVE BOARD
========================= */

function updateActiveBoard() {

if (
    !player1Section ||
    !player2Section
) {
    return;
}

if (currentPlayer === 1) {

    player1Section.classList.add(
        "active"
    );

    player1Section.classList.remove(
        "inactive"
    );

    player2Section.classList.add(
        "inactive"
    );

    player2Section.classList.remove(
        "active"
    );

} else {

    player2Section.classList.add(
        "active"
    );

    player2Section.classList.remove(
        "inactive"
    );

    player1Section.classList.add(
        "inactive"
    );

    player1Section.classList.remove(
        "active"
    );

}

}

/* =========================
TURN DISPLAY
========================= */

function updateTurnDisplay() {

if (!turnDisplay) {
    return;
}

if (gameOver) {
    return;
}

if (gamePaused) {

    turnDisplay.textContent =
        "GAME PAUSED";

    return;
}

if (currentPlayer === 1) {

    turnDisplay.textContent =
        "PLAYER 1 TURN";

    return;
}

if (
    gameMode === "human-android"
) {

    if (androidThinking) {

        turnDisplay.textContent =
            "ANDROID THINKING...";

    } else {

        turnDisplay.textContent =
            "ANDROID TURN";

    }

    return;
}

turnDisplay.textContent =
    "PLAYER 2 TURN";

}

/* =========================
MESSAGE
========================= */

function updateMessage() {

if (
    !gameMessage ||
    gameOver
) {
    return;
}

if (gamePaused) {

    gameMessage.textContent =
        "The game is paused.";

    return;
}

if (currentPlayer === 1) {

    gameMessage.textContent =
        "Choose a hole on your side.";

    return;
}

if (
    gameMode === "human-android"
) {

    if (androidThinking) {

        gameMessage.textContent =
            "ANDROID is thinking...";

    } else {

        gameMessage.textContent =
            "ANDROID'S TURN";

    }

    return;
}

gameMessage.textContent =
    "PLAYER 2, choose a hole.";

}

/* =========================
RENDER
========================= */

function render() {

gameSettings =
    loadSettings();

applyGameSettings();

renderBoard(
    board1,
    player1,
    1
);

renderBoard(
    board2,
    player2,
    2
);

if (player1Total) {

    player1Total.textContent =
        getTotalStones(player1);

}

if (player2Total) {

    player2Total.textContent =
        getTotalStones(player2);

}

if (player2Name) {

    player2Name.textContent =
        gameMode === "human-android"
            ? "ANDROID"
            : "PLAYER 2";

}

updateActiveBoard();
updateTurnDisplay();
updateMessage();

}

/* =========================
HOLE CLICK
========================= */

function handleHoleClick(
playerNumber,
holeIndex
) {

if (
    gameOver ||
    gamePaused ||
    androidThinking
) {
    return;
}

if (
    playerNumber !==
    currentPlayer
) {
    return;
}

if (
    gameMode === "human-android" &&
    currentPlayer === 2
) {
    return;
}

const board =
    playerNumber === 1
        ? player1
        : player2;

if (
    board[holeIndex] <= 0
) {

    if (gameMessage) {

        gameMessage.textContent =
            "That hole is empty.";

    }

    return;
}

makeMove(
    playerNumber,
    holeIndex
);

}

/* =========================
MAKE MOVE
========================= */

function makeMove(
playerNumber,
holeIndex
) {

if (
    gameOver ||
    gamePaused
) {
    return;
}

const board =
    playerNumber === 1
        ? player1
        : player2;

let stones =
    board[holeIndex];

if (stones <= 0) {
    return;
}

board[holeIndex] = 0;

let currentIndex =
    holeIndex;

while (stones > 0) {

    currentIndex =
        (currentIndex + 1) %
        HOLES;

    board[currentIndex] += 1;

    stones -= 1;
}

playMoveSound();

if (
    checkWin(
        playerNumber,
        board
    )
) {
    return;
}

currentPlayer =
    currentPlayer === 1
        ? 2
        : 1;

render();

if (
    gameMode === "human-android" &&
    currentPlayer === 2
) {

    startAndroidTurn();

}

}

/* =========================
WIN CHECK
========================= */

function checkWin(
playerNumber,
board
) {

const won =
    board.some(
        function (stones) {

            return (
                stones >=
                WINNING_STONES
            );

        }
    );

if (!won) {
    return false;
}

gameOver = true;
androidThinking = false;

stopTimer();

finalGameTime =
    Math.floor(
        (
            Date.now() -
            gameStartTime
        ) / 1000
    );

const winner =
    playerNumber === 1
        ? "PLAYER 1"
        : gameMode === "human-android"
            ? "ANDROID"
            : "PLAYER 2";

if (winnerTitle) {

    winnerTitle.textContent =
        playerNumber === 1
            ? "VICTORY"
            : "DEFEAT";

}

if (winnerName) {

    winnerName.textContent =
        winner + " WON!";

}

if (winnerMessage) {

    winnerMessage.textContent =
        "All 48 stones are in one hole.";

}

if (winnerTime) {

    winnerTime.textContent =
        "TIME " +
        formatTime(finalGameTime);

}

const isHighScore =
    saveHighScore(
        winner,
        finalGameTime
    );

if (winnerHighScore) {

    winnerHighScore.textContent =
        isHighScore
            ? "NEW HIGH SCORE!"
            : "";

}

if (winnerOverlay) {

    winnerOverlay.classList.add(
        "show"
    );

}

playWinSound();

render();

return true;

}

/* =========================
ANDROID
========================= */

function startAndroidTurn() {

if (
    gameOver ||
    gamePaused ||
    gameMode !== "human-android" ||
    currentPlayer !== 2
) {
    return;
}

if (androidThinking) {
    return;
}

androidThinking = true;

render();

setTimeout(
    function () {

        if (
            gameOver ||
            gamePaused
        ) {

            androidThinking =
                false;

            render();

            return;
        }

        const move =
            chooseAndroidMove();

        if (move === null) {

            androidThinking =
                false;

            render();

            return;
        }

        setTimeout(
            function () {

                if (
                    gameOver ||
                    gamePaused
                ) {

                    androidThinking =
                        false;

                    render();

                    return;
                }

                androidThinking =
                    false;

                makeMove(
                    2,
                    move
                );

            },
            450
        );

    },
    650
);

}

/* =========================
ANDROID MOVE CHOICE
========================= */

function chooseAndroidMove() {

const legalMoves = [];

for (
    let i = 0;
    i < HOLES;
    i++
) {

    if (player2[i] > 0) {

        legalMoves.push(i);

    }

}

if (
    legalMoves.length === 0
) {
    return null;
}

for (
    let i = 0;
    i < legalMoves.length;
    i++
) {

    const move =
        legalMoves[i];

    const simulated =
        simulateMove(
            player2,
            move
        );

    if (
        simulated.some(
            function (stones) {

                return (
                    stones >=
                    WINNING_STONES
                );

            }
        )
    ) {

        return move;

    }
}

if (difficulty === "easy") {

    return chooseEasyMove(
        legalMoves
    );
}

if (difficulty === "hard") {

    return chooseHardMove(
        legalMoves
    );
}

return chooseMediumMove(
    legalMoves
);

}

/* =========================
EASY
========================= */

function chooseEasyMove(
legalMoves
) {

if (
    Math.random() < 0.45
) {

    return legalMoves[
        Math.floor(
            Math.random() *
            legalMoves.length
        )
    ];
}

return chooseBestPileMove(
    legalMoves,
    2
);

}

/* =========================
MEDIUM
========================= */

function chooseMediumMove(
legalMoves
) {

return chooseBestPileMove(
    legalMoves,
    4
);

}

/* =========================
HARD
========================= */

function chooseHardMove(
legalMoves
) {

let bestMove =
    legalMoves[0];

let bestScore =
    -Infinity;

legalMoves.forEach(
    function (move) {

        const simulated =
            simulateMove(
                player2,
                move
            );

        const score =
            evaluateBoard(
                simulated
            );

        const largest =
            Math.max(
                ...simulated
            );

        const finalScore =
            score +
            largest * 2;

        if (
            finalScore >
            bestScore
        ) {

            bestScore =
                finalScore;

            bestMove =
                move;

        }

    }
);

return bestMove;

}

/* =========================
BEST PILE MOVE
========================= */

function chooseBestPileMove(
legalMoves,
multiplier
) {

let bestMove =
    legalMoves[0];

let bestScore =
    -Infinity;

legalMoves.forEach(
    function (move) {

        const simulated =
            simulateMove(
                player2,
                move
            );

        const largestPile =
            Math.max(
                ...simulated
            );

        let concentration =
            0;

        simulated.forEach(
            function (stones) {

                if (stones >= 6) {

                    concentration +=
                        stones;

                }

            }
        );

        const score =
            largestPile * multiplier +
            concentration +
            Math.random() * 5;

        if (
            score >
            bestScore
        ) {

            bestScore =
                score;

            bestMove =
                move;

        }

    }
);

return bestMove;

}

/* =========================
EVALUATE BOARD
========================= */

function evaluateBoard(
board
) {

const largest =
    Math.max(
        ...board
    );

const total =
    getTotalStones(board);

let concentration =
    0;

board.forEach(
    function (stones) {

        if (stones >= 6) {

            concentration +=
                stones;

        }

    }
);

return (
    largest * 5 +
    concentration * 2 +
    total * 0.05
);

}

/* =========================
SIMULATE MOVE
========================= */

function simulateMove(
board,
holeIndex
) {

const simulated =
    [...board];

let stones =
    simulated[holeIndex];

simulated[holeIndex] = 0;

let currentIndex =
    holeIndex;

while (stones > 0) {

    currentIndex =
        (currentIndex + 1) %
        HOLES;

    simulated[currentIndex] += 1;

    stones -= 1;
}

return simulated;

}

/* =========================
PAUSE
========================= */

function pauseGame() {

if (gameOver) {
    return;
}

if (gamePaused) {
    return;
}

gamePaused = true;

stopTimer();

if (pauseOverlay) {

    pauseOverlay.classList.add(
        "show"
    );

}

render();

}

/* =========================
CONTINUE
========================= */

function continueGame() {

if (!gamePaused) {
    return;
}

gamePaused = false;

if (pauseOverlay) {

    pauseOverlay.classList.remove(
        "show"
    );

}

startTimer();

render();

if (
    gameMode === "human-android" &&
    currentPlayer === 2
) {

    startAndroidTurn();

}

}

/* =========================
RESTART
========================= */

function restartGame() {

player1 =
    Array(HOLES).fill(
        STARTING_STONES
    );

player2 =
    Array(HOLES).fill(
        STARTING_STONES
    );

currentPlayer = 1;
gameOver = false;
androidThinking = false;
gamePaused = false;

finalGameTime = 0;

gameStartTime =
    Date.now();

if (winnerOverlay) {

    winnerOverlay.classList.remove(
        "show"
    );

}

if (pauseOverlay) {

    pauseOverlay.classList.remove(
        "show"
    );

}

startTimer();

render();

}

/* =========================
TIMER
========================= */

function startTimer() {

stopTimer();

if (
    gameOver ||
    gamePaused
) {
    return;
}

timerInterval =
    setInterval(
        updateTimer,
        1000
    );

updateTimer();

}

function stopTimer() {

if (timerInterval) {

    clearInterval(
        timerInterval
    );

    timerInterval = null;
}

}

function updateTimer() {

if (!gameTimer) {
    return;
}

if (
    gamePaused ||
    gameOver
) {
    return;
}

const elapsed =
    Math.floor(
        (
            Date.now() -
            gameStartTime
        ) / 1000
    );

gameTimer.textContent =
    "TIME " +
    formatTime(elapsed);

}

function formatTime(seconds) {

const minutes =
    Math.floor(
        seconds / 60
    );

const remainingSeconds =
    seconds % 60;

return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(remainingSeconds).padStart(2, "0")
);

}

/* =========================
HIGH SCORES
========================= */

function getHighScores() {

try {

    const saved =
        localStorage.getItem(
            "midoHighScores"
        );

    if (saved) {

        const parsed =
            JSON.parse(saved);

        if (Array.isArray(parsed)) {
            return parsed;
        }

    }

} catch (error) {

    console.log(
        "High scores unavailable."
    );

}

return [];

}

function getModeName() {

if (
    gameMode === "human-android"
) {

    return (
        "PLAYER VS ANDROID - " +
        difficulty.toUpperCase()
    );
}

return "PLAYER VS PLAYER";

}

function saveHighScore(
winner,
time
) {

const scores =
    getHighScores();

const entry = {
    winner: winner,
    time: time,
    mode: getModeName(),
    date: new Date().toLocaleDateString()
};

scores.push(entry);

scores.sort(
    function (a, b) {

        return a.time - b.time;

    }
);

const isHighScore =
    scores.indexOf(entry) !== -1 &&
    scores.indexOf(entry) < 10;

const trimmed =
    scores.slice(0, 10);

try {

    localStorage.setItem(
        "midoHighScores",
        JSON.stringify(trimmed)
    );

} catch (error) {

    console.log(
        "High scores could not be saved."
    );

}

return isHighScore;

}

/* =========================
SHOW HIGH SCORES
========================= */

function showHighScores() {

if (
    !highScoresOverlay ||
    !highScoresContent
) {
    return;
}

const scores =
    getHighScores();

if (scores.length === 0) {

    highScoresContent.innerHTML =
        "<p>No high scores yet.</p>";

} else {

    let html = "";

    scores.forEach(
        function (score, index) {

            html +=
                "<div class=\"score-row\">" +
                "<strong>#" +
                (index + 1) +
                "</strong> " +
                score.winner +
                " - " +
                formatTime(score.time) +
                "<br><small>" +
                score.mode +
                " | " +
                score.date +
                "</small></div>";

        }
    );

    highScoresContent.innerHTML =
        html;
}

highScoresOverlay.classList.add(
    "show"
);

}

/* =========================
CLOSE HIGH SCORES
========================= */

function closeHighScores() {

if (highScoresOverlay) {

    highScoresOverlay.classList.remove(
        "show"
    );

}

}

/* =========================
BUTTONS
========================= */

if (pauseButton) {

pauseButton.addEventListener(
    "click",
    pauseGame
);

}

if (continueButton) {

continueButton.addEventListener(
    "click",
    continueGame
);

}

if (pauseRestartButton) {

pauseRestartButton.addEventListener(
    "click",
    restartGame
);

}

if (winnerPlayAgainButton) {

winnerPlayAgainButton.addEventListener(
    "click",
    restartGame
);

}

if (winnerHighScoresButton) {

winnerHighScoresButton.addEventListener(
    "click",
    function () {

        if (winnerOverlay) {

            winnerOverlay.classList.remove(
                "show"
            );

        }

        showHighScores();

    }
);

}

if (menuHighScoresButton) {

menuHighScoresButton.addEventListener(
    "click",
    function () {

        if (
            typeof closeSideMenu ===
            "function"
        ) {

            closeSideMenu();

        }

        showHighScores();

    }
);

}

if (closeHighScoresButton) {

closeHighScoresButton.addEventListener(
    "click",
    closeHighScores
);

}

/* =========================
START GAME
========================= */

createBoard(
board1,
1
);

createBoard(
board2,
2
);

applyGameSettings();

render();

startTimer();
