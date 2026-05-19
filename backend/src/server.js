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

// Serve Static Frontend (for Production Build)
const path = require('path');
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// 404 handler for API routes, fallback to React index.html for other routes
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ error: 'Route không tồn tại' });
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Lỗi server' });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║          🎾 SMASHCOURT PRO - DEVELOPMENT MODE         ║
╚═══════════════════════════════════════════════════════╝

✅ Backend API:  http://localhost:${PORT}

📱 Frontend URLs:
   👨‍💼 Admin:     http://localhost:5174/admin
   🧑‍💼 Nhân viên:  http://localhost:5174/staff

🚀 Hệ thống sẵn sàng!
  `)
});

// Trigger restart
// trigger
// trigger reload
