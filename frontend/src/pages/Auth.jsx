import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ════════════════════════════════════════
// CẤU HÌNH PHÍM KẾT NỐI MẠNG XÃ HỘI THẬT (GOOGLE & FACEBOOK CODES)
// ════════════════════════════════════════
// Bạn hãy thay thế 2 dòng bên dưới bằng mã số thực tế của bạn để khách đăng nhập tài khoản thật của họ!
const GOOGLE_CLIENT_ID = '945567071660-iq6eam3g5lmnlfef4mc7n51p5t623g6v.apps.googleusercontent.com';
const FACEBOOK_APP_ID = 'YOUR_FACEBOOK_APP_ID';

/* ─── Shared particle background ─── */
function ParticleBg() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      a: Math.random() * 0.45 + 0.08,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,215,0,${p.a})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={ref} style={{
      position: 'fixed', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
    }} />
  );
}

/* ─── Eye icon ─── */
const EyeIcon = ({ open }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ════════════════════════════════════════
   LOGIN PAGE
   ════════════════════════════════════════ */
export const Login = () => {
  const { login, loginWithSocial } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  // Tự động tải Google SDK và Facebook SDK chính thức
  useEffect(() => {
    // Tải Google Identity SDK
    if (!document.getElementById('google-sdk-script')) {
      const gScript = document.createElement('script');
      gScript.id = 'google-sdk-script';
      gScript.src = 'https://accounts.google.com/gsi/client';
      gScript.async = true;
      gScript.defer = true;
      document.head.appendChild(gScript);
    }

    // Tải Facebook SDK
    if (!document.getElementById('facebook-sdk-script')) {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId      : FACEBOOK_APP_ID === 'YOUR_FACEBOOK_APP_ID' ? '1234567890' : FACEBOOK_APP_ID,
          cookie     : true,
          xfbml      : true,
          version    : 'v18.0'
        });
      };
      const fbScript = document.createElement('script');
      fbScript.id = 'facebook-sdk-script';
      fbScript.src = 'https://connect.facebook.net/vi_VN/sdk.js';
      fbScript.async = true;
      fbScript.defer = true;
      document.head.appendChild(fbScript);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({ email, password });
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
      setShakeKey(k => k + 1);
    }
    setLoading(false);
  };

  // Hàm kích hoạt cửa sổ Google OAuth Đăng nhập tài khoản THẬT của Google
  const handleGoogleLoginReal = () => {
    setError('');

    const isInAppBrowser = /FBAN|FBAV|Instagram|Zalo/i.test(navigator.userAgent);

    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
      setError('⚠️ Vui lòng dán Google Client ID thật của bạn vào đầu file Auth.jsx để mở cửa sổ Google thật!');
      return;
    }

    if (!window.google) {
      if (isInAppBrowser) {
        setError('⚠️ Bạn đang mở trang web trong ứng dụng (Zalo/Facebook). Trình duyệt của Zalo/Facebook KHÔNG cho phép tải thư viện đăng nhập Google vì bảo mật. Vui lòng bấm vào biểu tượng dấu ba chấm (...) ở góc trên bên phải màn hình ➜ chọn "Mở bằng trình duyệt" (Safari/Chrome) để đăng nhập Google mượt mà!');
      } else {
        setError('⚠️ Thư viện Google SDK đang tải hoặc bị chặn bởi bộ chặn quảng cáo. Vui lòng thử lại sau ít giây!');
      }
      return;
    }

    try {
      setLoading(true);
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            // Lấy thông tin tài khoản Google thật từ Google API
            const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
            const googleUser = await userInfoResponse.json();
            
            // Đồng bộ tài khoản Google thật này xuống database PostgreSQL!
            const result = await loginWithSocial({
              provider: 'Google',
              fullName: googleUser.name,
              email: googleUser.email,
              avatar: googleUser.picture
            });

            if (result.success) {
              navigate('/');
            } else {
              setError(result.message);
            }
          } else {
            setError('⚠️ Đăng nhập Google bị từ chối!');
          }
          setLoading(false);
        },
        error_callback: () => {
          setError('⚠️ Lỗi khi mở cửa sổ đăng nhập Google.');
          setLoading(false);
        }
      });
      tokenClient.requestAccessToken();
    } catch (err) {
      console.error(err);
      setError('⚠️ Lỗi khởi động đăng nhập Google.');
      setLoading(false);
    }
  };

  // Hàm kích hoạt cửa sổ Facebook OAuth Đăng nhập tài khoản THẬT của Facebook
  const handleFacebookLoginReal = () => {
    setError('');

    if (FACEBOOK_APP_ID === 'YOUR_FACEBOOK_APP_ID') {
      setError('⚠️ Vui lòng dán Facebook App ID thật của bạn vào đầu file Auth.jsx để mở cửa sổ Facebook thật!');
      return;
    }

    if (!window.FB) {
      setError('⚠️ Thư viện Facebook SDK đang tải, vui lòng thử lại sau ít giây!');
      return;
    }

    setLoading(true);
    window.FB.login((response) => {
      if (response.authResponse) {
        // Lấy thông tin cá nhân thật từ Facebook API
        window.FB.api('/me', { fields: 'name, email, picture.type(large)' }, async (fbUser) => {
          if (fbUser && fbUser.email) {
            const avatarUrl = fbUser.picture && fbUser.picture.data ? fbUser.picture.data.url : '';
            
            // Đồng bộ tài khoản Facebook thật này xuống database PostgreSQL!
            const result = await loginWithSocial({
              provider: 'Facebook',
              fullName: fbUser.name,
              email: fbUser.email,
              avatar: avatarUrl
            });

            if (result.success) {
              navigate('/');
            } else {
              setError(result.message);
            }
          } else {
            setError('⚠️ Không thể lấy email từ tài khoản Facebook của bạn.');
          }
          setLoading(false);
        });
      } else {
        setError('⚠️ Đăng nhập Facebook bị hủy bỏ!');
        setLoading(false);
      }
    }, { scope: 'public_profile,email' });
  };

  return (
    <div className="auth-page">
      <ParticleBg />

      {/* Decorative blobs */}
      <div className="auth-blob auth-blob--1" />
      <div className="auth-blob auth-blob--2" />

      <div className="auth-card" key={shakeKey} style={shakeKey > 0 ? { animation: 'authShake 0.4s ease' } : {}}>
        {/* Logo */}
        <Link to="/" className="auth-logo">
          <span className="auth-logo-icon">🏸</span>
          <span className="auth-logo-text">SmashCourt</span>
        </Link>

        <h1 className="auth-title">Chào mừng trở lại</h1>
        <p className="auth-sub">Đăng nhập để quản lý lịch đặt sân của bạn</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉️</span>
              <input
                id="login-email"
                type="email"
                className="auth-input"
                placeholder="ten@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label">Mật khẩu</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔑</span>
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button type="button" className="auth-eye" onClick={() => setShowPw(v => !v)}>
                <EyeIcon open={showPw} />
              </button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="auth-error">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : '⚡ Đăng nhập'}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider"><span>hoặc</span></div>

        {/* Social Buttons */}
        <div className="auth-socials">
          <button type="button" className="auth-social-btn" onClick={handleGoogleLoginReal}>
            <span style={{ fontSize: 18 }}>🇬</span> Google thật
          </button>
          <button type="button" className="auth-social-btn" onClick={handleFacebookLoginReal}>
            <span style={{ fontSize: 18 }}>📘</span> FB thật
          </button>
        </div>

        {/* Premium In-App Browser Guide Notice */}
        {/FBAN|FBAV|Instagram|Zalo/i.test(navigator.userAgent) && (
          <div style={{
            background: 'rgba(255, 215, 0, 0.05)',
            border: '1px dashed rgba(255, 215, 0, 0.25)',
            borderRadius: '8px',
            padding: '10px 12px',
            marginTop: '14px',
            fontSize: '11px',
            color: 'var(--gold)',
            lineHeight: '1.45',
            textAlign: 'center'
          }}>
            💡 <b>Mẹo đăng nhập:</b> Bạn đang dùng trình duyệt Zalo/Facebook. Hãy nhấn dấu <b>(...)</b> ở góc trên bên phải màn hình ➜ chọn <b>"Mở bằng trình duyệt"</b> để đăng nhập tài khoản Google/Facebook nhanh nhất!
          </div>
        )}

        <p className="auth-switch">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="auth-switch-link">Đăng ký ngay →</Link>
        </p>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   REGISTER PAGE
   ════════════════════════════════════════ */
