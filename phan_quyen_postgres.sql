-- =========================================================================
-- DATABASE DECENTRALIZATION SCHEMA (POSTGRESQL COMPATIBLE)
-- Generated for Badminton Court Booking Website (SmashCourt)
-- Based on the Vifon Portal RBAC architecture
-- =========================================================================

-- 1. Table: menu
CREATE TABLE IF NOT EXISTS menu (
    id VARCHAR(36) PRIMARY KEY,
    menu_title VARCHAR(100) NOT NULL,
    menu_url VARCHAR(100) NOT NULL,
    menu_period INT DEFAULT 0,
    menu_type INT DEFAULT 1,
    parent_id VARCHAR(36) REFERENCES menu(id) ON DELETE SET NULL,
    menu_icon VARCHAR(50) NULL
);

-- 2. Table: permision (using original spelling with single 's')
CREATE TABLE IF NOT EXISTS permision (
    id VARCHAR(36) PRIMARY KEY,
    permision_name VARCHAR(100) NOT NULL,
    permision_note VARCHAR(200) NULL,
    deleted BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NULL,
    menu_assign VARCHAR(36) REFERENCES menu(id) ON DELETE SET NULL
);

-- 3. Table: permision_lines
CREATE TABLE IF NOT EXISTS permision_lines (
    id VARCHAR(36) PRIMARY KEY,
    permision_id VARCHAR(36) NOT NULL REFERENCES permision(id) ON DELETE CASCADE,
    controller VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NULL,
    deleted BOOLEAN DEFAULT FALSE,
    note VARCHAR(200) NULL
);

-- 4. Table: role
CREATE TABLE IF NOT EXISTS role (
    id VARCHAR(36) PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL,
    role_note VARCHAR(200) NULL,
    permision_id VARCHAR(36) NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NULL,
    deleted BOOLEAN DEFAULT FALSE
);

-- 5. Table: role_permision
CREATE TABLE IF NOT EXISTS role_permision (
    id VARCHAR(36) PRIMARY KEY,
    role_id VARCHAR(36) NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    permision_id VARCHAR(36) NOT NULL REFERENCES permision(id) ON DELETE CASCADE,
    deleted BOOLEAN DEFAULT FALSE
);

-- 6. Table: user_role
CREATE TABLE IF NOT EXISTS user_role (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL, -- References SERIAL id from 'users' table
    role_id VARCHAR(36) NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    deleted BOOLEAN DEFAULT FALSE
);

-- =========================================================================
-- SEED DATA FOR BADMINTON COURT BOOKING SYSTEM
-- =========================================================================

-- Seed Menus
INSERT INTO menu (id, menu_title, menu_url, menu_period, menu_type, parent_id, menu_icon) VALUES
('m-home', 'Trang chủ', '/', 10, 1, NULL, 'home'),
('m-booking', 'Đặt sân online', '/booking', 20, 1, NULL, 'calendar'),
('m-courts', 'Danh sách sân', '/courts', 30, 1, NULL, 'layers'),
('m-contact', 'Liên hệ', '/contact', 40, 1, NULL, 'phone'),
('m-admin-root', 'Quản trị hệ thống', '#', 900, 1, NULL, 'shield'),
('m-admin-bookings', 'Quản lý lịch đặt', '/admin', 910, 1, 'm-admin-root', 'calendar'),
('m-admin-courts', 'Quản lý sân bãi', '/admin', 920, 1, 'm-admin-root', 'grid'),
('m-admin-customers', 'Danh sách khách hàng', '/admin', 930, 1, 'm-admin-root', 'users'),
('m-admin-revenue', 'Báo cáo doanh thu', '/admin', 940, 1, 'm-admin-root', 'trending-up');

-- Seed Permissions
INSERT INTO permision (id, permision_name, permision_note, deleted, menu_assign) VALUES
('p-view-home', 'Xem trang chủ', 'Cho phép xem trang chủ chính', FALSE, 'm-home'),
('p-make-booking', 'Đăng ký đặt sân', 'Cho phép người dùng lựa chọn khung giờ và đặt sân', FALSE, 'm-booking'),
('p-admin-all', 'Toàn quyền quản trị', 'Full quyền truy cập tất cả tính năng của chủ sân', FALSE, 'm-admin-root'),
('p-admin-view-bookings', 'Xem danh sách đặt sân', 'Quyền xem danh sách lịch đặt cho nhân viên sân', FALSE, 'm-admin-bookings'),
('p-admin-confirm-booking', 'Xác nhận/Hủy đặt sân', 'Cho phép duyệt hoặc hủy lịch đặt của khách hàng', FALSE, 'm-admin-bookings'),
('p-admin-manage-courts', 'Quản lý trạng thái sân bãi', 'Cho phép đóng/mở sân để bảo trì', FALSE, 'm-admin-courts');

-- Seed Permission Lines (Controller/Action route maps)
INSERT INTO permision_lines (id, permision_id, controller, action, note) VALUES
('pl-1', 'p-view-home', 'Home', 'Index', 'Vào trang chủ'),
('pl-2', 'p-make-booking', 'Bookings', 'Create', 'Tạo đơn đặt sân mới'),
('pl-3', 'p-admin-all', 'Admin', '*', 'Toàn quyền controller Admin'),
('pl-4', 'p-admin-view-bookings', 'Bookings', 'List', 'Xem danh sách lịch đặt'),
('pl-5', 'p-admin-confirm-booking', 'Bookings', 'Confirm', 'Duyệt lịch đặt sân'),
('pl-6', 'p-admin-confirm-booking', 'Bookings', 'Cancel', 'Hủy lịch đặt sân'),
('pl-7', 'p-admin-manage-courts', 'Courts', 'UpdateStatus', 'Đóng/mở sân bảo trì');

-- Seed Roles
INSERT INTO role (id, role_name, role_note) VALUES
('r-admin', 'Chủ sân (Admin)', 'Quản trị viên tối cao của hệ thống đặt sân'),
('r-staff', 'Nhân viên sân (Staff)', 'Nhân viên quản lý trực ca, duyệt sân trực tiếp'),
('r-customer', 'Khách hàng (Customer)', 'Người chơi cầu lông đăng ký tài khoản');

-- Map Roles to Permissions
INSERT INTO role_permision (id, role_id, permision_id) VALUES
-- Admin has all permissions
('rp-1', 'r-admin', 'p-view-home'),
('rp-2', 'r-admin', 'p-make-booking'),
('rp-3', 'r-admin', 'p-admin-all'),
('rp-4', 'r-admin', 'p-admin-view-bookings'),
('rp-5', 'r-admin', 'p-admin-confirm-booking'),
('rp-6', 'r-admin', 'p-admin-manage-courts'),
-- Staff can view bookings, confirm/cancel, and manage courts
('rp-7', 'r-staff', 'p-view-home'),
('rp-8', 'r-staff', 'p-admin-view-bookings'),
('rp-9', 'r-staff', 'p-admin-confirm-booking'),
('rp-10', 'r-staff', 'p-admin-manage-courts'),
-- Customer can view home and make booking
('rp-11', 'r-customer', 'p-view-home'),
('rp-12', 'r-customer', 'p-make-booking');
