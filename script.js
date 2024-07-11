function saveGameState() {
    const gameState = {
      vocabulary: vocabulary,
      score: score,
      streak: streak,
      level: level,
      progress: progress,
      wordsToNextLevel: wordsToNextLevel
    };
    localStorage.setItem('VocabGameState', JSON.stringify(gameState));
  }

  function loadGameState() {
    const savedState = localStorage.getItem('VocabGameState');
    if (savedState) {
      const gameState = JSON.parse(savedState);
      vocabulary = gameState.vocabulary;
      score = gameState.score;
      streak = gameState.streak;
      level = gameState.level;
      progress = gameState.progress;
      wordsToNextLevel = gameState.wordsToNextLevel;
      return true;
    }
    return false;
  }

  let vocabulary = [];
  let score = 0;
  let streak = 0;
  let level = 1;
  let progress = 0;
  let wordsToNextLevel = 2;
  let currentCorrectAnswer = '';
  let isAnswering = false;
  const dropArea = document.getElementById('dropArea');
  const fileInput = document.getElementById('fileInput');
  const uploadSection = document.getElementById('uploadSection');
  const gameArea = document.getElementById('gameArea');
  const questionEl = document.getElementById('question');
  const optionsEl = document.getElementById('options');
  const scoreEl = document.getElementById('score');
  const streakEl = document.getElementById('streak');
  const levelEl = document.getElementById('level');
  const progressBar = document.getElementById('progressBar');
  const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });

  dropArea.addEventListener('drop', handleDrop, false);
  fileInput.addEventListener('change', handleFiles, false);
  toggleSwitch.addEventListener('change', switchTheme, false);

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    dropArea.classList.add('highlight');
  }

  function unhighlight() {
    dropArea.classList.remove('highlight');
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles({ target: { files: files } });
  }

  function handleFiles(event) {
    const files = event.target.files;
    if (files.length) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const content = e.target.result;
          processCSV(content);
        };
        reader.readAsText(file);
      } else {
        alert('Please upload a CSV file.');
      }
    }
  }

  function processCSV(content) {
    const lines = content.split('\n');
    vocabulary = lines.map(line => {
      const [hebrew, arabic] = line.split(';').map(item => item.trim());
      return { hebrew, arabic };
    }).filter(item => item.hebrew && item.arabic);

    if (vocabulary.length > 0) {
      saveGameState();
      startGame();
    } else {
      alert('No valid vocabulary items found in the CSV. Please check your file and try again.');
    }
  }

  function startGame() {
    if (loadGameState()) {
      uploadSection.style.display = 'none';
      gameArea.style.display = 'block';
      updateStats();
      nextQuestion();
    } else if (vocabulary.length > 0) {
      uploadSection.style.display = 'none';
      gameArea.style.display = 'block';
      nextQuestion();
    } else {
      alert('No valid vocabulary items found. Please upload a CSV file.');
    }
  }

  function nextQuestion() {
    isAnswering = false;
    const currentWord = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    const isHebrew = Math.random() < 0.5;

    questionEl.textContent = isHebrew ? currentWord.hebrew : currentWord.arabic;
    currentCorrectAnswer = isHebrew ? currentWord.arabic : currentWord.hebrew;

    const options = [currentCorrectAnswer];

    while (options.length < 4) {
      const randomWord = vocabulary[Math.floor(Math.random() * vocabulary.length)];
      const option = isHebrew ? randomWord.arabic : randomWord.hebrew;
      if (!options.includes(option)) {
        options.push(option);
      }
    }

    options.sort(() => Math.random() - 0.5);

    optionsEl.innerHTML = '';
    options.forEach(option => {
      const button = document.createElement('button');
      button.className = 'option-btn';
      button.textContent = option;
      button.onclick = () => checkAnswer(button, option);
      optionsEl.appendChild(button);
    });
  }

  function checkAnswer(selectedButton, selected) {
    if (isAnswering) return;
    isAnswering = true;

    if (selected === currentCorrectAnswer) {
      selectedButton.classList.add('correct');
      score += 10;
      streak++;
      progress++;
      updateStats();
      setTimeout(nextQuestion, 1000);
    } else {
      selectedButton.classList.add('incorrect');
      streak = 0;
      updateStats();
      isAnswering = false;
    }
  }

  function updateStats() {
    scoreEl.textContent = score;
    streakEl.textContent = streak;
    levelEl.textContent = level;
    const progressPercentage = (progress / wordsToNextLevel) * 100;
    progressBar.style.width = `${progressPercentage}%`;

    if (progress >= wordsToNextLevel) {
      progressBar.style.width = '100%';
      setTimeout(() => {
        levelUp();
      }, 500);
    }

    saveGameState();
  }

  function levelUp() {
    level++;
    progress = 0;
    levelEl.textContent = level;
    
    // Calculate new words required for next level
    wordsToNextLevel = 2 * Math.pow(level, 2);
    
    // Add pop-bob animation
    progressBar.classList.add('pop-bob');
    levelEl.parentElement.classList.add('pop-bob');
    setTimeout(() => {
      progressBar.classList.remove('pop-bob');
      levelEl.parentElement.classList.remove('pop-bob');
      progressBar.style.width = '0%';
      updateStats();
    }, 300);

    // Increase challenge
    if (level % 3 === 0 && vocabulary.length > 20) {
      // Every 3 levels, remove one option to make it harder
      const optionToRemove = Math.min(optionsEl.children.length - 2, 1);
      for (let i = 0; i < optionToRemove; i++) {
        optionsEl.removeChild(optionsEl.lastChild);
      }
    }
  }

  function switchTheme(e) {
    if (e.target.checked) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }    
  }

  function resetGame() {
    localStorage.removeItem('VocabGameState');
    vocabulary = [];
    score = 0;
    streak = 0;
    level = 1;
    progress = 0;
    wordsToNextLevel = 2;
    updateStats();
    uploadSection.style.display = 'block';
    gameArea.style.display = 'none';
  }

  window.onload = function() {
    if (loadGameState()) {
      startGame();
    }
  };