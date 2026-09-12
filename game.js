const HOLES = 16;
const STARTING_STONES = 3;
const WINNING_STONES = 48;


/* =========================
   SETTINGS
========================= */

const DEFAULT_SETTINGS = {
    sound: true,
    animations: true,
    darkMode: true,
    largeNumbers: true
};


let gameSettings =
    JSON.parse(
        localStorage.getItem(
            "midoSettings"
        )
    );


if (!gameSettings) {

    gameSettings = {
        ...DEFAULT_SETTINGS
    };

}


/* =========================
   GAME MODE
========================= */

const gameMode =
    localStorage.getItem(
        "midoGameMode"
    ) || "human-human";


/* =========================
   GAME STATE
========================= */

let player1 =
    Array(HOLES).fill(
        STARTING_STONES
    );

let player2 =
    Array(HOLES).fill(
        STARTING_STONES
    );

let currentPlayer = 1;

let gameOver = false;

let computerThinking = false;


/* =========================
   DOM
========================= */

const board1 =
    document.getElementById(
        "board1"
    );

const board2 =
    document.getElementById(
        "board2"
    );

const player1Section =
    document.getElementById(
        "player1Section"
    );

const player2Section =
    document.getElementById(
        "player2Section"
    );

const player1Total =
    document.getElementById(
        "player1Total"
    );

const player2Total =
    document.getElementById(
        "player2Total"
    );

const turnDisplay =
    document.getElementById(
        "turnDisplay"
    );

const gameMessage =
    document.getElementById(
        "gameMessage"
    );

const computerLabel =
    document.getElementById(
        "computerLabel"
    );

const winnerOverlay =
    document.getElementById(
        "winnerOverlay"
    );

const winnerName =
    document.getElementById(
        "winnerName"
    );

const winnerMessage =
    document.getElementById(
        "winnerMessage"
    );


/* =========================
   GAME MODE LABEL
========================= */

if (
    gameMode ===
    "human-computer"
) {

    if (computerLabel) {

        computerLabel.textContent =
            "COMPUTER";

    }

}


/* =========================
   SETTINGS
========================= */

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


