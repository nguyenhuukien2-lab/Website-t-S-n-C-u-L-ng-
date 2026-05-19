import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────
// DATA
// ─────────────────────────────────────────
const COURTS = [
  {
    id: 'A', name: 'Sân A', type: 'Standard', color: '#00FF88',
    desc: 'Sàn gỗ Epoxy, đèn LED 500lux, quạt trần',
    prices: { early: 55000, normal: 75000, peak: 95000 },
  },
  {
    id: 'B', name: 'Sân B', type: 'Standard', color: '#00CFFF',
    desc: 'Sàn gỗ Epoxy, đèn LED 600lux, quạt công nghiệp',
    prices: { early: 55000, normal: 75000, peak: 95000 },
  },
  {
    id: 'C', name: 'Sân C', type: 'Premium', color: '#FFD700',
    desc: 'Sàn PVC Yonex nhập khẩu, đèn 800lux, máy lạnh',
    prices: { early: 85000, normal: 120000, peak: 155000 },
  },
  {
    id: 'D', name: 'Sân D', type: 'Premium', color: '#FF9500',
    desc: 'Sàn PVC Yonex, máy lạnh, loa âm thanh',
    prices: { early: 85000, normal: 120000, peak: 155000 },
  },
  {
    id: 'E', name: 'Sân E', type: 'VIP', color: '#CC66FF',
    desc: 'Sàn BWF chuẩn quốc tế, phòng thay đồ riêng, camera',
    prices: { early: 120000, normal: 175000, peak: 220000 },
  },
];

const HOURS = Array.from({ length: 14 }, (_, i) => 5 + i); // 05:00 → 18:00

const isPeak  = (h) => h >= 17 && h <= 21;
const isEarly = (h) => h < 8;

const getPrice = (c, h) => {
  if (isEarly(h)) return c.prices.early;
  if (isPeak(h))  return c.prices.peak;
  return c.prices.normal;
};

const fmt = (n) => (n >= 1000 ? Math.round(n / 1000) + 'K' : String(n));

// Generate stable random booked slots per court
function generateBooked() {
  const booked = {};
  const counts = [4, 5, 3, 6, 2];
  COURTS.forEach((c, ci) => {
    const arr = new Array(14).fill(false);
    const idxs = [];
    while (idxs.length < counts[ci]) {
      const i = Math.floor(Math.random() * 14);
      if (!idxs.includes(i)) idxs.push(i);
    }
    idxs.forEach((i) => (arr[i] = true));
    booked[c.id] = arr;
  });
  return booked;
}

