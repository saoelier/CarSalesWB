const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());

// Подключаем базу carsalesmarket
const db = new Database('./carsalesmarket.db'); // <-- здесь имя файла базы

// Проверка подключённых таблиц
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("📦 Подключена база данных. Таблицы:", tables.map(t => t.name));
} catch (err) {
  console.error("Ошибка при подключении базы:", err);
}

// Эндпоинт: получить продажи за определённый год
app.get('/sales/:year', (req, res) => {
  const year = parseInt(req.params.year);
  const rows = db.prepare('SELECT * FROM sales WHERE year = ?').all(year);
  res.json(rows);
});

// Эндпоинт: список всех годов в базе
app.get('/years', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT year FROM sales ORDER BY year').all();
  res.json(rows.map(r => r.year));
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});
