require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

// Khởi tạo cơ sở dữ liệu
db.initDatabase();

// Khởi động lắng nghe tin nhắn Telegram Bot (Long Polling)
const { startPolling } = require('./utils/telegram_listener');
startPolling();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware =====
app.use(cors({
  origin: (origin, callback) => {
    // Cho phép tất cả các nguồn (origins) kết nối động để tránh lỗi CORS khi chạy local và deploy
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Routes =====
app.use('/api/courts', require('./routes/courts'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rbac', require('./routes/rbac'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CầuLông Pro API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route không tồn tại' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Lỗi server' });
});

app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});