// ─────────────────────────────────────────
// MODAL COMPONENT (WITH INTERACTIVE PAYMENT & REMINDERS)
// ─────────────────────────────────────────
function BookingModal({ selected, booked, onClose, onSuccess, bookingDate }) {
  const [step, setStep] = useState('confirm'); // 'confirm' | 'payment' | 'success'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [guests, setGuests] = useState('2 người');
  const [payment, setPayment] = useState('💳 Chuyển khoản ngân hàng');
  const [note, setNote] = useState('');
  const [code, setCode] = useState('');

  // Reminders configurations
  const [notifyZalo, setNotifyZalo] = useState(true);
  const [notifySMS, setNotifySMS] = useState(true);

  // Payment states
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [payStatus, setPayStatus] = useState('waiting'); // 'waiting' | 'verifying' | 'success'

  const keys   = Object.keys(selected);
  const total  = keys.reduce((s, k) => s + selected[k].price, 0);
  const groups = {};
  keys.forEach((k) => {
    const { court, h, price } = selected[k];
    if (!groups[court.id]) groups[court.id] = { court, items: [] };
    groups[court.id].items.push({ h, price });
  });

  // Hàm lưu đặt lịch xuống database PostgreSQL thật
  const saveBookingToDatabase = async (newCode) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const d = bookingDate ? new Date(bookingDate) : new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      for (const key of keys) {
        const item = selected[key];
        const startH = `${String(item.h).padStart(2, '0')}:00`;
        const endH = `${String(item.h + 1).padStart(2, '0')}:00`;
        
        // Ánh xạ ID sân từ chữ cái sang ID số của database
        const courtIdMap = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5 };
        const mappedCourtId = courtIdMap[item.court.id] || 1;

        await fetch(`${API_URL}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courtId: mappedCourtId,
            courtName: item.court.name,
            date: dateString,
            startTime: startH,
            endTime: endH,
            customerName: name,
            customerPhone: phone,
            customerEmail: email,
            paymentMethod: payment,
            depositAmount: item.price,
            notes: note ? `${note} (Mã cọc: ${newCode})` : `Mã cọc: ${newCode}`
          })
        });
      }
      console.log('✅ Đã lưu tất cả lịch đặt sân vào database PostgreSQL thành công!');
    } catch (err) {
      console.error('❌ Lỗi khi đồng bộ đặt sân tới database:', err.message);
    }
  };

  const handleConfirmForm = (e) => {
    e.preventDefault();
    const newCode = 'SC' + (Math.floor(Math.random() * 90000) + 10000);
    setCode(newCode);

    if (payment === '💵 Tiền mặt tại sân') {
      // Cash payment bypasses interactive gateway
      setPayStatus('success');
      saveBookingToDatabase(newCode); // Lưu database ngay khi chọn trả tiền mặt
      setTimeout(() => {
        setStep('success');
        onSuccess && onSuccess();
      }, 1500);
    } else {
      setStep('payment');
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (step !== 'payment') return;
    const t = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  // Automated bank confirmation progression simulator
  useEffect(() => {
    if (step !== 'payment') return;
    
    // Step A: Verifying transaction after 4 seconds
    const check1 = setTimeout(() => {
      setPayStatus('verifying');
    }, 4000);

    // Step B: Match confirmed after 7.5 seconds
    const check2 = setTimeout(() => {
      setPayStatus('success');
    }, 7500);

    // Step C: Redirect to success ticket screen after 9 seconds
    const check3 = setTimeout(() => {
      saveBookingToDatabase(code); // Lưu database ngay khi thanh toán quét QR thành công
      setStep('success');
      onSuccess && onSuccess();
    }, 9000);

    return () => {
      clearTimeout(check1);
      clearTimeout(check2);
      clearTimeout(check3);
    };
  }, [step, onSuccess, code]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  return (
    <div className="sc-overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sc-modal" style={{ maxWidth: step === 'payment' ? '540px' : '480px' }}>
        <button className="sc-modal-close" onClick={onClose}>×</button>

        {/* STEP 1: FILL FORM & SELECT METHODS */}
        {step === 'confirm' && (
          <>
            <h3 className="sc-modal-title">🏸 Xác nhận đặt sân</h3>
            <p className="sc-modal-sub">Kiểm tra thông tin và điền chi tiết để đặt giữ chỗ.</p>

            <div className="sc-bk-items">
              {Object.values(groups).map(({ court, items }) =>
                items.map(({ h, price }) => (
                  <div className="sc-bk-row" key={`${court.id}-${h}`}>
                    <span className="sc-bk-label">
                      🏸 {court.name} · {h}:00 – {h + 1}:00 {isPeak(h) ? '⚡' : ''}
                    </span>
                    <span className="sc-bk-val">{price.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))
              )}
            </div>

            <div className="sc-bk-total">
              <span className="sc-bk-total-label">Tổng cọc giữ sân ({keys.length} giờ)</span>
              <span className="sc-bk-total-val">{total.toLocaleString('vi-VN')}đ</span>
            </div>

            <form onSubmit={handleConfirmForm}>
              <div className="sc-form-row">
                <div className="sc-form-group">
                  <label>Họ &amp; tên *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A" required />
                </div>
                <div className="sc-form-group">
                  <label>Số điện thoại *</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)}
                    type="tel" placeholder="0905 xxx xxx" required />
                </div>
              </div>
              <div className="sc-form-row">
                <div className="sc-form-group">
                  <label>Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)}
                    type="email" placeholder="email@example.com" />
                </div>
                <div className="sc-form-group">
                  <label>Số người</label>
                  <select value={guests} onChange={(e) => setGuests(e.target.value)}>
                    <option>2 người</option>
                    <option>4 người</option>
                    <option>6 người</option>
                  </select>
                </div>
              </div>

              <div className="sc-form-group">
                <label>Phương thức cọc Online</label>
                <select value={payment} onChange={(e) => setPayment(e.target.value)}>
                  <option>💳 Chuyển khoản ngân hàng</option>
                  <option>📱 MoMo</option>
                  <option>💚 ZaloPay</option>
                  <option>💵 Tiền mặt tại sân</option>
                </select>
              </div>

              <div className="sc-form-group">
                <label>Ghi chú thêm</label>
                <input value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: cần thuê thêm vợt..." />
              </div>

              {/* Reminders Selection */}
              <div className="sc-reminders-box">
                <div className="sc-reminders-title">🔔 Đăng ký gửi nhắc lịch tự động (Miễn phí)</div>
                <div className="sc-reminders-grid">
                  <label className="sc-reminder-chk">
                    <input type="checkbox" checked={notifyZalo} onChange={(e) => setNotifyZalo(e.target.checked)} />
                    <span>Tin nhắn Zalo OA</span>
                  </label>
                  <label className="sc-reminder-chk">
                    <input type="checkbox" checked={notifySMS} onChange={(e) => setNotifySMS(e.target.checked)} />
                    <span>SMS Brandname</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="sc-btn-pay">
                Tiến hành thanh toán cọc · {total.toLocaleString('vi-VN')}đ
              </button>
            </form>
          </>
        )}

        {/* STEP 2: DYNAMIC GATEWAYS AND QR CODES */}
        {step === 'payment' && (
          <div className="sc-payment-gateway">
            <div className="sc-pg-header">
              <h4>🛡️ Cổng Thanh Toán An Toàn SmashCourt</h4>
              <p>Mã hóa giao dịch tự động</p>
            </div>

            <div className="sc-pg-timer">
              Hiệu lực quét mã: <span>{formatTime(timeLeft)}</span>
            </div>

            <div className="sc-pg-content">
              {/* Left Column: QR Code Visualizer */}
              <div className="sc-pg-qr-wrap">
                <div className={`sc-pg-qr-border ${payment.includes('MoMo') ? 'momo' : payment.includes('ZaloPay') ? 'zalopay' : 'bank'}`}>
                  {/* Decorative High-tech mock QR code via SVG */}
                  <svg viewBox="0 0 200 200" className="sc-mock-qr-svg">
                    <rect x="0" y="0" width="200" height="200" fill="#0A1628" rx="8" />
                    
                    {/* Corners anchors */}
                    <rect x="15" y="15" width="40" height="40" fill="none" stroke="var(--gold)" strokeWidth="8" />
                    <rect x="25" y="25" width="20" height="20" fill="var(--gold)" />
                    
                    <rect x="145" y="15" width="40" height="40" fill="none" stroke="var(--gold)" strokeWidth="8" />
                    <rect x="155" y="25" width="20" height="20" fill="var(--gold)" />
                    
                    <rect x="15" y="145" width="40" height="40" fill="none" stroke="var(--gold)" strokeWidth="8" />
                    <rect x="25" y="155" width="20" height="20" fill="var(--gold)" />

                    {/* QR Code Pixel Matrix Dots Mock */}
                    <path d="M 70 20 H 130 M 70 35 H 100 M 115 35 H 130 M 70 50 H 90 M 105 50 H 120 M 20 70 V 130 M 35 70 H 175 M 50 85 H 160 M 20 100 H 60 M 80 100 H 180 M 35 115 H 100 M 120 115 H 165 M 70 130 H 130 M 70 145 H 90 M 105 145 H 125 M 70 160 H 130 M 70 175 H 100" 
                          stroke="rgba(255, 255, 255, 0.4)" strokeWidth="6" strokeLinecap="round" fill="none" />
                    
                    {/* Logo Overlay center */}
                    <rect x="80" y="80" width="40" height="40" fill="#050A14" rx="6" stroke="var(--gold)" strokeWidth="2" />
                    <text x="100" y="105" fontSize="22" textAnchor="middle" fill="var(--gold)">🏸</text>
                  </svg>
                  
                  <div className="sc-pg-qr-brand">
                    {payment.includes('MoMo') ? 'MOMO MULTIPAY' : payment.includes('ZaloPay') ? 'ZALOPAY QR' : 'VIETQR SMART'}
                  </div>
                </div>
              </div>

              {/* Right Column: Information details */}
              <div className="sc-pg-info">
                {payment.includes('Chuyển khoản ngân hàng') ? (
                  <div className="sc-bank-details">
                    <div className="sc-bank-item">
                      <span>Ngân hàng</span>
                      <b>Techcombank (TCB)</b>
                    </div>
                    <div className="sc-bank-item">
                      <span>Số tài khoản</span>
                      <b style={{ color: 'var(--gold)' }}>1903 5869 1120 18</b>
                    </div>
                    <div className="sc-bank-item">
                      <span>Tên tài khoản</span>
                      <b>CTCP ĐẦU TƯ SMASHCOURT VN</b>
                    </div>
                    <div className="sc-bank-item">
                      <span>Số tiền cọc</span>
                      <b style={{ color: 'var(--green)' }}>{total.toLocaleString('vi-VN')}đ</b>
                    </div>
                    <div className="sc-bank-item">
                      <span>Nội dung chuyển khoản</span>
                      <b style={{ background: 'rgba(255, 215, 0, 0.1)', color: 'var(--gold)', padding: '2px 8px', borderRadius: '4px' }}>
                        SMASHCOURT {code}
                      </b>
                    </div>
                  </div>
                ) : (
                  <div className="sc-wallet-details">
                    <h5>Thanh toán qua ví {payment.split(' ')[1]}</h5>
                    <p style={{ color: 'var(--muted)', fontSize: '11px', lineHeight: '1.5' }}>
                      1. Mở ứng dụng ví điện tử {payment.split(' ')[1]} trên điện thoại.<br />
                      2. Chọn tính năng "Quét mã QR".<br />
                      3. Quét mã QR bên cạnh và hoàn tất giao dịch.
                    </p>
                    <div className="sc-wallet-amount">
                      Số tiền cọc cần thanh toán: <br />
                      <span>{total.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status bar and progress indicators */}
            <div className="sc-pg-status-box">
              {payStatus === 'waiting' && (
                <div className="sc-pg-status waiting">
                  <span className="sc-pg-spinner" />
                  <span>Đang chờ giao dịch từ bạn...</span>
                </div>
              )}
              {payStatus === 'verifying' && (
                <div className="sc-pg-status verifying">
                  <span className="sc-pg-spinner fast" />
                  <span style={{ color: 'var(--gold)' }}>Đã nhận tín hiệu chuyển tiền! Đang đối khớp...</span>
                </div>
              )}
              {payStatus === 'success' && (
                <div className="sc-pg-status success">
                  <span className="sc-pg-check">✓</span>
                  <span style={{ color: 'var(--green)' }}>Thanh toán thành công! Sân đã được giữ.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS BILL TICKET */}
        {step === 'success' && (
          <div className="sc-success-screen">
            <div className="sc-success-icon">🏸</div>
            <div className="sc-success-tag">Thanh toán &amp; Giữ sân thành công!</div>
            <div className="sc-success-code">{code}</div>
            
            <p className="sc-success-msg">
              Xin chào <b>{name || 'Khách đặt'}</b>!<br />
              Hệ thống đã nhận đặt <b style={{ color: 'var(--gold)' }}>{keys.length} khung giờ</b> của bạn với tổng tiền cọc <b style={{ color: 'var(--gold)' }}>{total.toLocaleString('vi-VN')}đ</b>.<br />
            </p>

            {/* Automated remind notification system report status */}
            <div className="sc-remind-status-card">
              <div className="sc-rsc-title">🔔 Trạng thái thông báo &amp; nhắc lịch tự động</div>
              
              {notifyZalo && (
                <div className="sc-rsc-item">
                  <span className="sc-rsc-tag zalo">💬 ZALO OA</span>
                  <span className="sc-rsc-detail">
                    Đã đặt lịch gửi lời nhắc thi đấu trước giờ chơi <b>2 tiếng</b> đến Zalo của SĐT <b>{phone}</b>.
                  </span>
                </div>
              )}

              {notifySMS && (
                <div className="sc-rsc-item">
                  <span className="sc-rsc-tag sms">📱 SMS BRANDNAME</span>
                  <span className="sc-rsc-detail">
                    Lên lịch nhắn xác nhận giao dịch cọc thành công ngay lập tức &amp; nhắc lịch thi đấu tự động.
                  </span>
                </div>
              )}

              {!notifyZalo && !notifySMS && (
                <div className="sc-rsc-item" style={{ justifyContent: 'center', color: 'var(--muted)' }}>
                  🚫 Không đăng ký nhận tin nhắn nhắc lịch tự động.
                </div>
              )}
            </div>

            <div className="sc-success-footer-note">
              Vui lòng đem mã đặt sân <b>{code}</b> đến quầy để check-in xuống sân đúng giờ.
            </div>

            <button className="sc-btn-pay" onClick={onClose}>Hoàn tất 🎉</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
export const Courts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // stable booked data with stateful live simulator
  const [liveBooked, setLiveBooked] = useState(() => generateBooked());
  const booked = liveBooked;
  const [toaster, setToaster] = useState(null);

  const [selected, setSelected] = useState({});      // key → {court,idx,h,price}
  const [activeCourt, setActiveCourt] = useState('A');
  const [dateOffset, setDateOffset]   = useState(0);
  const [activeDay, setActiveDay]     = useState(0);
  const [showModal, setShowModal]     = useState(false);
  const scheduleRefs = useRef({});

  // Background real-time booking simulation (every 14 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick random court & slot index
      const randCourt = COURTS[Math.floor(Math.random() * COURTS.length)];
      const randSlotIdx = Math.floor(Math.random() * 14);
      const slotKey = `${randCourt.id}_${randSlotIdx}`;

      // If slot is currently free and not selected by user
      if (!liveBooked[randCourt.id][randSlotIdx] && !selected[slotKey]) {
        setLiveBooked(prev => {
          const next = { ...prev };
          const newArr = [...next[randCourt.id]];
          newArr[randSlotIdx] = true;
          next[randCourt.id] = newArr;
          return next;
        });

        // Set high-tech toast notification
        const startHour = 5 + randSlotIdx;
        const timeStr = `${startHour}:00 – ${startHour + 1}:00`;
        setToaster({
          id: Math.random(),
          message: `⚡ Khách vừa đặt ${randCourt.name} · ${timeStr} (Thời gian thực)`
        });
      }
    }, 14000);

    return () => clearInterval(interval);
  }, [liveBooked, selected]);

  // Clear toast automatically after 4 seconds
  useEffect(() => {
    if (toaster) {
      const t = setTimeout(() => setToaster(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toaster]);

  // Kiểm tra nếu người dùng chưa đăng nhập thì hiển thị yêu cầu đăng ký/đăng nhập
  if (!user) {
    return (
      <div className="sc-page sc-auth-prompt-page" style={{ position: 'relative', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div className="sc-grid-bg" />
        
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(0, 255, 136, 0.15) 0%, transparent 70%)',
          top: '10%',
          left: '20%',
          zIndex: 1,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(204, 102, 255, 0.1) 0%, transparent 70%)',
          bottom: '10%',
          right: '10%',
          zIndex: 1,
          pointerEvents: 'none'
        }} />

        {/* Glass Card */}
        <div className="sc-auth-card" style={{
          position: 'relative',
          zIndex: 10,
          background: 'rgba(10, 22, 40, 0.7)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '48px 32px',
          maxWidth: '480px',
          width: '90%',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🏸</div>
          
          <h2 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#FFFFFF',
            marginBottom: '16px',
            letterSpacing: '-0.5px'
          }}>
            Yêu Cầu <span style={{
              background: 'linear-gradient(90deg, #00FF88, #00CFFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Đăng Nhập</span>
          </h2>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.65)',
            fontSize: '15px',
            lineHeight: '1.6',
            marginBottom: '36px'
          }}>
            Bạn cần đăng nhập tài khoản thành viên SmashCourt để xem thời gian trống, biểu giá và tiến hành đặt giữ sân trực tuyến.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/login" style={{
              background: 'linear-gradient(135deg, #00FF88 0%, #00CFFF 100%)',
              color: '#050A14',
              fontWeight: '700',
              fontSize: '15px',
              padding: '14px 28px',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 255, 136, 0.3)',
              display: 'inline-block'
            }}>
              🔑 Đăng nhập ngay
            </Link>
            
            <Link to="/register" style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#FFFFFF',
              fontWeight: '600',
              fontSize: '15px',
              padding: '14px 28px',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'inline-block'
            }}>
              📝 Đăng ký tài khoản mới
            </Link>
          </div>

          <div style={{ marginTop: '24px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
            💡 Đăng ký chỉ mất 30 giây và hoàn toàn miễn phí!
          </div>
        </div>
      </div>
    );
  }

  // ── Date tabs ─────────────────────────────
  const buildDates = () => {
    const now  = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i + dateOffset * 7);
      const label =
        i === 0 && dateOffset === 0
          ? 'Hôm nay'
          : d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
      days.push({ label, d });
    }
    return days;
  };
  const dates = buildDates();

  // ── Slot toggle ───────────────────────────
  const toggleSlot = useCallback((court, idx, h, price) => {
    const key = `${court.id}_${idx}`;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = { court, idx, h, price };
      return next;
    });
  }, []);

  const clearAll = () => setSelected({});

  // ── Derived panel data ─────────────────────
  const selectedKeys = Object.keys(selected);
  const totalPrice   = selectedKeys.reduce((s, k) => s + selected[k].price, 0);
  const panelGroups  = {};
  selectedKeys.forEach((k) => {
    const { court, h } = selected[k];
    if (!panelGroups[court.id]) panelGroups[court.id] = [];
    panelGroups[court.id].push(h + ':00');
  });
  const panelParts = Object.entries(panelGroups).map(([id, times]) => `${id}: ${times.join(', ')}`);

  // ── Open modal ────────────────────────────
  const openModal = () => {
    if (!selectedKeys.length) { alert('Vui lòng chọn ít nhất một khung giờ!'); return; }
    setShowModal(true);
  };

  // Scroll to court section in schedule
  const scrollToCourt = (id) => {
    setActiveCourt(id);
    scheduleRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // After success: clear selection & close modal
  const handleSuccess = () => {};
  const handleModalClose = () => {
    setShowModal(false);
    // If success screen was shown, also clear
    clearAll();
  };

  // ── SIDEBAR ───────────────────────────────
  const SidebarItem = ({ c }) => {
    const bookedCount = booked[c.id].filter(Boolean).length;
    const free        = 14 - bookedCount;
    const selCount    = selectedKeys.filter((k) => k.startsWith(c.id + '_')).length;
    const statusClass = free === 0 ? 'badge-full' : free <= 3 ? 'badge-busy' : 'badge-open';
    const statusLabel = free === 0 ? 'Hết sân'  : free <= 3  ? 'Gần đầy'   : 'Còn sân';

    return (
      <div
        className={`sc-court-item${c.id === activeCourt ? ' active' : ''}`}
        onClick={() => scrollToCourt(c.id)}
      >
        <div className="sc-ci-header">
          <div className="sc-ci-name" style={{ color: c.color }}>{c.name}</div>
          <div className={`sc-ci-badge ${statusClass}`}>{statusLabel}</div>
        </div>
        <div className="sc-ci-type">{c.type} · {c.desc.split(',')[0]}</div>
        <div className="sc-ci-price">
          {fmt(c.prices.normal)}<span>đ / giờ</span>
        </div>
        <div className="sc-ci-mini">
          {booked[c.id].map((_, i) => {
            const k = `${c.id}_${i}`;
            if (selected[k])       return <div key={i} className="sc-ms sc-ms-s" />;
            if (booked[c.id][i])   return <div key={i} className="sc-ms sc-ms-b" />;
            return <div key={i} className="sc-ms sc-ms-a" />;
          })}
        </div>
        {selCount > 0 && (
          <div className="sc-ci-sel">✓ Đã chọn {selCount} giờ</div>
        )}
      </div>
    );
  };

  // ── COURT SECTION ─────────────────────────
  const CourtSection = ({ c }) => {
    const bookedCount = booked[c.id].filter(Boolean).length;
    const free        = 14 - bookedCount;
    const selKeys     = selectedKeys.filter((k) => k.startsWith(c.id + '_'));
    const selTotal    = selKeys.reduce((s, k) => s + selected[k].price, 0);
    const selTimes    = selKeys.map((k) => {
      const idx = parseInt(k.split('_')[1]);
      return HOURS[idx] + ':00';
    });

    return (
      <div
        className="sc-court-section"
        ref={(el) => (scheduleRefs.current[c.id] = el)}
        id={`sec-${c.id}`}
      >
        {/* Header */}
        <div className="sc-cs-header">
          <div className="sc-cs-left">
            <div className="sc-cs-bar" style={{ background: c.color }} />
            <div>
              <div className="sc-cs-title">
                {c.name}{' '}
                <span className="sc-cs-type">— {c.type}</span>
              </div>
              <div className="sc-cs-sub">{c.desc}</div>
            </div>
          </div>
          <div className="sc-cs-right">
            <span className="sc-cs-avail">✓ {free} slot trống</span>
            <span className="sc-cs-booked">✗ {bookedCount} đã đặt</span>
            <span className="sc-cs-peak">⚡ Cao điểm: {fmt(c.prices.peak)}K/h</span>
          </div>
        </div>

        {/* Time header */}
        <div className="sc-time-header-wrap">
          <div className="sc-th-spacer" />
          <div className="sc-th-grid">
            {HOURS.map((h) => (
              <div className="sc-th-cell" key={h}>
                {h}:00
                {isPeak(h)  && <><br />🔥</>}
                {isEarly(h) && <><br />🌅</>}
              </div>
            ))}
          </div>
        </div>

        {/* Price row */}
        <div className="sc-price-row-wrap">
          <div className="sc-pr-label">Giá / giờ</div>
          <div className="sc-pr-cells">
            {HOURS.map((h) => {
              const price = getPrice(c, h);
              const color = isPeak(h) ? 'var(--gold)' : isEarly(h) ? 'var(--cyan)' : 'var(--muted)';
              return (
                <div className="sc-pr-cell" style={{ color }} key={h}>
                  {fmt(price)}đ
                </div>
              );
            })}
          </div>
        </div>

        {/* Slots */}
        <div className="sc-slots-wrap">
          <div className="sc-slots-label">Trạng thái</div>
          <div className="sc-slots-row">
            {HOURS.map((h, idx) => {
              const key      = `${c.id}_${idx}`;
              const isBookd  = booked[c.id][idx];
              const isSel    = !!selected[key];
              const price    = getPrice(c, h);

              let cls = 'sc-slot-cell ';
              if      (isSel)    cls += 'sc-slot-selected';
              else if (isBookd)  cls += 'sc-slot-booked';
              else               cls += 'sc-slot-avail';

              return (
                <div
                  key={idx}
                  className={cls}
                  onClick={isBookd ? undefined : () => toggleSlot(c, idx, h, price)}
                >
                  {isPeak(h) && !isBookd && (
                    <span className="sc-slot-peak-tag">HOT</span>
                  )}
                  {isBookd ? (
                    <span style={{ fontSize: 9 }}>Đã đặt</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 11 }}>{isSel ? '✓' : '+'}</span>
                      <span className="sc-slot-sprice">{fmt(price)}đ</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-court selection summary */}
        {selKeys.length > 0 && (
          <div className="sc-sel-summary">
            ✓ Đã chọn: {selTimes.join(', ')}&nbsp;·&nbsp;
            <b>{selTotal.toLocaleString('vi-VN')}đ</b>
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="sc-page">
      {/* Grid background */}
      <div className="sc-grid-bg" />

      {/* Page Header */}
      <div className="sc-page-header">
        <h1 className="sc-page-title">
          Sân &amp; <span className="sc-gradient-text">Lịch đặt</span>
        </h1>
        <p className="sc-page-sub">
          Chọn sân · Chọn khung giờ · Đặt ngay trong 60 giây — Click ô xanh để chọn
        </p>
      </div>

      {/* Controls */}
      <div className="sc-controls">
        <div className="sc-date-nav">
          <button
            className="sc-date-btn"
            onClick={() => { if (dateOffset > 0) setDateOffset((v) => v - 1); }}
          >‹</button>
          <button className="sc-date-btn" onClick={() => setDateOffset((v) => v + 1)}>›</button>
        </div>

        <div className="sc-date-tabs">
          {dates.map((d, i) => (
            <div
              key={i}
              className={`sc-date-tab${activeDay === i ? ' active' : ''}`}
              onClick={() => setActiveDay(i)}
            >
              {d.label}
            </div>
          ))}
        </div>

        <div className="sc-legend">
          <div className="sc-legend-item">
            <div className="sc-legend-dot sc-dot-available" />Còn trống
          </div>
          <div className="sc-legend-item">
            <div className="sc-legend-dot sc-dot-booked" />Đã đặt
          </div>
          <div className="sc-legend-item">
            <div className="sc-legend-dot sc-dot-selected" />Đang chọn
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="sc-main">
        {/* Sidebar */}
        <aside className="sc-sidebar">
          <div className="sc-sidebar-title">Danh sách sân ({COURTS.length})</div>
          {COURTS.map((c) => <SidebarItem key={c.id} c={c} />)}
        </aside>

        {/* Schedule */}
        <div className="sc-schedule-area">
          {COURTS.map((c) => <CourtSection key={c.id} c={c} />)}
        </div>
      </div>

      {/* Booking panel */}
      <div className={`sc-booking-panel${selectedKeys.length ? ' show' : ''}`}>
        <div className="sc-bp-summary">
          <h4>Đặt chỗ đang chọn</h4>
          <p>{selectedKeys.length ? panelParts.join(' · ') : 'Chưa chọn khung giờ nào'}</p>
        </div>
        <div className="sc-bp-total">
          {selectedKeys.length
            ? <>{totalPrice.toLocaleString('vi-VN')}đ <span>{selectedKeys.length} giờ</span></>
            : '—'}
        </div>
        <button className="sc-btn-clear" onClick={clearAll}>✕ Xóa hết</button>
        <button className="sc-btn-confirm" onClick={openModal}>Đặt sân ngay →</button>
      </div>

      {/* Modal */}
      {showModal && (
        <BookingModal
          selected={selected}
          booked={booked}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
          bookingDate={dates[activeDay].d}
        />
      )}

      {/* Toast real-time notification */}
      {toaster && (
        <div className="sc-toast show">
          <div className="sc-toast-content">
            <span className="sc-toast-icon">⚡</span>
            <div className="sc-toast-msg">{toaster.message}</div>
          </div>
        </div>
      )}
    </div>
  );
};
