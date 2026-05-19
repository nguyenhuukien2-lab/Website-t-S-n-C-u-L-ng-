import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const SESSION_KEY = 'smashcourt_session';
const TOKEN_KEY = 'smashcourt_token';

const getNormalizedApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || '';
  url = url.trim();

  // Mặc định chạy dưới localhost:5000 nếu không có biến môi trường
  if (!url) {
    url = 'http://localhost:5000';
  }

  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'http://' + url;
  }
  return url;
};

const API_URL = getNormalizedApiUrl();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục phiên đăng nhập khi tải trang
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (session) setUser(session);
    } catch {
      // Bỏ qua dữ liệu lỗi
    } finally {
      setLoading(false);
    }
  }, []);

  // Đăng ký tài khoản thật vào database PostgreSQL
  const register = async ({ fullName, email, phone, password }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password })
      });
      
      const data = await response.json();
      if (!data.success) {
        return { success: false, message: data.error || 'Đăng ký thất bại!' };
      }

      // Tạo session từ thông tin thật trả về từ PostgreSQL
      const session = {
        id: data.user.id,
        fullName: data.user.fullName,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role,
        avatar: data.user.fullName.trim().charAt(0).toUpperCase()
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(session);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Không thể kết nối đến máy chủ Backend!' };
    }
  };

  // Đăng nhập tài khoản thật đối chiếu PostgreSQL
  const login = async ({ email, password }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!data.success) {
        return { success: false, message: data.error || 'Đăng nhập thất bại!' };
      }

      const session = {
        id: data.user.id,
        fullName: data.user.fullName,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role,
        avatar: data.user.fullName.trim().charAt(0).toUpperCase()
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(session);
      return { success: true, role: session.role };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Không thể kết nối đến máy chủ Backend!' };
    }
  };

  // Đăng nhập/Đăng ký tự động qua mạng xã hội (Google / Facebook)
  const loginWithSocial = async ({ provider, fullName, email, avatar }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, fullName, email, avatar })
      });

      const data = await response.json();
      if (!data.success) {
        return { success: false, message: data.error || 'Đăng nhập qua mạng xã hội thất bại!' };
      }

      const session = {
        id: data.user.id,
        fullName: data.user.fullName,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role,
        avatar: data.user.avatar || data.user.fullName.trim().charAt(0).toUpperCase()
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(session);
      return { success: true, role: session.role };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Không thể kết nối đến máy chủ Backend!' };
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, register, loginWithSocial }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
