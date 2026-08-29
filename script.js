let board = null;
const game = new Chess();
const $status = $('#status');
let searchDepth = 2; // Default Medium

// Piece Values for AI Evaluation
const pieceValues = {
    p: 10,
    n: 30,
    b: 30,
    r: 50,
    q: 90,
    k: 900
};

// Evaluate board state for AI
function evaluateBoard(boardState) {
    let totalEvaluation = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = boardState[i][j];
            if (piece) {
                const val = pieceValues[piece.type];
                totalEvaluation += piece.color === 'w' ? val : -val;
            }
        }
    }
    return totalEvaluation;
}

// Minimax Algorithm with Alpha-Beta Pruning
function minimax(gameInstance, depth, alpha, beta, isMaximizing) {
    if (depth === 0 || gameInstance.game_over()) {
        return evaluateBoard(gameInstance.board());
    }

    const moves = gameInstance.moves();

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let move of moves) {
            gameInstance.move(move);
            let evalVal = minimax(gameInstance, depth - 1, alpha, beta, false);
            gameInstance.undo();
            maxEval = Math.max(maxEval, evalVal);
            alpha = Math.max(alpha, evalVal);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let move of moves) {
            gameInstance.move(move);
            let evalVal = minimax(gameInstance, depth - 1, alpha, beta, true);
            gameInstance.undo();
            minEval = Math.min(minEval, evalVal);
            beta = Math.min(beta, evalVal);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

// AI Selection Logic
function makeAIMove() {
    const moves = game.moves();
    if (game.game_over() || moves.length === 0) return;

    let bestMove = null;
    let bestValue = Infinity; // AI is Black (minimizing player)

    for (let move of moves) {
        game.move(move);
        let boardValue = minimax(game, searchDepth - 1, -Infinity, Infinity, true);
        game.undo();

        if (boardValue < bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    }

    game.move(bestMove);
    board.position(game.fen());
    updateStatus();
}

// Handle Drag-and-Drop
function onDragStart(source, piece) {
    if (game.game_over()) return false;
    if (piece.search(/^b/) !== -1) return false; // Player can only move White
}

function onDrop(source, target) {
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Auto-promote to Queen for simplicity
    });

    if (move === null) return 'snapback';

    updateStatus();
    window.setTimeout(makeAIMove, 250);
}

function onSnapEnd() {
    board.position(game.fen());
}

function updateStatus() {
    let status = '';

    if (game.in_checkmate()) {
        status = game.turn() === 'w' ? 'Game Over: Black Wins!' : 'Game Over: White Wins!';
    } else if (game.in_draw()) {
        status = 'Game Over: Draw!';
    } else {
        status = game.turn() === 'w' ? "Your turn (White)" : "AI is thinking...";
        if (game.in_check()) {
            status += ' (Check!)';
        }
    }

    $status.text(status);
}

// Config & Event Listeners
const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};

board = Chessboard('board', config);

$('#reset-btn').on('click', () => {
    game.reset();
    board.start();
    updateStatus();
});

$('#difficulty').on('change', function () {
    searchDepth = parseInt($(this).val());
});
