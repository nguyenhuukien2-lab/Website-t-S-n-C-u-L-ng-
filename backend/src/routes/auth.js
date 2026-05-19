const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'smashcourt_jwt_secret_key_9988';

const mapRoleIdToName = (roleId, fallback) => {
  if (roleId === 'r-admin') return 'admin';
  if (roleId === 'r-staff') return 'staff';
  if (roleId === 'r-owner') return 'owner';
  if (roleId === 'r-customer') return 'customer';
  return fallback || 'customer';
};

const getUserByEmailWithRole = async (email) => {
  const query = `
    SELECT u.*, r.id AS rbac_role_id,
      CASE
        WHEN r.id = 'r-admin' THEN 'admin'
        WHEN r.id = 'r-staff' THEN 'staff'
        WHEN r.id = 'r-customer' THEN 'customer'
        ELSE u.role
      END AS effective_role
    FROM users u
    LEFT JOIN user_role ur ON ur.user_id = u.id
    LEFT JOIN role r ON r.id = ur.role_id
    WHERE LOWER(u.email) = LOWER($1)
    LIMIT 1
  `;
  const result = await db.query(query, [email]);
  return result.rows[0] || null;
};

const assignDefaultCustomerRole = async (userId) => {
  const existing = await db.query('SELECT 1 FROM user_role WHERE user_id = $1 LIMIT 1', [userId]);
  if (existing.rows.length === 0) {
    await db.query('INSERT INTO user_role (id, user_id, role_id) VALUES ($1, $2, $3)', [`ur-${userId}`, userId, 'r-customer']);
  }
};

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

    // Gán role customer mặc định vào bảng RBAC nếu chưa có
    await assignDefaultCustomerRole(newUser.id);

    // Tạo JWT token
    const token = jwt.sign(
      { id: newUser.id, role: 'customer', email: newUser.email },
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
    const user = await getUserByEmailWithRole(email);
    if (!user) {
      return res.status(400).json({ success: false, error: 'Tài khoản Email hoặc mật khẩu không chính xác!' });
    }

    // Nếu người dùng chưa có mapping RBAC, gán mặc định role khách hàng
    if (!user.rbac_role_id) {
      await assignDefaultCustomerRole(user.id);
    }

    // So sánh mật khẩu băm
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Tài khoản Email hoặc mật khẩu không chính xác!' });
    }

    const effectiveRole = user.effective_role || user.role;

    // Tạo JWT token
    const token = jwt.sign(
      { id: user.id, role: effectiveRole, email: user.email },
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
        role: effectiveRole,
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
    const existingUser = await getUserByEmailWithRole(email);
    let user = existingUser;

    if (!existingUser) {
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
      await assignDefaultCustomerRole(user.id);
      user.effective_role = 'customer';
      console.log(`🌱 Đã tự động tạo tài khoản Mạng xã hội mới trong database: ${email}`);
    } else if (!existingUser.rbac_role_id) {
      await assignDefaultCustomerRole(existingUser.id);
      user = { ...existingUser, effective_role: 'customer' };
    }

    const effectiveRole = (user && user.effective_role) ? user.effective_role : user.role;

    const token = jwt.sign(
      { id: user.id, role: effectiveRole, email: user.email },
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
        role: effectiveRole,
        avatar: avatar || fullName.trim().charAt(0).toUpperCase()
      }
    });
  } catch (error) {
    console.error('Lỗi khi đăng nhập mạng xã hội:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi server khi xử lý đăng nhập mạng xã hội!' });
  }
});

// GET /api/auth/users - Lấy danh sách toàn bộ người dùng và thống kê số tiền/giờ đã đặt sân của họ
router.get('/users', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id, 
        u.full_name as name, 
        u.email, 
        u.phone,
        u.role,
        COALESCE(COUNT(b.id), 0) as total_bookings,
        COALESCE(SUM(CASE WHEN LOWER(b.status) = 'confirmed' THEN b.deposit_amount ELSE 0 END), 0) as spent
      FROM users u
      LEFT JOIN bookings b ON LOWER(u.email) = LOWER(b.customer_email)
      GROUP BY u.id
      ORDER BY spent DESC, u.id ASC
    `;
    const result = await db.query(query);
    
    // Ánh xạ thành hạng mức VIP dựa trên số tiền tích lũy
    const usersWithTiers = result.rows.map(user => {
      const spentVal = parseInt(user.spent) || 0;
      let tier = 'Standard';
      if (spentVal >= 3000000) {
        tier = 'Elite VIP';
      } else if (spentVal >= 1000000) {
        tier = 'VIP Gold';
      } else if (spentVal >= 100000) {
        tier = 'VIP';
      }
      
      return {
        id: `CUST${String(user.id).padStart(3, '0')}`,
        dbId: user.id,
        name: user.name,
        phone: user.phone || 'Chưa cập nhật',
        email: user.email,
        totalHours: parseInt(user.total_bookings) * 2, // Giả sử trung bình 2 giờ/lượt đặt
        spent: spentVal,
        tier: tier,
        role: user.role
      };
    });

    res.json({ success: true, data: usersWithTiers });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách hàng:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi server khi lấy danh sách khách hàng' });
  }
});

module.exports = router;
