import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Owner = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="page-blocked">
        <h2>Không có quyền truy cập</h2>
        <p>Tài khoản của bạn hiện không phải là chủ sân.</p>
        <Link to="/">Quay về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="owner-page page-section">
      <div className="owner-hero">
        <h1>Chào mừng Chủ sân</h1>
        <p>Đây là trang riêng dành cho chủ sân, nơi bạn quản lý toàn bộ hệ thống và có quyền cao nhất.</p>
      </div>

      <section className="owner-info">
        <h3>Thông tin tài khoản</h3>
        <ul>
          <li><strong>Họ tên:</strong> {user.fullName}</li>
          <li><strong>Email:</strong> {user.email}</li>
          <li><strong>Vai trò:</strong> Chủ sân</li>
        </ul>
      </section>

      <section className="owner-actions">
        <h3>Điều hướng nhanh</h3>
        <div className="owner-actions-grid">
          <Link to="/booking" className="owner-card">Đặt sân / Khách hàng</Link>
          <Link to="/courts" className="owner-card">Kiểm tra sân</Link>
          <Link to="/account" className="owner-card">Xem tài khoản</Link>
          <Link to="/admin" className="owner-card">Truy cập Admin lập trình</Link>
        </div>
      </section>
    </div>
  );
};
