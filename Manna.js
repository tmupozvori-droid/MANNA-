"use strict";

const TOTAL_LEVELS = 200;
const QUESTIONS_PER_LEVEL = 5;
const TIME_LIMIT = 20;

const $ = id => document.getElementById(id);

let score = 0;
let level = 1;
let lives = 3;
let questionIndex = 0;
let levelCorrect = 0;
let timeLeft = TIME_LIMIT;
let timerId = null;
let locked = false;
let questions = [];
let completed = new Set();
let unlocked = 1;

// General knowledge question bank.
// Each question contains a question, four options,
// the correct answer, and an explanation.

const bank = [
  {
    q: "What is the capital city of Zimbabwe?",
    a: ["Harare", "Bulawayo", "Mutare", "Gweru"],
    c: 0,
    e: "Harare is the capital of Zimbabwe."
  },
  {
    q: "Which planet is known as the Red Planet?",
    a: ["Venus", "Mars", "Jupiter", "Saturn"],
    c: 1,
    e: "Mars looks reddish because of iron-rich dust."
  },
  {
    q: "How many sides does a hexagon have?",
    a: ["Five", "Seven", "Six", "Eight"],
    c: 2,
    e: "A hexagon has six sides."
  },
  {
    q: "What gas do plants absorb from the air?",
    a: ["Oxygen", "Nitrogen", "Hydrogen", "Carbon dioxide"],
    c: 3,
    e: "Plants use carbon dioxide during photosynthesis."
  },
  {
    q: "What is 12 × 8?",
    a: ["86", "96", "108", "92"],
    c: 1,
    e: "12 multiplied by 8 equals 96."
  },
  {
    q: "Which is the largest ocean on Earth?",
    a: ["Atlantic", "Indian", "Pacific", "Arctic"],
    c: 2,
    e: "The Pacific is Earth's largest ocean."
  },
  {
    q: "How many days are in a leap year?",
    a: ["365", "364", "367", "366"],
    c: 3,
    e: "A leap year has 366 days."
  },
  {
    q: "Which organ pumps blood around the body?",
    a: ["Heart", "Liver", "Lungs", "Kidney"],
    c: 0,
    e: "The heart pumps blood through blood vessels."
  },
  {
    q: "What is the chemical symbol for water?",
    a: ["CO2", "O2", "H2O", "NaCl"],
    c: 2,
    e: "Water molecules contain two hydrogen atoms and one oxygen atom."
  },
  {
    q: "Which continent is Zimbabwe in?",
    a: ["Asia", "Africa", "Europe", "South America"],
    c: 1,
    e: "Zimbabwe is a country in southern Africa."
  },
  {
    q: "What is 144 divided by 12?",
    a: ["10", "11", "13", "12"],
    c: 3,
    e: "144 divided by 12 equals 12."
  },
  {
    q: "Which animal is the tallest in the world?",
    a: ["Giraffe", "Elephant", "Ostrich", "Camel"],
    c: 0,
    e: "Giraffes are the tallest living land animals."
  },
  {
    q: "How many minutes are in one hour?",
    a: ["30", "100", "60", "90"],
    c: 2,
    e: "One hour contains 60 minutes."
  },
  {
    q: "Which star is closest to Earth?",
    a: ["Sirius", "The Sun", "Polaris", "Vega"],
    c: 1,
    e: "The Sun is our nearest star."
  },
  {
    q: "What is the opposite of ancient?",
    a: ["Old", "Historic", "Past", "Modern"],
    c: 3,
    e: "Modern means relating to the present or recent times."
  },
  {
    q: "Which instrument measures temperature?",
    a: ["Thermometer", "Barometer", "Compass", "Ruler"],
    c: 0,
    e: "A thermometer measures temperature."
  },
  {
    q: "What is 15 squared?",
    a: ["125", "200", "225", "250"],
    c: 2,
    e: "15 × 15 = 225."
  },
  {
    q: "Which language is primarily spoken in Brazil?",
    a: ["Spanish", "Portuguese", "French", "Italian"],
    c: 1,
    e: "Portuguese is Brazil's official language."
  },
  {
    q: "Which part of a plant usually absorbs water?",
    a: ["Flower", "Fruit", "Leaf", "Roots"],
    c: 3,
    e: "Roots absorb water and minerals from the soil."
  },
  {
    q: "What is the freezing point of pure water at standard pressure?",
    a: ["0°C", "10°C", "32°C", "100°C"],
    c: 0,
    e: "Pure water freezes at 0°C at standard pressure."
  }
];

