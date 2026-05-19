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

  // ──────────── RBAC TABLES ────────────
  const createRoleTable = `
    CREATE TABLE IF NOT EXISTS role (
      id VARCHAR(36) PRIMARY KEY,
      role_name VARCHAR(100) NOT NULL,
      role_note VARCHAR(200),
      deleted BOOLEAN DEFAULT FALSE,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by VARCHAR(36)
    );
  `;
  const createPermisionTable = `
    CREATE TABLE IF NOT EXISTS permision (
      id VARCHAR(36) PRIMARY KEY,
      permision_name VARCHAR(100) NOT NULL,
      permision_note VARCHAR(200),
      deleted BOOLEAN DEFAULT FALSE,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by VARCHAR(36),
      menu_assign VARCHAR(36)
    );
  `;
  const createPermisionLinesTable = `
    CREATE TABLE IF NOT EXISTS permision_lines (
      id VARCHAR(36) PRIMARY KEY,
      permision_id VARCHAR(36) REFERENCES permision(id) ON DELETE CASCADE,
      controller_name VARCHAR(100) NOT NULL,
      action_name VARCHAR(100) NOT NULL
    );
  `;
  const createMenuTable = `
    CREATE TABLE IF NOT EXISTS menu (
      id VARCHAR(36) PRIMARY KEY,
      menu_title VARCHAR(100),
      menu_url VARCHAR(100),
      menu_period INT,
      menu_type INT,
      parent_id VARCHAR(36),
      menu_icon VARCHAR(30)
    );
  `;
  const createRolePermisionTable = `
    CREATE TABLE IF NOT EXISTS role_permision (
      id VARCHAR(36) PRIMARY KEY,
      role_id VARCHAR(36) REFERENCES role(id) ON DELETE CASCADE,
      permision_id VARCHAR(36) REFERENCES permision(id) ON DELETE CASCADE
    );
  `;
  const createUserRoleTable = `
    CREATE TABLE IF NOT EXISTS user_role (
      id VARCHAR(36) PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      role_id VARCHAR(36) REFERENCES role(id) ON DELETE CASCADE
    );
  `;

  try {
    // Drop old tables to reset (uncomment to use)
    // await pool.query('DROP TABLE IF EXISTS user_role CASCADE;');
    // await pool.query('DROP TABLE IF EXISTS role_permision CASCADE;');
    // await pool.query('DROP TABLE IF EXISTS permision_lines CASCADE;');
    // await pool.query('DROP TABLE IF EXISTS permision CASCADE;');
    // await pool.query('DROP TABLE IF EXISTS role CASCADE;');
    // await pool.query('DROP TABLE IF EXISTS menu CASCADE;');
    // await pool.query('DROP TABLE IF EXISTS bookings CASCADE;');
    // await pool.query('DROP TABLE IF EXISTS courts CASCADE;');
    // await pool.query('DROP TABLE IF EXISTS users CASCADE;');

    await pool.query(createUsersTable);
    await pool.query(createCourtsTable);
    await pool.query(createBookingsTable);
    await pool.query(createRoleTable);
    await pool.query(createPermisionTable);
    await pool.query(createPermisionLinesTable);
    await pool.query(createMenuTable);
    await pool.query(createRolePermisionTable);
    await pool.query(createUserRoleTable);
    console.log('✅ Khởi tạo các bảng database (users, courts, bookings + RBAC) thành công!');

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
      const adminPasswordHash = await bcrypt.hash('admin', 10);
      const ownerPasswordHash = await bcrypt.hash('owner123', 10);
      const staffPasswordHash = await bcrypt.hash('staff123', 10);
      const customerPasswordHash = await bcrypt.hash('customer123', 10);

      const seedUsers = `
        INSERT INTO users (full_name, email, phone, password, role) VALUES
        ('Admin System', 'admin', '0901234567', $1, 'admin'),
        ('Chủ Sân Cầu Lông', 'owner', '0902345678', $2, 'owner'),
        ('Nhân Viên Sân', 'staff', '0903456789', $3, 'staff'),
        ('Nguyễn Văn A', 'customer', '0904567890', $4, 'customer');
      `;
      await pool.query(seedUsers, [adminPasswordHash, ownerPasswordHash, staffPasswordHash, customerPasswordHash]);
      console.log('🌱 Đã tạo các tài khoản đăng nhập mẫu (Admin, Owner, Staff, Khách hàng)!');
    }

    // Thêm lịch đặt mẫu nếu bảng bookings trống để test dễ dàng
    const bookingsCount = await pool.query('SELECT COUNT(*) FROM bookings');
    if (parseInt(bookingsCount.rows[0].count) === 0) {
      const seedBookings = `
        INSERT INTO bookings (court_id, court_name, booking_date, time_slot, status, customer_name, customer_phone, customer_email, payment_method, deposit_amount, notes) VALUES
        (1, 'Sân A1', CURRENT_DATE, '08:00 - 10:00', 'pending', 'Nguyễn Văn A', '0907654321', 'khachhang@gmail.com', 'Chuyển khoản MoMo', 140000, 'Khách hàng quen đặt cuối tuần'),
        (3, 'Sân B1', CURRENT_DATE, '14:00 - 16:00', 'confirmed', 'Trần Thị B', '0988777666', 'tranthib@gmail.com', 'Thẻ ngân hàng', 170000, 'Đã cọc trước 100%'),
        (5, 'Sân VIP', CURRENT_DATE + 1, '19:00 - 21:00', 'pending', 'Phan Minh Huy', '0905112233', 'huy.phan@gmail.com', 'Chuyển khoản MoMo', 240000, 'Đặt sân tập giải đấu!');
      `;
      await pool.query(seedBookings);
      console.log('🌱 Đã thêm lịch đặt sân cầu lông mẫu vào database!');
    }

    // ──── SEED DỮ LIỆU PHÂN QUYỀN RBAC ────
    const roleCount = await pool.query('SELECT COUNT(*) FROM role');
    if (parseInt(roleCount.rows[0].count) === 0) {
      // 1. Seed Roles
      await pool.query(`
        INSERT INTO role (id, role_name, role_note) VALUES
        ('r-admin',    'Admin',            'Toàn quyền quản lý hệ thống'),
        ('r-owner',    'Chủ sân',          'Quản lý sân và doanh thu'),
        ('r-staff',    'Nhân viên',        'Xác nhận/hủy booking, quản lý sân'),
        ('r-customer', 'Khách hàng',       'Đặt sân và xem lịch sử')
      `);

      // 2. Seed Permissions
      await pool.query(`
        INSERT INTO permision (id, permision_name, permision_note) VALUES
        ('p-booking-manage', 'Quản lý lịch đặt',  'Duyệt, hủy lịch đặt sân'),
        ('p-court-manage',   'Quản lý sân bãi',    'Bật/tắt trạng thái sân'),
        ('p-revenue-view',   'Xem doanh thu',       'Xem báo cáo và phân tích doanh thu'),
        ('p-customer-view',  'Xem khách hàng',      'Tra cứu danh sách khách hàng'),
        ('p-rbac-manage',    'Quản lý phân quyền', 'Phân vai trò và quyền hạn người dùng'),
        ('p-booking-create', 'Đặt sân',             'Tạo lịch đặt sân mới')
      `);

      // 3. Seed Permission Lines (Controller/Action mapping)
      await pool.query(`
        INSERT INTO permision_lines (id, permision_id, controller_name, action_name) VALUES
        ('pl-01', 'p-booking-manage', 'Bookings', 'Confirm'),
        ('pl-02', 'p-booking-manage', 'Bookings', 'Cancel'),
        ('pl-03', 'p-booking-manage', 'Bookings', 'View'),
        ('pl-04', 'p-court-manage',   'Courts',   'UpdateStatus'),
        ('pl-05', 'p-court-manage',   'Courts',   'View'),
        ('pl-06', 'p-revenue-view',   'Revenue',  'View'),
        ('pl-07', 'p-customer-view',  'Customers','View'),
        ('pl-08', 'p-rbac-manage',    'RBAC',     'Manage'),
        ('pl-09', 'p-booking-create', 'Bookings', 'Create')
      `);

      // 4. Seed Menus
      await pool.query(`
        INSERT INTO menu (id, menu_title, menu_url, menu_type, menu_icon) VALUES
        ('m-home',     'Trang chủ',       '/home',    1, 'home'),
        ('m-booking',  'Đặt sân',         '/booking', 1, 'calendar'),
        ('m-admin-bk', 'Quản lý lịch đặt','/admin',  2, 'list'),
        ('m-admin-ct', 'Quản lý sân',     '/admin',   2, 'map'),
        ('m-revenue',  'Doanh thu',       '/admin',   2, 'chart'),
        ('m-customers','Khách hàng',      '/admin',   2, 'users'),
        ('m-rbac',     'Phân quyền',      '/admin',   2, 'shield')
      `);

      // 5. Assign Permissions → Roles
      await pool.query(`
        INSERT INTO role_permision (id, role_id, permision_id) VALUES
        ('rp-01','r-admin','p-booking-manage'),
        ('rp-02','r-admin','p-court-manage'),
        ('rp-03','r-admin','p-revenue-view'),
        ('rp-04','r-admin','p-customer-view'),
        ('rp-05','r-admin','p-rbac-manage'),
        ('rp-06','r-admin','p-booking-create'),
        ('rp-07','r-owner','p-court-manage'),
        ('rp-08','r-owner','p-revenue-view'),
        ('rp-09','r-owner','p-customer-view'),
        ('rp-10','r-staff','p-booking-manage'),
        ('rp-11','r-staff','p-court-manage'),
        ('rp-12','r-staff','p-customer-view'),
        ('rp-13','r-customer','p-booking-create')
      `);

      console.log('🌱 Đã khởi tạo dữ liệu Phân quyền RBAC (Roles, Permissions, Menus)!');
    }

    // 6. Assign Roles → Users (nếu user_role trống)
    const userRoleCount = await pool.query('SELECT COUNT(*) FROM user_role');
    if (parseInt(userRoleCount.rows[0].count) === 0) {
      const adminUser = await pool.query("SELECT id FROM users WHERE email = 'admin' LIMIT 1");
      const ownerUser = await pool.query("SELECT id FROM users WHERE email = 'owner' LIMIT 1");
      const staffUser = await pool.query("SELECT id FROM users WHERE email = 'staff' LIMIT 1");
      const custUser  = await pool.query("SELECT id FROM users WHERE email = 'customer' LIMIT 1");

      if (adminUser.rows.length > 0) {
        await pool.query(
          `INSERT INTO user_role (id, user_id, role_id) VALUES ($1, $2, 'r-admin')`,
          [`ur-${adminUser.rows[0].id}`, adminUser.rows[0].id]
        );
      }
      if (ownerUser.rows.length > 0) {
        await pool.query(
          `INSERT INTO user_role (id, user_id, role_id) VALUES ($1, $2, 'r-admin')`,
          [`ur-${ownerUser.rows[0].id}`, ownerUser.rows[0].id]
        );
      }
      if (staffUser.rows.length > 0) {
        await pool.query(
          `INSERT INTO user_role (id, user_id, role_id) VALUES ($1, $2, 'r-staff')`,
          [`ur-${staffUser.rows[0].id}`, staffUser.rows[0].id]
        );
      }
      if (custUser.rows.length > 0) {
        await pool.query(
          `INSERT INTO user_role (id, user_id, role_id) VALUES ($1, $2, 'r-customer')`,
          [`ur-${custUser.rows[0].id}`, custUser.rows[0].id]
        );
      }
      console.log('🌱 Đã gán vai trò cho các tài khoản mẫu (admin, owner, staff, customer)!');
    }

  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo database:', error.message);
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  initDatabase,
};
