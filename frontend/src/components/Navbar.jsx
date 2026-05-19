import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut, FiUser, FiCalendar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const userMenuRef = useRef(null);

  const { user, logout } = useAuth();

  // Monitor scroll for styling
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
    setShowUserMenu(false);
  }, [location]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Animated racket logo canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const lCtx = canvas.getContext('2d');
    let logoAngle = 0;
    let raf;

    const draw = () => {
      lCtx.clearRect(0, 0, 52, 52);
      lCtx.save();
      lCtx.translate(26, 26);
      lCtx.rotate(logoAngle);

      lCtx.strokeStyle = '#FFA500';
      lCtx.lineWidth = 3;
      lCtx.lineCap = 'round';
      lCtx.beginPath(); lCtx.moveTo(0, 8); lCtx.lineTo(0, 22); lCtx.stroke();

      lCtx.strokeStyle = '#FFD700';
      lCtx.lineWidth = 2.5;
      lCtx.beginPath();
      lCtx.ellipse(0, -4, 10, 14, 0, 0, Math.PI * 2);
      lCtx.stroke();

      lCtx.strokeStyle = 'rgba(255,215,0,0.5)';
      lCtx.lineWidth = 0.8;
      for (let i = -8; i <= 8; i += 4) {
        lCtx.beginPath(); lCtx.moveTo(i, -17); lCtx.lineTo(i, 9); lCtx.stroke();
      }
      for (let j = -14; j <= 10; j += 4) {
        lCtx.beginPath(); lCtx.moveTo(-10, j); lCtx.lineTo(10, j); lCtx.stroke();
      }
      lCtx.restore();

      lCtx.save();
      lCtx.translate(36, 10);
      lCtx.rotate(logoAngle * -0.5);
      lCtx.fillStyle = '#FFD700';
      lCtx.beginPath(); lCtx.arc(0, 0, 3.5, 0, Math.PI * 2); lCtx.fill();
      lCtx.strokeStyle = 'rgba(255,255,255,0.85)';
      lCtx.lineWidth = 1;
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2;
        lCtx.beginPath();
        lCtx.moveTo(0, 0);
        lCtx.lineTo(Math.cos(angle) * 7, Math.sin(angle) * 7);
        lCtx.stroke();
      }
      lCtx.restore();

      logoAngle += 0.015;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleScrollTo = (sectionId) => {
    setIsOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenBookingModal = () => {
    navigate('/courts');
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <nav className={isScrolled ? 'scrolled' : ''}>
      {/* Logo */}
      <Link to="/" className="logo-wrap" onClick={() => handleScrollTo('hero')}>
        <canvas ref={canvasRef} id="logo-canvas" width="52" height="52" />
        <div className="logo-text">
          <span className="logo-name">SmashCourt</span>
          <span className="logo-tag">Đặt sân online</span>
        </div>
      </Link>

      {/* Nav links */}
      <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
        <li><a href="#features" onClick={e => { e.preventDefault(); handleScrollTo('features'); }}>Tiện ích</a></li>
        <li><a href="#courts" onClick={e => { e.preventDefault(); handleScrollTo('courts'); }}>Sân & Giá</a></li>
        <li><a href="#reviews" onClick={e => { e.preventDefault(); handleScrollTo('reviews'); }}>Đánh giá</a></li>
        <li><a href="#faq" onClick={e => { e.preventDefault(); handleScrollTo('faq'); }}>FAQ</a></li>
      </ul>

      {/* Right actions */}
      <div className="nav-actions">
        {user ? (
          /* ── Logged-in: avatar + dropdown ── */
          <div className="nav-user" ref={userMenuRef}>
            <button
              className="nav-avatar-btn"
              onClick={() => setShowUserMenu(v => !v)}
              id="nav-avatar-btn"
            >
              <span className="nav-avatar-letter" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {user.avatar && user.avatar.startsWith('http') ? (
                  <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  user.avatar
                )}
              </span>
              <span className="nav-avatar-name">{user.fullName.split(' ').slice(-1)[0]}</span>
              <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 2 }}>▼</span>
            </button>

            {showUserMenu && (
              <div className="nav-dropdown" id="nav-dropdown">
                <div className="nav-dropdown-header">
                  <div className="nav-dropdown-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {user.avatar && user.avatar.startsWith('http') ? (
                      <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      user.avatar
                    )}
                  </div>
                  <div>
                    <div className="nav-dropdown-name">{user.fullName}</div>
                    <div className="nav-dropdown-email">{user.email}</div>
                  </div>
                </div>
                <div className="nav-dropdown-divider" />
                <Link to="/account" className="nav-dropdown-item" id="dd-account">
                  <FiUser size={15} /> Tài khoản của tôi
                </Link>
                <button className="nav-dropdown-item" onClick={handleOpenBookingModal} id="dd-book">
                  <FiCalendar size={15} /> Đặt sân ngay
                </button>
                <div className="nav-dropdown-divider" />
                <button className="nav-dropdown-item nav-dropdown-item--danger" onClick={handleLogout} id="dd-logout">
                  <FiLogOut size={15} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── Guest: login + register buttons ── */
          <div className="nav-auth-btns">
            <Link to="/login" className="nav-login-btn" id="nav-login">
              Đăng nhập
            </Link>
            <Link to="/register" className="btn-nav" id="nav-register">
              Đăng ký
            </Link>
          </div>
        )}

        {/* Book button (always visible when logged in) */}
        {user && (
          <button className="btn-nav" onClick={handleOpenBookingModal} id="nav-book-cta">
            ⚡ Đặt sân
          </button>
        )}
      </div>

      {/* Hamburger */}
      <button className="nav-hamburger" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
        {isOpen ? <FiX /> : <FiMenu />}
      </button>
    </nav>
  );
};
