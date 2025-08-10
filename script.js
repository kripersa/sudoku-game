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
  
  // ტაიმერის დაყოვნება 3 წამით
  setTimeout(() => {
    timer = setInterval(() => {
      secondsElapsed++;
      let m = Math.floor(secondsElapsed / 60);
      let s = secondsElapsed % 60;
      timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, 1000);
  }, 3000); 
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

    if (num) {
      cell.textContent = num;
      cell.classList.add('prefilled');
    } else {
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.max = '9';
      input.maxLength = '1';
      input.inputMode = 'numeric';
      input.setAttribute('aria-label', `Cell at position ${idx}`);
      input.setAttribute('tabindex', '-1');

      input.addEventListener('input', (e) => {
        let value = e.target.value;
        if (value.length > 1) {
          value = value.charAt(0);
          e.target.value = value;
        }
        handleInput(value);
      });

      input.addEventListener('focus', () => {
        selectCell(idx);
      });
      
      cell.appendChild(input);
    }
    
    cell.addEventListener('click', (e) => {
      if (gameOver || cell.classList.contains('prefilled')) return;
      
      const input = cell.querySelector('input');
      if (input) {
        input.focus();
      }
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
  const newCell = boardEl.children[newIndex];
  if (!newCell.classList.contains('prefilled')) {
      newCell.querySelector('input').focus();
  } else {
      selectCell(newIndex);
  }
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
  const boardValues = cells.map(cell => {
    if (cell.classList.contains('prefilled')) {
      return cell.textContent.trim();
    }
    const input = cell.querySelector('input');
    return input ? input.value : '';
  });
  const isSolved = boardValues.every((val, idx) => val === solution[idx]);

  if (isSolved) {
    endGame(true);
  }
}

function endGame(won) {
  gameOver = true;
  clearInterval(timer);
  selectedCellIndex = null;
  
  // Disable all inputs
  const inputs = boardEl.querySelectorAll('input');
  inputs.forEach(input => input.disabled = true);

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

  const cellText = cell.textContent.trim();
  const inputValue = value.trim();

  // თუ მნიშვნელობა ცარიელია, რიცხვი იშლება
  if (inputValue === '') {
    cell.classList.remove('incorrect');
    cell.textContent = '';
    return;
  }
  
  cell.textContent = inputValue;

  if (inputValue !== solution[selectedCellIndex]) {
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
  
  const cell = boardEl.children[selectedCellIndex];
  if (cell.classList.contains('prefilled')) return;
  
  if (e.key >= '1' && e.key <= '9') {
    e.preventDefault();
    const input = cell.querySelector('input');
    input.value = e.key;
    handleInput(e.key);
  } else if (e.key === 'Backspace' || e.key === 'Delete') {
    e.preventDefault();
    const input = cell.querySelector('input');
    input.value = '';
    handleInput('');
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
  if (hintsUsed >= maxHints) return;

  const cells = [...boardEl.children];
  const emptyCells = cells
    .map((cell, idx) => (!cell.classList.contains('prefilled') && (cell.querySelector('input') && cell.querySelector('input').value === '') ? idx : null))
    .filter(i => i !== null);

  if (emptyCells.length === 0) return;

  const randomIdx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const cellToHint = boardEl.children[randomIdx];

  const input = cellToHint.querySelector('input');
  if (input) {
    input.remove(); // წაშლის input-ს, რადგან უჯრა შევსებულია
  }

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
  
  hintsUsed = 0;
  maxHints = difficulty === 'medium' ? 1 : difficulty === 'hard' ? 2 : 0;
  
  puzzle = generateSudoku(difficulty);
  renderBoard(puzzle);
  updateErrors();
  updateHints();
  
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