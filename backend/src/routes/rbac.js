const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/rbac/reseed - Xóa và seed lại toàn bộ dữ liệu RBAC (dành cho dev/fix)
router.post('/reseed', async (req, res) => {
  try {
    // DROP và tái tạo permision_lines để fix schema cũ
    await db.query('DROP TABLE IF EXISTS permision_lines CASCADE');
    await db.query(`
      CREATE TABLE permision_lines (
        id VARCHAR(36) PRIMARY KEY,
        permision_id VARCHAR(36),
        controller_name VARCHAR(100) NOT NULL,
        action_name VARCHAR(100) NOT NULL
      )
    `);

    // Xóa dữ liệu cũ theo thứ tự quan hệ
    await db.query('DELETE FROM user_role');
    await db.query('DELETE FROM role_permision');
    await db.query('DELETE FROM menu');
    await db.query('DELETE FROM permision');
    await db.query('DELETE FROM role');

    // Seed Roles
    await db.query(`
      INSERT INTO role (id, role_name, role_note) VALUES
      ('r-admin',    'Admin',            'Toàn quyền quản lý hệ thống'),
      ('r-owner',    'Chủ sân',          'Quản lý sân và doanh thu'),
      ('r-staff',    'Nhân viên',        'Xác nhận/hủy booking, quản lý sân'),
      ('r-customer', 'Khách hàng',       'Đặt sân và xem lịch sử')
    `);

    // Seed Permissions
    await db.query(`
      INSERT INTO permision (id, permision_name, permision_note) VALUES
      ('p-booking-manage', 'Quản lý lịch đặt',  'Duyệt, hủy lịch đặt sân'),
      ('p-court-manage',   'Quản lý sân bãi',    'Bật/tắt trạng thái sân'),
      ('p-revenue-view',   'Xem doanh thu',       'Xem báo cáo và phân tích doanh thu'),
      ('p-customer-view',  'Xem khách hàng',      'Tra cứu danh sách khách hàng'),
      ('p-rbac-manage',    'Quản lý phân quyền', 'Phân vai trò và quyền hạn người dùng'),
      ('p-booking-create', 'Đặt sân',             'Tạo lịch đặt sân mới')
    `);

    // Seed Permission Lines
    await db.query(`
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

    // Seed Menus
    await db.query(`
      INSERT INTO menu (id, menu_title, menu_url, menu_type, menu_icon) VALUES
      ('m-home',     'Trang chủ',        '/home',    1, 'home'),
      ('m-booking',  'Đặt sân',          '/booking', 1, 'calendar'),
      ('m-admin-bk', 'Quản lý lịch đặt', '/admin',   2, 'list'),
      ('m-admin-ct', 'Quản lý sân',      '/admin',   2, 'map'),
      ('m-revenue',  'Doanh thu',        '/admin',   2, 'chart'),
      ('m-customers','Khách hàng',       '/admin',   2, 'users'),
      ('m-rbac',     'Phân quyền',       '/admin',   2, 'shield')
    `);

    // Assign Permissions to Roles
    await db.query(`
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

    // Assign Roles to Users
    const adminUser = await db.query("SELECT id FROM users WHERE email = 'admin' LIMIT 1");
    const ownerUser = await db.query("SELECT id FROM users WHERE email = 'owner' LIMIT 1");
    const staffUser = await db.query("SELECT id FROM users WHERE email = 'staff' LIMIT 1");
    const custUser  = await db.query("SELECT id FROM users WHERE email = 'customer' LIMIT 1");

    if (adminUser.rows.length > 0) {
      await db.query(
        `INSERT INTO user_role (id, user_id, role_id) VALUES ($1, $2, 'r-admin')`,
        [`ur-${adminUser.rows[0].id}`, adminUser.rows[0].id]
      );
    }
    if (ownerUser.rows.length > 0) {
      await db.query(
        `INSERT INTO user_role (id, user_id, role_id) VALUES ($1, $2, 'r-owner')`,
        [`ur-${ownerUser.rows[0].id}`, ownerUser.rows[0].id]
      );
    }
    if (staffUser.rows.length > 0) {
      await db.query(
        `INSERT INTO user_role (id, user_id, role_id) VALUES ($1, $2, 'r-staff')`,
        [`ur-${staffUser.rows[0].id}`, staffUser.rows[0].id]
      );
    }
    if (custUser.rows.length > 0) {
      await db.query(
        `INSERT INTO user_role (id, user_id, role_id) VALUES ($1, $2, 'r-customer')`,
        [`ur-${custUser.rows[0].id}`, custUser.rows[0].id]
      );
    }

    res.json({ success: true, message: '✅ Đã seed lại toàn bộ dữ liệu RBAC thành công!' });
  } catch (e) {
    console.error('Lỗi reseed RBAC:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/rbac/roles - Lấy toàn bộ vai trò trong hệ thống
router.get('/roles', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.id, r.role_name, r.role_note,
        COUNT(ur.id) as user_count
      FROM role r
      LEFT JOIN user_role ur ON ur.role_id = r.id
      WHERE r.deleted = FALSE
      GROUP BY r.id
      ORDER BY r.id
    `);
    res.json({ success: true, data: result.rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/rbac/permissions - Lấy danh sách quyền hạn kèm route lines
router.get('/permissions', async (req, res) => {
  try {
    const perms = await db.query(`
      SELECT p.id, p.permision_name, p.permision_note,
        json_agg(json_build_object('controller', pl.controller_name, 'action', pl.action_name)) AS lines
      FROM permision p
      LEFT JOIN permision_lines pl ON pl.permision_id = p.id
      WHERE p.deleted = FALSE
      GROUP BY p.id
      ORDER BY p.id
    `);
    res.json({ success: true, data: perms.rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/rbac/role-permissions - Lấy quyền hạn đã gán cho từng vai trò
router.get('/role-permissions', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.id as role_id, r.role_name,
        json_agg(json_build_object(
          'perm_id', p.id,
          'perm_name', p.permision_name
        )) FILTER (WHERE p.id IS NOT NULL) as permissions
      FROM role r
      LEFT JOIN role_permision rp ON rp.role_id = r.id
      LEFT JOIN permision p ON p.id = rp.permision_id
      WHERE r.deleted = FALSE
      GROUP BY r.id
      ORDER BY r.id
    `);
    res.json({ success: true, data: result.rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/rbac/user-roles - Lấy danh sách user kèm vai trò đang được gán
router.get('/user-roles', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.full_name, u.email, u.role as system_role,
        r.id as role_id,
        r.role_name
      FROM users u
      LEFT JOIN user_role ur ON ur.user_id = u.id
      LEFT JOIN role r ON r.id = ur.role_id
      ORDER BY u.id
    `);
    res.json({ success: true, data: result.rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/rbac/assign - Gán vai trò cho người dùng
router.post('/assign', async (req, res) => {
  const { userId, roleId } = req.body;
  if (!userId || !roleId) {
    return res.status(400).json({ success: false, error: 'Thiếu userId hoặc roleId' });
  }
  try {
    // Xóa gán cũ nếu có
    await db.query('DELETE FROM user_role WHERE user_id = $1', [userId]);
    // Gán mới
    const urId = `ur-${userId}-${Date.now()}`;
    await db.query(
      'INSERT INTO user_role (id, user_id, role_id) VALUES ($1, $2, $3)',
      [urId, userId, roleId]
    );
    res.json({ success: true, message: 'Đã gán vai trò thành công!' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/rbac/role-perm/assign - Gán quyền cho vai trò
router.post('/role-perm/assign', async (req, res) => {
  const { roleId, permId } = req.body;
  if (!roleId || !permId) {
    return res.status(400).json({ success: false, error: 'Thiếu roleId hoặc permId' });
  }
  try {
    // Kiểm tra đã có chưa
    const exists = await db.query(
      'SELECT id FROM role_permision WHERE role_id=$1 AND permision_id=$2',
      [roleId, permId]
    );
    if (exists.rows.length > 0) {
      return res.json({ success: true, message: 'Quyền đã được gán trước đó!' });
    }
    const rpId = `rp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await db.query(
      'INSERT INTO role_permision (id, role_id, permision_id) VALUES ($1,$2,$3)',
      [rpId, roleId, permId]
    );
    res.json({ success: true, message: 'Đã gán quyền cho vai trò thành công!' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE /api/rbac/role-perm/revoke - Thu hồi quyền của vai trò
router.delete('/role-perm/revoke', async (req, res) => {
  const { roleId, permId } = req.body;
  if (!roleId || !permId) {
    return res.status(400).json({ success: false, error: 'Thiếu roleId hoặc permId' });
  }
  try {
    await db.query(
      'DELETE FROM role_permision WHERE role_id=$1 AND permision_id=$2',
      [roleId, permId]
    );
    res.json({ success: true, message: 'Đã thu hồi quyền thành công!' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