// Save and restore progress.
function saveGame() {
  const data = {
    score,
    level,
    unlocked,
    completed: [...completed]
  };

  try {
    localStorage.setItem("quizMasterSave", JSON.stringify(data));
  } catch (error) {
    console.warn("Progress could not be saved.", error);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem("quizMasterSave");

    if (!raw) return;

    const data = JSON.parse(raw);

    score = Number.isFinite(data.score)
      ? Math.max(0, data.score)
      : 0;

    level = Number.isInteger(data.level)
      ? Math.min(TOTAL_LEVELS, Math.max(1, data.level))
      : 1;

    unlocked = Number.isInteger(data.unlocked)
      ? Math.min(TOTAL_LEVELS, Math.max(1, data.unlocked))
      : 1;

    if (Array.isArray(data.completed)) {
      completed = new Set(
        data.completed.filter(
          n => Number.isInteger(n) && n >= 1 && n <= TOTAL_LEVELS
        )
      );
    }

    unlocked = Math.max(
      unlocked,
      Math.min(TOTAL_LEVELS, level)
    );
  } catch (error) {
    console.warn("Saved progress could not be loaded.", error);
  }
}

// Generate maths questions with increasing difficulty.
function makeMathQuestion(difficulty) {
  let a;
  let b;
  let answer;
  let symbol;

  const mode = Math.min(4, Math.floor(difficulty / 40));

  if (mode === 0) {
    a = randomInt(2, 15);
    b = randomInt(2, 15);
    answer = a + b;
    symbol = "+";
  } else if (mode === 1) {
    a = randomInt(10, 40);
    b = randomInt(2, 15);
    answer = a - b;
    symbol = "-";
  } else if (mode === 2) {
    a = randomInt(3, 20);
    b = randomInt(2, 12);
    answer = a * b;
    symbol = "×";
  } else if (mode === 3) {
    b = randomInt(2, 12);
    answer = randomInt(2, 15);
    a = b * answer;
    symbol = "÷";
  } else {
    a = randomInt(2, 20);
    b = randomInt(2, 12);
    answer = a * b + randomInt(1, 9);
    symbol = "custom";
  }

  let q;

  if (symbol === "custom") {
    q = `What is (${a} × ${b}) + ${answer - a * b}?`;
  } else {
    q = `What is ${a} ${symbol} ${b}?`;
  }

  if (symbol === "custom") {
    answer = a * b + (answer - a * b);
  }

  const options = new Set([answer]);

  while (options.size < 4) {
    const offset = randomInt(1, Math.max(5, Math.floor(difficulty / 3) + 4));
    const candidate = Math.random() < 0.5
      ? answer + offset
      : answer - offset;

    if (candidate >= 0) options.add(candidate);
  }

  const shuffled = shuffle([...options]);

  return {
    q,
    a: shuffled.map(String),
    c: shuffled.indexOf(answer),
    e: `The answer is ${answer}.`
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

// Higher levels contain harder maths questions.
// General knowledge questions are also included.
function generateQuestions(levelNumber) {
  const result = [];
  const difficulty = levelNumber;

  for (let i = 0; i < QUESTIONS_PER_LEVEL; i++) {
    if (i % 2 === 0) {
      result.push(makeMathQuestion(difficulty));
    } else {
      const item = bank[
        randomInt(0, bank.length - 1)
      ];

      result.push({
        q: item.q,
        a: [...item.a],
        c: item.c,
        e: item.e
      });
    }
  }

  return result;
}

function startLevel(number) {
  clearInterval(timerId);

  level = number;
  questionIndex = 0;
  levelCorrect = 0;
  lives = 3;
  locked = false;

  questions = generateQuestions(level);

  $("quiz").hidden = false;
  $("result").hidden = true;

  updateStats();
  renderMap();
  showQuestion();
}

function showQuestion() {
  clearInterval(timerId);

  locked = false;
  timeLeft = TIME_LIMIT;

  const current = questions[questionIndex];

  $("levelLabel").textContent = `LEVEL ${level}`;
  $("question").textContent = current.q;
  $("timer").textContent = timeLeft;
  $("feedback").textContent = "";
  $("nextBtn").hidden = true;

  const answerBox = $("answers");
  answerBox.innerHTML = "";

  current.a.forEach((answer, index) => {
    const button = document.createElement("button");

    button.className = "answer-btn";
    button.textContent = `${String.fromCharCode(65 + index)}. ${answer}`;

    button.addEventListener("click", () => chooseAnswer(index));

    answerBox.appendChild(button);
  });

  updateStats();
  startTimer();
}

function startTimer() {
  timerId = setInterval(() => {
    timeLeft--;
    $("timer").textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerId);

      if (!locked) {
        finishQuestion(null);
      }
    }
  }, 1000);
}