export const Register = () => {
  const { register, loginWithSocial } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  // Tự động tải SDK mạng xã hội
  useEffect(() => {
    if (!document.getElementById('google-sdk-script')) {
      const gScript = document.createElement('script');
      gScript.id = 'google-sdk-script';
      gScript.src = 'https://accounts.google.com/gsi/client';
      gScript.async = true;
      gScript.defer = true;
      document.head.appendChild(gScript);
    }
    if (!document.getElementById('facebook-sdk-script')) {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId      : FACEBOOK_APP_ID === 'YOUR_FACEBOOK_APP_ID' ? '1234567890' : FACEBOOK_APP_ID,
          cookie     : true,
          xfbml      : true,
          version    : 'v18.0'
        });
      };
      const fbScript = document.createElement('script');
      fbScript.id = 'facebook-sdk-script';
      fbScript.src = 'https://connect.facebook.net/vi_VN/sdk.js';
      fbScript.async = true;
      fbScript.defer = true;
      document.head.appendChild(fbScript);
    }
  }, []);

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Tốt', 'Rất mạnh'][strength];
  const strengthColor = ['', '#ff6b6b', '#FFA500', '#00FF88', '#00FFFF'][strength];

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.fullName.trim()) { setError('Vui lòng nhập họ và tên.'); setShakeKey(k => k + 1); return; }
    if (form.password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự.'); setShakeKey(k => k + 1); return; }
    if (form.password !== form.confirm) { setError('Mật khẩu xác nhận không khớp.'); setShakeKey(k => k + 1); return; }

    setLoading(true);

    const result = await register({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      password: form.password
    });

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
      setShakeKey(k => k + 1);
    }
    setLoading(false);
  };

  const handleGoogleLoginReal = () => {
    setError('');

    const isInAppBrowser = /FBAN|FBAV|Instagram|Zalo/i.test(navigator.userAgent);

    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
      setError('⚠️ Vui lòng dán Google Client ID thật của bạn vào đầu file Auth.jsx để mở cửa sổ Google thật!');
      return;
    }

    if (!window.google) {
      if (isInAppBrowser) {
        setError('⚠️ Bạn đang mở trang web trong ứng dụng (Zalo/Facebook). Trình duyệt của Zalo/Facebook KHÔNG cho phép tải thư viện đăng nhập Google vì bảo mật. Vui lòng bấm vào biểu tượng dấu ba chấm (...) ở góc trên bên phải màn hình ➜ chọn "Mở bằng trình duyệt" (Safari/Chrome) để đăng nhập Google mượt mà!');
      } else {
        setError('⚠️ Thư viện Google SDK đang tải hoặc bị chặn bởi bộ chặn quảng cáo. Vui lòng thử lại sau ít giây!');
      }
      return;
    }

    try {
      setLoading(true);
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
            const googleUser = await userInfoResponse.json();
            
            const result = await loginWithSocial({
              provider: 'Google',
              fullName: googleUser.name,
              email: googleUser.email,
              avatar: googleUser.picture
            });

            if (result.success) {
              navigate('/');
            } else {
              setError(result.message);
            }
          } else {
            setError('⚠️ Đăng nhập Google bị từ chối!');
          }
          setLoading(false);
        },
        error_callback: () => {
          setError('⚠️ Lỗi khi mở cửa sổ đăng nhập Google.');
          setLoading(false);
        }
      });
      tokenClient.requestAccessToken();
    } catch (err) {
      console.error(err);
      setError('⚠️ Lỗi khởi động đăng nhập Google.');
      setLoading(false);
    }
  };

  const handleFacebookLoginReal = () => {
    setError('');

    if (FACEBOOK_APP_ID === 'YOUR_FACEBOOK_APP_ID') {
      setError('⚠️ Vui lòng dán Facebook App ID thật của bạn vào đầu file Auth.jsx để mở cửa sổ Facebook thật!');
      return;
    }

    if (!window.FB) {
      setError('⚠️ Thư viện Facebook SDK đang tải, vui lòng thử lại sau ít giây!');
      return;
    }

    setLoading(true);
    window.FB.login((response) => {
      if (response.authResponse) {
        window.FB.api('/me', { fields: 'name, email, picture.type(large)' }, async (fbUser) => {
          if (fbUser && fbUser.email) {
            const avatarUrl = fbUser.picture && fbUser.picture.data ? fbUser.picture.data.url : '';
            
            const result = await loginWithSocial({
              provider: 'Facebook',
              fullName: fbUser.name,
              email: fbUser.email,
              avatar: avatarUrl
            });

            if (result.success) {
              navigate('/');
            } else {
              setError(result.message);
            }
          } else {
            setError('⚠️ Không thể lấy email từ tài khoản Facebook.');
          }
          setLoading(false);
        });
      } else {
        setError('⚠️ Đăng nhập Facebook bị hủy!');
        setLoading(false);
      }
    }, { scope: 'public_profile,email' });
  };

  return (
    <div className="auth-page">
      <ParticleBg />
      <div className="auth-blob auth-blob--1" />
      <div className="auth-blob auth-blob--2" />

      <div className="auth-card auth-card--wide" key={shakeKey} style={shakeKey > 0 ? { animation: 'authShake 0.4s ease' } : {}}>
        <Link to="/" className="auth-logo">
          <span className="auth-logo-icon">🏸</span>
          <span className="auth-logo-text">SmashCourt</span>
        </Link>

        <h1 className="auth-title">Tạo tài khoản mới</h1>
        <p className="auth-sub">Tham gia SmashCourt để đặt sân dễ dàng hơn bao giờ hết</p>

        <form className="auth-form auth-form--grid" onSubmit={handleSubmit} noValidate>
          {/* Full name */}
          <div className="auth-field auth-field--full">
            <label className="auth-label">Họ & tên <span className="auth-required">*</span></label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">👤</span>
              <input id="reg-name" type="text" className="auth-input"
                placeholder="Nguyễn Văn A"
                value={form.fullName} onChange={set('fullName')} required />
            </div>
          </div>

          {/* Email */}
          <div className="auth-field">
            <label className="auth-label">Email <span className="auth-required">*</span></label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉️</span>
              <input id="reg-email" type="email" className="auth-input"
                placeholder="ten@email.com"
                value={form.email} onChange={set('email')} required autoComplete="email" />
            </div>
          </div>

          {/* Phone */}
          <div className="auth-field">
            <label className="auth-label">Số điện thoại</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">📱</span>
              <input id="reg-phone" type="tel" className="auth-input"
                placeholder="0905 xxx xxx"
                value={form.phone} onChange={set('phone')} />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label">Mật khẩu <span className="auth-required">*</span></label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔑</span>
              <input id="reg-pw" type={showPw ? 'text' : 'password'} className="auth-input"
                placeholder="Ít nhất 6 ký tự"
                value={form.password} onChange={set('password')} required autoComplete="new-password" />
              <button type="button" className="auth-eye" onClick={() => setShowPw(v => !v)}>
                <EyeIcon open={showPw} />
              </button>
            </div>
            {/* Strength bar */}
            {form.password && (
              <div className="auth-strength">
                <div className="auth-strength-bars">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="auth-strength-bar"
                      style={{ background: i <= strength ? strengthColor : 'rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
                <span className="auth-strength-label" style={{ color: strengthColor }}>{strengthLabel}</span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="auth-field">
            <label className="auth-label">Xác nhận mật khẩu <span className="auth-required">*</span></label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input id="reg-cpw" type={showCPw ? 'text' : 'password'} className="auth-input"
                placeholder="Nhập lại mật khẩu"
                value={form.confirm} onChange={set('confirm')} required autoComplete="new-password" />
              <button type="button" className="auth-eye" onClick={() => setShowCPw(v => !v)}>
                <EyeIcon open={showCPw} />
              </button>
            </div>
            {/* Match indicator */}
            {form.confirm && (
              <div className="auth-match" style={{ color: form.password === form.confirm ? '#00FF88' : '#ff6b6b' }}>
                {form.password === form.confirm ? '✓ Mật khẩu khớp' : '✗ Mật khẩu chưa khớp'}
              </div>
            )}
          </div>

          {/* Terms */}
          <div className="auth-field auth-field--full auth-terms">
            <label className="auth-checkbox-label">
              <input type="checkbox" required className="auth-checkbox" id="reg-terms" />
              <span>Tôi đồng ý với <a href="#" className="auth-switch-link">Điều khoản dịch vụ</a> và <a href="#" className="auth-switch-link">Chính sách bảo mật</a></span>
            </label>
          </div>

          {/* Error */}
          {error && <div className="auth-error auth-field--full">⚠️ {error}</div>}

          <button type="submit" className="auth-submit auth-field--full" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : '🚀 Tạo tài khoản'}
          </button>
        </form>

        <div className="auth-divider"><span>hoặc đăng ký với</span></div>

        <div className="auth-socials">
          <button type="button" className="auth-social-btn" onClick={handleGoogleLoginReal}>
            <span style={{ fontSize: 18 }}>🇬</span> Google thật
          </button>
          <button type="button" className="auth-social-btn" onClick={handleFacebookLoginReal}>
            <span style={{ fontSize: 18 }}>📘</span> FB thật
          </button>
        </div>

        {/* Premium In-App Browser Guide Notice */}
        {/FBAN|FBAV|Instagram|Zalo/i.test(navigator.userAgent) && (
          <div style={{
            background: 'rgba(255, 215, 0, 0.05)',
            border: '1px dashed rgba(255, 215, 0, 0.25)',
            borderRadius: '8px',
            padding: '10px 12px',
            marginTop: '14px',
            fontSize: '11px',
            color: 'var(--gold)',
            lineHeight: '1.45',
            textAlign: 'center'
          }}>
            💡 <b>Mẹo đăng ký:</b> Bạn đang dùng trình duyệt Zalo/Facebook. Hãy nhấn dấu <b>(...)</b> ở góc trên bên phải màn hình ➜ chọn <b>"Mở bằng trình duyệt"</b> để đăng ký tài khoản Google/Facebook nhanh nhất!
          </div>
        )}

        <p className="auth-switch">
          Đã có tài khoản?{' '}
          <Link to="/login" className="auth-switch-link">Đăng nhập →</Link>
        </p>
      </div>
    </div>
  );
};
