const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

// Данные (минимум слов)
let words = [
  { id: 1, original: "hello", translation: "привет", category: "Eazy✔️", correct: 0, wrong: 0 },
  { id: 2, original: "goodbye", translation: "до свидания", category: "Eazy✔️", correct: 0, wrong: 0 },
  { id: 3, original: "computer", translation: "компьютер", category: "Hurd 💪🏻", correct: 0, wrong: 0 },
  { id: 4, original: "book", translation: "книга", category: "Eazy✔️", correct: 0, wrong: 0 },
  { id: 5, original: "water", translation: "вода", category: "Eazy✔️", correct: 0, wrong: 0 }
];

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} ${req.method} ${req.url}`);
  next();
});

app.get('/api/words', (req, res) => {
  const { category } = req.query;
  let result = words;
  
  if (category) {
    result = words.filter(word => word.category === category);
  }
  
  res.json(result);
});

app.get('/api/quiz', (req, res) => {
  const { count = 3 } = req.query;
  
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  
  const quiz = selected.map(word => {

    const wrongOptions = words
      .filter(w => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map(w => w.translation);
    
    const options = [word.translation, ...wrongOptions].sort(() => Math.random() - 0.5);
    
    return {
      id: word.id,
      question: `Как переводится "${word.original}"?`,
      options: options,
      correctAnswer: word.translation
    };
  });
  
  res.json(quiz);
});

app.post('/api/check', (req, res) => {
  const { wordId, answer } = req.body;
  
  const word = words.find(w => w.id === wordId);
  if (!word) {
    return res.status(404).json({ error: 'Слово не найдено' });
  }
  
  const isCorrect = word.translation.toLowerCase() === answer.toLowerCase();
  
  // Обновляем статистику
  if (isCorrect) {
    word.correct += 1;
  } else {
    word.wrong += 1;
  }
  
  res.json({
    isCorrect,
    correctAnswer: word.translation,
    word: word.original
  });
});

app.get('/api/stats', (req, res) => {
  const totalWords = words.length;
  const totalAnswers = words.reduce((sum, word) => sum + word.correct + word.wrong, 0);
  const correctAnswers = words.reduce((sum, word) => sum + word.correct, 0);
  
  let accuracy = 0;
  if (totalAnswers > 0) {
    accuracy = Math.round((correctAnswers / totalAnswers) * 100);
  }
  
  const categories = {};
  words.forEach(word => {
    if (!categories[word.category]) {
      categories[word.category] = { count: 0, correct: 0, wrong: 0 };
    }
    categories[word.category].count += 1;
    categories[word.category].correct += word.correct;
    categories[word.category].wrong += word.wrong;
  });
  
  res.json({
    totalWords,
    totalAnswers,
    correctAnswers,
    accuracy: accuracy + '%',
    categories
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
  console.log(`📊 API статистики: http://localhost:${PORT}/api/stats`);
  console.log(`🧠 API теста: http://localhost:${PORT}/api/quiz`);
});