function chooseAnswer(index) {
  if (locked) return;

  finishQuestion(index);
}

function finishQuestion(selected) {
  if (locked) return;

  locked = true;
  clearInterval(timerId);

  const current = questions[questionIndex];
  const buttons = [...$("answers").children];
  const isCorrect = selected === current.c;

  buttons.forEach((button, index) => {
    button.disabled = true;

    if (index === current.c) {
      button.classList.add("correct");
    }

    if (index === selected && !isCorrect) {
      button.classList.add("wrong");
    }
  });

  if (isCorrect) {
    const points = 10 + Math.floor(level / 10);
    score += points;
    levelCorrect++;

    $("feedback").textContent =
      `✅ Correct! +${points} points. ${current.e}`;
  } else {
    lives--;

    $("feedback").textContent = selected === null
      ? `⏰ Time is up! ${current.e}`
      : `❌ Not quite. ${current.e}`;
  }

  updateStats();

  $("nextBtn").textContent =
    questionIndex === QUESTIONS_PER_LEVEL - 1
      ? "See Results 🏆"
      : "Next Question ➜";

  $("nextBtn").hidden = false;
}

function nextQuestion() {
  if (!locked) return;

  questionIndex++;

  if (questionIndex >= QUESTIONS_PER_LEVEL) {
    endLevel();
    return;
  }

  showQuestion();
}

function endLevel() {
  clearInterval(timerId);

  $("quiz").hidden = true;
  $("result").hidden = false;

  const passed = levelCorrect >= 3;

  if (passed) {
    completed.add(level);

    if (level < TOTAL_LEVELS) {
      unlocked = Math.max(unlocked, level + 1);
    }

    saveGame();

    $("resultTitle").textContent =
      level === TOTAL_LEVELS
        ? "🏆 YOU BEAT ALL 200 LEVELS!"
        : "🎉 LEVEL COMPLETE!";

    $("resultMessage").textContent =
      `You answered ${levelCorrect} out of ` +
      `${QUESTIONS_PER_LEVEL} questions correctly. ` +
      `Your score is ${score}.`;

    $("continueBtn").hidden = level >= TOTAL_LEVELS;
    $("retryBtn").hidden = true;
  } else {
    $("resultTitle").textContent = "💪 Keep Practising!";

    $("resultMessage").textContent =
      `You got ${levelCorrect} out of ` +
      `${QUESTIONS_PER_LEVEL} correct. ` +
      "You need at least 3 correct answers to pass.";

    $("continueBtn").hidden = true;
    $("retryBtn").hidden = false;
  }

  updateStats();
  renderMap();
}

function updateStats() {
  $("score").textContent = score;
  $("level").textContent = `${level} / ${TOTAL_LEVELS}`;
  $("lives").textContent =
    "❤️".repeat(Math.max(0, lives)) +
    "🖤".repeat(3 - Math.max(0, lives));

  $("progress").style.width =
    `${(completed.size / TOTAL_LEVELS) * 100}%`;
}

function renderMap() {
  const map = $("levelMap");
  map.innerHTML = "";

  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const button = document.createElement("button");

    button.className = "level-btn";
    button.textContent = i;

    const isCompleted = completed.has(i);
    const isUnlocked = i <= unlocked;

    if (isCompleted) {
      button.classList.add("completed");
    } else if (isUnlocked) {
      button.classList.add("unlocked");
    }

    if (i === level) {
      button.classList.add("current");
    }

    button.disabled = !isUnlocked;

    button.addEventListener("click", () => {
      if (i <= unlocked) {
        startLevel(i);
      }
    });

    map.appendChild(button);
  }
}

$("nextBtn").addEventListener("click", nextQuestion);

$("continueBtn").addEventListener("click", () => {
  if (level < TOTAL_LEVELS) {
    startLevel(level + 1);
  }
});

$("retryBtn").addEventListener("click", () => {
  startLevel(level);
});

$("resetBtn").addEventListener("click", () => {
  const confirmed = confirm(
    "Reset all progress and start again from Level 1?"
  );

  if (!confirmed) return;

  clearInterval(timerId);

  score = 0;
  level = 1;
  unlocked = 1;
  lives = 3;
  completed.clear();

  try {
    localStorage.removeItem("quizMasterSave");
  } catch (error) {
    console.warn("Could not clear saved progress.", error);
  }

  startLevel(1);
});

loadGame();
startLevel(level);