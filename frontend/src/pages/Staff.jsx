import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Staff = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'staff') {
    return (
      <div className="page-blocked">
        <h2>Không có quyền truy cập</h2>
        <p>Tài khoản của bạn hiện không phải là nhân viên sân.</p>
        <Link to="/">Quay về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="staff-page page-section">
      <div className="staff-hero">
        <h1>Trang Nhân viên sân</h1>
        <p>Đây là trang riêng cho nhân viên xử lý lịch đặt và trạng thái sân.</p>
      </div>

      <section className="staff-info">
        <h3>Thông tin tài khoản</h3>
        <ul>
          <li><strong>Họ tên:</strong> {user.fullName}</li>
          <li><strong>Email:</strong> {user.email}</li>
          <li><strong>Vai trò:</strong> Nhân viên sân</li>
        </ul>
      </section>

      <section className="staff-actions">
        <h3>Điều hướng nhanh</h3>
        <div className="staff-actions-grid">
          <Link to="/booking" className="staff-card">Xem lịch đặt</Link>
          <Link to="/courts" className="staff-card">Kiểm tra trạng thái sân</Link>
          <Link to="/account" className="staff-card">Thông tin tài khoản</Link>
        </div>
      </section>
    </div>
  );
};
