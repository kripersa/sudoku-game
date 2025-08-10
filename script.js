const boardEl = document.getElementById('sudoku-board');
const newGameBtn = document.getElementById('new-game');
const hintBtn = document.getElementById('hint');
const difficultySelect = document.getElementById('difficulty');
const timerEl = document.getElementById('timer');
const errorInfoEl = document.getElementById('error-info');
const darkModeToggleBtn = document.getElementById('dark-mode-toggle');
const hintInfoEl = document.getElementById('hint-info');

const solvedPuzzles = [
  "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
  "812753649943682175675491283154237896369845721287169534521974368438516972796328415",
  "123456789456789123789123456231564897564897231897231564312645978645978312978312645",
  "764835129185294673329167485296751348843926751517483962678519234931642587452378916"
];

let solution = [];
let puzzle = [];
let selectedCellIndex = null;
let timer;
let secondsElapsed = 0;
let errorsCount = 0;
const maxErrors = 3;
let gameOver = false;
let hintsUsed = 0;
let maxHints = 0;

function startTimer() {
  clearInterval(timer);
  secondsElapsed = 0;
  timerEl.textContent = '00:00';
  timer = setInterval(() => {
    secondsElapsed++;
    let m = Math.floor(secondsElapsed / 60);
    let s = secondsElapsed % 60;
    timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, 1000);
}

function generateSudoku(difficulty) {
  const solved = solvedPuzzles[Math.floor(Math.random() * solvedPuzzles.length)];
  solution = solved.split('');
  puzzle = [...solution];

  let removeCount = difficulty === 'easy' ? 35 : difficulty === 'medium' ? 45 : 55;
  const indicesToRemove = new Set();

  while (indicesToRemove.size < removeCount) {
    indicesToRemove.add(Math.floor(Math.random() * 81));
  }

  indicesToRemove.forEach(i => {
    puzzle[i] = '';
  });

  return puzzle;
}

function renderBoard(puzzle) {
  boardEl.innerHTML = '';
  puzzle.forEach((num, idx) => {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = idx;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('tabindex', '-1');

    if (num) {
      cell.textContent = num;
      cell.classList.add('prefilled');
    } else {
      cell.textContent = '';
    }

    cell.addEventListener('click', () => {
      if (gameOver) return;
      if (cell.classList.contains('prefilled')) return;
      selectCell(idx);
    });

    boardEl.appendChild(cell);
  });
  selectedCellIndex = null;
}

function selectCell(idx) {
  if (gameOver) return;

  if (selectedCellIndex !== null) {
    boardEl.children[selectedCellIndex].classList.remove('selected');
  }

  selectedCellIndex = idx;
  const cell = boardEl.children[idx];
  cell.classList.add('selected');
  cell.focus();
}

function moveSelection(direction) {
  if (selectedCellIndex === null) return;
  let row = Math.floor(selectedCellIndex / 9);
  let col = selectedCellIndex % 9;

  switch (direction) {
    case 'up': row = (row + 8) % 9; break;
    case 'down': row = (row + 1) % 9; break;
    case 'left': col = (col + 8) % 9; break;
    case 'right': col = (col + 1) % 9; break;
  }

  const newIndex = row * 9 + col;
  selectCell(newIndex);
}

function updateErrors() {
  errorInfoEl.innerHTML = `Mistakes: <span id="error-count">${errorsCount}</span> / ${maxErrors}`;
  const countSpan = document.getElementById('error-count');
  if (countSpan) {
    if (errorsCount >= maxErrors) {
      countSpan.style.color = 'var(--error-color)';
      endGame(false);
    } else {
      countSpan.style.color = 'var(--text-light-color)';
    }
  }
}

function updateHints() {
  if (hintInfoEl) {
    hintInfoEl.innerHTML = `Hints: <span id="hint-count">${hintsUsed}</span> / ${maxHints}`;
  }
  
  hintBtn.disabled = hintsUsed >= maxHints;
}

function checkWinCondition() {
  const cells = [...boardEl.children];
  const boardValues = cells.map(cell => cell.textContent.trim());
  const isSolved = boardValues.every((val, idx) => val === solution[idx]);

  if (isSolved) {
    endGame(true);
  }
}

function endGame(won) {
  gameOver = true;
  clearInterval(timer);
  selectedCellIndex = null;

  if (won) {
    errorInfoEl.textContent = `🎉 Congratulations! You solved it in ${timerEl.textContent}!`;
    errorInfoEl.style.color = 'var(--success-color)';
  } else {
    errorInfoEl.textContent = `💥 Game Over! You made ${maxErrors} mistakes.`;
    errorInfoEl.style.color = 'var(--error-color)';
  }
}

function handleInput(value) {
  if (gameOver || selectedCellIndex === null) return;

  const cell = boardEl.children[selectedCellIndex];
  if (cell.classList.contains('prefilled')) return;

  if (value === 'delete') {
    if (cell.classList.contains('incorrect')) {
      cell.classList.remove('incorrect');
    }
    cell.textContent = '';
    return;
  }

  cell.textContent = value;

  if (value !== solution[selectedCellIndex]) {
    if (!cell.classList.contains('incorrect')) {
      errorsCount++;
      updateErrors();
    }
    cell.classList.add('incorrect');
  } else {
    if (cell.classList.contains('incorrect')) {
      cell.classList.remove('incorrect');
    }
  }

  checkWinCondition();
}

function onKeyDown(e) {
  if (gameOver) return;
  if (selectedCellIndex === null) return;

  if (e.key >= '1' && e.key <= '9') {
    e.preventDefault();
    handleInput(e.key);
  } else if (e.key === 'Backspace' || e.key === 'Delete') {
    e.preventDefault();
    handleInput('delete');
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    moveSelection('up');
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    moveSelection('down');
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    moveSelection('left');
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    moveSelection('right');
  }
}

function giveHint() {
  if (gameOver) return;
  if (hintsUsed >= maxHints) return; // ამოწმებს ჰინტების ლიმიტს

  const cells = [...boardEl.children];
  const emptyCells = cells
    .map((cell, idx) => (!cell.classList.contains('prefilled') && cell.textContent.trim() === '' ? idx : null))
    .filter(i => i !== null);

  if (emptyCells.length === 0) return;

  const randomIdx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const cellToHint = boardEl.children[randomIdx];

  cellToHint.textContent = solution[randomIdx];
  cellToHint.classList.add('prefilled', 'hinted');
  cellToHint.style.cursor = 'default';

  hintsUsed++;
  updateHints();

  checkWinCondition();
}

function loadNewGame() {
  errorsCount = 0;
  gameOver = false;
  selectedCellIndex = null;
  const difficulty = difficultySelect.value;
  
  // ჰინტების ცვლადების დაყენება
  hintsUsed = 0;
  maxHints = difficulty === 'medium' ? 1 : difficulty === 'hard' ? 2 : 0;
  
  puzzle = generateSudoku(difficulty);
  renderBoard(puzzle);
  updateErrors();
  updateHints(); // ჰინტების განახლება
  
  errorInfoEl.style.color = 'var(--text-light-color)';
  startTimer();
}

function toggleDarkMode() {
  const body = document.body;
  body.classList.toggle('dark-mode');
  const isDarkMode = body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDarkMode);
  darkModeToggleBtn.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
  darkModeToggleBtn.setAttribute('aria-pressed', isDarkMode);
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme === 'true') {
    document.body.classList.add('dark-mode');
    darkModeToggleBtn.textContent = 'Light Mode';
    darkModeToggleBtn.setAttribute('aria-pressed', 'true');
  } else {
    document.body.classList.remove('dark-mode');
    darkModeToggleBtn.textContent = 'Dark Mode';
    darkModeToggleBtn.setAttribute('aria-pressed', 'false');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applySavedTheme();
  loadNewGame();
});

darkModeToggleBtn.addEventListener('click', toggleDarkMode);
newGameBtn.addEventListener('click', loadNewGame);
difficultySelect.addEventListener('change', loadNewGame);
hintBtn.addEventListener('click', giveHint);
document.addEventListener('keydown', onKeyDown);