function loadSettingsAgain() {

    const storedSettings =
        localStorage.getItem(
            "midoSettings"
        );


    if (storedSettings) {

        try {

            gameSettings =
                JSON.parse(
                    storedSettings
                );

        } catch (error) {

            gameSettings = {
                ...DEFAULT_SETTINGS
            };

        }

    }

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


        const audioContext =
            new AudioContext();


        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();


        oscillator.type =
            "sine";

        oscillator.frequency.value =
            280;


        gain.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );


        gain.gain.exponentialRampToValueAtTime(
            0.07,
            audioContext.currentTime + 0.01
        );


        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + 0.12
        );


        oscillator.connect(gain);

        gain.connect(
            audioContext.destination
        );


        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + 0.12
        );

    } catch (error) {

        console.log(
            "Sound unavailable."
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


        const audioContext =
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
                    audioContext.createOscillator();

                const gain =
                    audioContext.createGain();


                oscillator.type =
                    "sine";

                oscillator.frequency.value =
                    frequency;


                const startTime =
                    audioContext.currentTime +
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

                gain.connect(
                    audioContext.destination
                );


                oscillator.start(
                    startTime
                );

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
   BOARD COLORS
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
   BOARD CREATION
========================= */

function createBoard(
    boardElement,
    playerNumber
) {

    boardElement.innerHTML = "";


    /*
        Visual arrangement:

        1   2   3   4   5   6   7   8

        16  15  14  13  12  11  10  9
    */


    const visualOrder = [
        0, 1, 2, 3,
        4, 5, 6, 7,

        15, 14, 13, 12,
        11, 10, 9, 8
    ];


    visualOrder.forEach(
        function (index) {

            const hole =
                document.createElement(
                    "button"
                );


            hole.type =
                "button";


            hole.className =
                "hole";


            hole.dataset.index =
                index;


            hole.dataset.player =
                playerNumber;


            const stoneCount =
                document.createElement(
                    "span"
                );


            stoneCount.className =
                "stone-count";


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
   BOARD RENDERING
========================= */

function renderBoard(
    boardElement,
    stones
) {

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


            countElement.textContent =
                count;


            hole.style.background =
                getHoleColor(
                    count
                );


            hole.classList.toggle(
                "empty",
                count === 0
            );


            hole.disabled =
                gameOver ||
                computerThinking;


        }
    );

}


/* =========================
   BOARD ACTIVE STATE
========================= */

function updateActiveBoard() {

    if (!player1Section ||
        !player2Section) {

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
   TOTAL STONES
========================= */

function getTotalStones(
    stones
) {

    return stones.reduce(
        function (
            total,
            value
        ) {

            return total + value;

        },
        0
    );

}


/* =========================
   TURN DISPLAY
========================= */

function updateTurnDisplay() {

    if (!turnDisplay) {
        return;
    }


    if (currentPlayer === 1) {

        turnDisplay.textContent =
            "PLAYER 1 TURN";

    } else {

        if (
            gameMode ===
            "human-computer"
        ) {

            if (computerThinking) {

                turnDisplay.textContent =
                    "COMPUTER THINKING...";

            } else {

                turnDisplay.textContent =
                    "COMPUTER TURN";

            }

        } else {

            turnDisplay.textContent =
                "PLAYER 2 TURN";

        }

    }

}


/* =========================
   MESSAGE
========================= */

function updateMessage() {

    if (!gameMessage) {
        return;
    }


    if (gameOver) {
        return;
    }


    if (currentPlayer === 1) {

        gameMessage.textContent =
            "Choose a hole to begin.";

    } else {

        if (
            gameMode ===
            "human-computer"
        ) {

            if (computerThinking) {

                gameMessage.textContent =
                    "The computer is choosing a move...";

            } else {

                gameMessage.textContent =
                    "Computer's turn.";

            }

        } else {

            gameMessage.textContent =
                "Player 2, choose a hole.";

        }

    }

}


/* =========================
   RENDER EVERYTHING
========================= */

function render() {

    loadSettingsAgain();

    applyGameSettings();


    renderBoard(
        board1,
        player1
    );


    renderBoard(
        board2,
        player2
    );


    player1Total.textContent =
        getTotalStones(
            player1
        );


    player2Total.textContent =
        getTotalStones(
            player2
        );


    updateActiveBoard();

    updateTurnDisplay();

    updateMessage();


    if (
        gameMode ===
        "human-computer" &&
        currentPlayer === 2 &&
        !gameOver &&
        !computerThinking
    ) {

        setTimeout(
            computerMove,
            650
        );

    }

}


/* =========================
   HANDLE CLICK
========================= */

function handleHoleClick(
    playerNumber,
    holeIndex
) {

    if (gameOver) {
        return;
    }


    if (computerThinking) {
        return;
    }


    if (
        playerNumber !==
        currentPlayer
    ) {

        return;
    }


    if (
        gameMode ===
        "human-computer" &&
        currentPlayer === 2
    ) {

        return;
    }


    const board =
        playerNumber === 1
            ? player1
            : player2;


    const stones =
        board[holeIndex];


    if (stones <= 0) {

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


    /*
        Movement follows:

        1 -> 2 -> 3 -> ... -> 16 -> 1
    */


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


    render();


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
        gameMode ===
        "human-computer" &&
        currentPlayer === 2
    ) {

        setTimeout(
            computerMove,
            650
        );

    }

}


/* =========================
   WIN CHECK
========================= */

function checkWin(
    playerNumber,
    board
) {

    const hasWinningHole =
        board.some(
            function (stones) {

                return (
                    stones >=
                    WINNING_STONES
                );

            }
        );


    if (!hasWinningHole) {

        return false;

    }


    gameOver = true;

    computerThinking = false;


    const winnerText =
        playerNumber === 1
            ? "PLAYER 1 WINS!"
            : (
                gameMode ===
                "human-computer"
                    ? "COMPUTER WINS!"
                    : "PLAYER 2 WINS!"
            );


    if (winnerName) {

        winnerName.textContent =
            winnerText;

    }


    if (winnerMessage) {

        winnerMessage.textContent =
            "All 48 stones are in one hole.";

    }


    if (winnerOverlay) {

        winnerOverlay.classList.add(
            "show"
        );

    }


    playWinSound();


    render();


    setTimeout(
        function () {

            if (winnerOverlay) {

                winnerOverlay.classList.remove(
                    "show"
                );

            }

        },
        3000
    );


    return true;

}


/* =========================
   COMPUTER
========================= */

function computerMove() {

    if (gameOver) {
        return;
    }


    if (
        gameMode !==
        "human-computer"
    ) {

        return;

    }


    if (currentPlayer !== 2) {
        return;
    }


    if (computerThinking) {
        return;
    }


    computerThinking = true;

    updateTurnDisplay();

    updateMessage();


    const move =
        chooseComputerMove();


    if (move === null) {

        computerThinking = false;

        return;

    }


    setTimeout(
        function () {

            computerThinking = false;


            if (gameOver) {
                return;
            }


            makeMove(
                2,
                move
            );

        },
        500
    );

}


/* =========================
   COMPUTER MOVE CHOICE
========================= */

function chooseComputerMove() {

    const legalMoves = [];


    for (
        let i = 0;
        i < HOLES;
        i++
    ) {

        if (
            player2[i] >
            0
        ) {

            legalMoves.push(i);

        }

    }


    if (
        legalMoves.length === 0
    ) {

        return null;

    }


    /*
        First look for an immediate
        winning move.
    */

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


        const wins =
            simulated.some(
                function (stones) {

                    return (
                        stones >=
                        WINNING_STONES
                    );

                }
            );


        if (wins) {

            return move;

        }

    }


    /*
        Otherwise score each move.
    */

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


            let concentratedPiles =
                0;


            simulated.forEach(
                function (stones) {

                    if (
                        stones >= 6
                    ) {

                        concentratedPiles +=
                            stones;

                    }

                }
            );


            const score =
                largestPile * 4 +
                concentratedPiles +
                Math.random() * 8;


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

    computerThinking = false;


    if (winnerOverlay) {

        winnerOverlay.classList.remove(
            "show"
        );

    }


    if (gameMessage) {

        gameMessage.textContent =
            "Choose a hole to begin.";

    }


    render();

}


/* =========================
   START
========================= */

createBoard(
    board1,
    1
);


createBoard(
    board2,
    2
);


loadSettingsAgain();

applyGameSettings();

render();