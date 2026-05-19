const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'smashcourt_jwt_secret_key_9988';

// POST /api/auth/register - Đăng ký tài khoản mới
router.post('/register', async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ các thông tin bắt buộc!' });
  }

  try {
    // Kiểm tra email trùng
    const userExist = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email này đã được đăng ký tài khoản khác!' });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Lưu vào database
    const insertQuery = `
      INSERT INTO users (full_name, email, phone, password, role)
      VALUES ($1, $2, $3, $4, 'customer')
      RETURNING id, full_name, email, phone, role, created_at
    `;
    const values = [fullName, email.toLowerCase(), phone || '', passwordHash];
    const result = await db.query(insertQuery, values);
    const newUser = result.rows[0];

    // Tạo JWT token
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      token,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      }
    });
  } catch (error) {
    console.error('Lỗi khi đăng ký:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi server khi đăng ký tài khoản!' });
  }
});

// POST /api/auth/login - Đăng nhập tài khoản thường
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ Email và Mật khẩu!' });
  }

  try {
    // Tìm người dùng trong database
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Tài khoản Email hoặc mật khẩu không chính xác!' });
    }

    const user = result.rows[0];

    // So sánh mật khẩu băm
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Tài khoản Email hoặc mật khẩu không chính xác!' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi server khi đăng nhập!' });
  }
});

// POST /api/auth/social-login - Đăng nhập/Đăng ký tự động bằng Google, Facebook
router.post('/social-login', async (req, res) => {
  const { fullName, email, provider, avatar } = req.body;

  if (!email || !fullName) {
    return res.status(400).json({ success: false, error: 'Thông tin đăng nhập mạng xã hội không hợp lệ!' });
  }

  try {
    // Kiểm tra xem người dùng email này đã tồn tại hay chưa
    let result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    let user;

    if (result.rows.length === 0) {
      // Nếu chưa tồn tại, tự động đăng ký tài khoản mới với mật khẩu ngẫu nhiên bảo mật
      const randomPassword = Math.random().toString(36).slice(-10) + 'Aa1!';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      const insertQuery = `
        INSERT INTO users (full_name, email, phone, password, role)
        VALUES ($1, $2, $3, $4, 'customer')
        RETURNING id, full_name, email, phone, role, created_at
      `;
      const values = [fullName, email.toLowerCase(), '', passwordHash];
      const insertResult = await db.query(insertQuery, values);
      user = insertResult.rows[0];
      console.log(`🌱 Đã tự động tạo tài khoản Mạng xã hội mới trong database: ${email}`);
    } else {
      user = result.rows[0];
    }

    // Tạo JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: `Đăng nhập qua ${provider} thành công!`,
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        avatar: avatar || fullName.trim().charAt(0).toUpperCase()
      }
    });
  } catch (error) {
    console.error('Lỗi khi đăng nhập mạng xã hội:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi server khi xử lý đăng nhập mạng xã hội!' });
  }
});

module.exports = router;
