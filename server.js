const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());

// Підключаємо базу carsalesmarket
const db = new Database('./carsalesmarket.db'); // <-- тут ім'я файлу бази

// Перевірка підключених таблиць
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("Connected database. Tables:", tables.map(t => t.name));
} catch (err) {
  console.error("Error connecting to database:", err);
}

// Ендпоінт: отримати продажі за певний рік
app.get('/sales/:year', (req, res) => {
  const year = parseInt(req.params.year);
  const rows = db.prepare('SELECT * FROM sales WHERE year = ?').all(year);
  res.json(rows);
});

// Ендпоінт: список усіх років у базі
app.get('/years', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT year FROM sales ORDER BY year').all();
  res.json(rows.map(r => r.year));
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
