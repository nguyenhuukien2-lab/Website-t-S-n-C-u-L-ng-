const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Kiểm tra kết nối
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Lỗi kết nối database PostgreSQL:', err.message);
  } else {
    console.log('✅ Kết nối thành công database PostgreSQL!');
  }
});

// Tự động tạo bảng và cấu trúc mới
const initDatabase = async () => {
  // Thử nâng cấp bảng bằng cách DROP bảng bookings cũ nếu chưa có cột mới (để tránh lỗi)
  try {
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='bookings' AND column_name='customer_phone'
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('⚠️ Phát hiện cấu trúc bảng bookings cũ. Đang tự động nâng cấp cấu trúc bảng...');
      await pool.query('DROP TABLE IF EXISTS bookings;');
    }
  } catch (err) {
    // Bảng chưa tồn tại, không sao cả
  }

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createCourtsTable = `
    CREATE TABLE IF NOT EXISTS courts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      price INT NOT NULL,
      status VARCHAR(50) DEFAULT 'available',
      type VARCHAR(50) DEFAULT 'standard'
    );
  `;

  const createBookingsTable = `
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      court_id INT NOT NULL,
      court_name VARCHAR(255),
      booking_date DATE NOT NULL,
      time_slot VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50),
      customer_email VARCHAR(255),
      payment_method VARCHAR(100),
      deposit_amount INT DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createUsersTable);
    await pool.query(createCourtsTable);
    await pool.query(createBookingsTable);
    console.log('✅ Khởi tạo các bảng database (users, courts, bookings) thành công!');
    
    // Thêm dữ liệu sân mẫu nếu bảng trống
    const courtsCount = await pool.query('SELECT COUNT(*) FROM courts');
    if (parseInt(courtsCount.rows[0].count) === 0) {
      const seedCourts = `
        INSERT INTO courts (name, location, price, status, type) VALUES
        ('Sân A1', 'Tầng 1', 70000, 'available', 'standard'),
        ('Sân A2', 'Tầng 1', 70000, 'available', 'standard'),
        ('Sân B1', 'Tầng 2', 85000, 'available', 'standard'),
        ('Sân B2', 'Tầng 2', 85000, 'available', 'standard'),
        ('Sân VIP', 'Tầng 3', 120000, 'available', 'vip');
      `;
      await pool.query(seedCourts);
      console.log('🌱 Đã thêm dữ liệu mẫu cho các sân cầu lông!');
    }

    // Thêm các tài khoản mẫu nếu bảng users trống
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCount.rows[0].count) === 0) {
      const adminPasswordHash = await bcrypt.hash('adminpassword', 10);
      const customerPasswordHash = await bcrypt.hash('123456password', 10);

      const seedUsers = `
        INSERT INTO users (full_name, email, phone, password, role) VALUES
        ('Quản trị viên', 'admin@smashcourt.com', '0901234567', $1, 'admin'),
        ('Nguyễn Văn A', 'khachhang@gmail.com', '0907654321', $2, 'customer');
      `;
      await pool.query(seedUsers, [adminPasswordHash, customerPasswordHash]);
      console.log('🌱 Đã tạo các tài khoản đăng nhập mẫu (Admin và Khách hàng)!');
    }
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo database:', error.message);
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  initDatabase,
};
