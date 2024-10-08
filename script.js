const vocabFiles = [
    'madrase-vocab.csv',
    'most-searched-words.csv',
    'nouns.csv',
    'prepositions.csv',
    'verbs.csv',
    'vocabulary.csv'
]

let vocabulary = [];
let shuffledVocabulary = [];
let currentWordIndex = 0;
let score = 0;
let streak = 0;
let level = 1;
let progress = 0;
let wordsToNextLevel = 2;
let currentCorrectAnswer = '';
let isAnswering = false;
let darkMode = false;
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
const vocabDropdown = document.getElementById('vocab-dropdown');
const selectDropdownFile = document.getElementById('dropdown-choose');

const correctSound = new Audio('sounds/correct.mp3');
correctSound.volume = 0.6 // 60%
const incorrectSound = new Audio('sounds/error.mp3');
const levelUpSound = new Audio('sounds/level-up.mp3');

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
selectDropdownFile.addEventListener('click', loadPredefinedVocabulary);

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

function saveGameState() {
    const gameState = {
        vocabulary: vocabulary,
        shuffledVocabulary: shuffledVocabulary,
        currentWordIndex: currentWordIndex,
        score: score,
        streak: streak,
        level: level,
        progress: progress,
        wordsToNextLevel: wordsToNextLevel,
        darkMode: darkMode
    };
    localStorage.setItem('VocabGameState', JSON.stringify(gameState));
}

function loadGameState() {
    const savedState = localStorage.getItem('VocabGameState');
    if (savedState) {
        const gameState = JSON.parse(savedState);
        vocabulary = gameState.vocabulary;
        shuffledVocabulary = gameState.shuffledVocabulary;
        currentWordIndex = gameState.currentWordIndex;
        score = gameState.score;
        streak = gameState.streak;
        level = gameState.level;
        progress = gameState.progress;
        wordsToNextLevel = gameState.wordsToNextLevel;
        darkMode = gameState.darkMode;
        return true;
    }
    return false;
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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function processCSV(content) {
    const lines = content.split('\n');
    vocabulary = lines.map(line => {
        const [hebrew, arabic] = line.split(';').map(item => item.trim());
        return { hebrew, arabic };
    }).filter(item => item.hebrew && item.arabic);

    if (vocabulary.length > 0) {
        shuffledVocabulary = shuffleArray([...vocabulary]);
        currentWordIndex = 0;
        saveGameState();
        startGame();
    } else {
        alert('No valid vocabulary items found in the CSV. Please check your file and try again.');
    }
}

function startGame() {
    populateVocabSelect();
    if (loadGameState()) {
        loadTheme();
        if (vocabulary.length < 1) return false;
        uploadSection.style.display = 'none';
        gameArea.style.display = 'block';
        updateStats();
        nextQuestion();
    } else if (vocabulary.length > 0) {
        shuffledVocabulary = shuffleArray([...vocabulary]);
        currentWordIndex = 0;
        uploadSection.style.display = 'none';
        gameArea.style.display = 'block';
        nextQuestion();
    } else {
        resetGame();
        alert('No valid vocabulary items found. Please upload a CSV file.');
    }
}

function nextQuestion() {
    isAnswering = false;
    if (currentWordIndex >= shuffledVocabulary.length) {
        // If we've gone through all words, reshuffle and start over
        shuffledVocabulary = shuffleArray([...vocabulary]);
        currentWordIndex = 0;
    }
    
    const currentWord = shuffledVocabulary[currentWordIndex];
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

    currentWordIndex++;
}

function checkAnswer(selectedButton, selected) {
    if (isAnswering) return;
    isAnswering = true;

    if (selected === currentCorrectAnswer) {
        correctSound.currentTime = 0; // Reset playback position
        correctSound.play();
        selectedButton.classList.add('correct');
        score += 10;
        streak++;
        progress++;
        updateStats();
        setTimeout(nextQuestion, 1000);
    } else {
        incorrectSound.currentTime = 0;
        incorrectSound.play();
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
    levelUpSound.play();
    
    // Calculate new words required for next level
    wordsToNextLevel = 2 * Math.pow(level, 2);
    
    updateStats();
}

function loadTheme() {
    if (darkMode) {
        document.body.classList.add('dark-theme');
        toggleSwitch.checked = true;
    }
    else {
        document.body.classList.remove('dark-theme');
        toggleSwitch.checked = false;
    }
}

function switchTheme(e) {
    darkMode = e.target.checked;
    if (darkMode) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    saveGameState();
}

function resetGame() {
    localStorage.removeItem('VocabGameState');
    vocabulary = [];
    shuffledVocabulary = [];
    currentWordIndex = 0;
    score = 0;
    streak = 0;
    level = 1;
    progress = 0;
    wordsToNextLevel = 2;
    updateStats();
    uploadSection.style.display = 'block';
    gameArea.style.display = 'none';
    populateVocabSelect();
}

async function populateVocabSelect() {
    vocabDropdown.innerHTML = '<option>Choose a vocabulary file</option>'; // Clear the dropdown

    vocabFiles.forEach(file => {
        const option = document.createElement('option');

        option.value = `./vocabulary-files/${file}`;
        option.textContent = file.replace('.csv', '');

        vocabDropdown.appendChild(option);
    })
}

function loadPredefinedVocabulary() {
    const file = vocabDropdown.value;
    let fileContent;

    if (!file.endsWith('.csv')) { 
        alert('Please choose an option');
        return;
    }

    // Read the contents of the file
    fetch(file)
    .then(response => response.text())
    .then(data => {
        processCSV(data);
    })
    .catch(error => console.error('Error fetching the file:', error));
}

window.onload = function() {
    if (loadGameState()) {
        startGame();
    }
    else {
        resetGame();
    }
};

document.getElementById('resetButton').addEventListener('click', resetGame);
// document.getElementById('resetButton').addEventListener('click', e => {
//     e.target.style.transform = "scale(1.1)"
//     e.target.style.backgroundColor = "#F44336";
//     e.target.textContent = "Are you sure?"
// });