// server.js
// ========== ПІДКЛЮЧЕННЯ МОДУЛІВ ==========
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

// ========== НАЛАШТУВАННЯ EXPRESS ==========
const app = express();
app.use(cors()); // Дозволяємо CORS-запити

// ========== ПІДКЛЮЧЕННЯ ДО БАЗИ ДАНИХ ==========
// Створюємо з'єднання з SQLite базою даних
const db = new Database('./carsalesmarket.db');

// Перевіряємо підключення та виводимо список таблиць
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("Підключено до бази даних. Наявні таблиці:", tables.map(t => t.name));
} catch (err) {
  console.error("Помилка підключення до бази даних:", err);
}

// ========== API ЕНДПОІНТИ ==========
// Отримання даних про продажі за вказаний рік
app.get('/sales/:year', (req, res) => {
  const year = parseInt(req.params.year);
  const rows = db.prepare('SELECT * FROM sales WHERE year = ?').all(year);
  res.json(rows);
});

// Отримання списку всіх доступних років
app.get('/years', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT year FROM sales ORDER BY year').all();
  res.json(rows.map(r => r.year));
});

// ========== ЗАПУСК СЕРВЕРА ==========
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущено на http://localhost:${PORT}`);
});
