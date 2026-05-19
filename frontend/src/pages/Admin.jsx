import React, { useState, useMemo } from 'react';

// ─────────────────────────────────────────
// MOCK DATA FOR ADMIN PORTAL
// ─────────────────────────────────────────
const INITIAL_BOOKINGS = [
  { id: 'SC85921', name: 'Nguyễn Văn Test', phone: '0987654321', court: 'Sân C (Premium)', date: '2026-05-19', time: '17:00 – 20:00', price: 205000, status: 'Confirmed', payment: 'MoMo' },
  { id: 'SC41295', name: 'Phan Minh Huy', phone: '0905112233', court: 'Sân E (VIP)', date: '2026-05-19', time: '08:00 – 10:00', price: 350000, status: 'Confirmed', payment: 'Chuyển khoản' },
  { id: 'SC78129', name: 'Lê Thị Thảo', phone: '0935889900', court: 'Sân A (Standard)', date: '2026-05-19', time: '15:00 – 16:00', price: 75000, status: 'Pending', payment: 'Tiền mặt' },
  { id: 'SC99238', name: 'Trần Đại Nghĩa', phone: '0914223344', court: 'Sân D (Premium)', date: '2026-05-20', time: '17:00 – 19:00', price: 310000, status: 'Confirmed', payment: 'ZaloPay' },
  { id: 'SC55612', name: 'Phạm Thanh Sơn', phone: '0981999888', court: 'Sân B (Standard)', date: '2026-05-20', time: '06:00 – 08:00', price: 110000, status: 'Pending', payment: 'Chuyển khoản' },
  { id: 'SC22319', name: 'Hoàng Ngọc Bích', phone: '0906777666', court: 'Sân E (VIP)', date: '2026-05-21', time: '16:00 – 18:00', price: 395000, status: 'Confirmed', payment: 'MoMo' }
];

const INITIAL_CUSTOMERS = [
  { id: 'CUST001', name: 'Nguyễn Văn Test', phone: '0987654321', email: 'test@gmail.com', totalHours: 12, spent: 1150000, tier: 'VIP' },
  { id: 'CUST002', name: 'Phan Minh Huy', phone: '0905112233', email: 'huy.phan@gmail.com', totalHours: 24, spent: 3800000, tier: 'VIP Gold' },
  { id: 'CUST003', name: 'Lê Thị Thảo', phone: '0935889900', email: 'thao.le@yahoo.com', totalHours: 4, spent: 300000, tier: 'Standard' },
  { id: 'CUST004', name: 'Trần Đại Nghĩa', phone: '0914223344', email: 'nghiatd@gmail.com', totalHours: 15, spent: 1850000, tier: 'VIP' },
  { id: 'CUST005', name: 'Phạm Thanh Sơn', phone: '0981999888', email: 'sonpt@hotmail.com', totalHours: 8, spent: 680000, tier: 'Standard' },
  { id: 'CUST006', name: 'Hoàng Ngọc Bích', phone: '0906777666', email: 'bichhn@gmail.com', totalHours: 32, spent: 5400000, tier: 'Elite VIP' }
];

export const Admin = () => {
  // Authentication status
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'revenue' | 'customers' | 'courts'
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  
  // Search & Filters
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('All'); // 'All' | 'Confirmed' | 'Pending'
  const [customerSearch, setCustomerSearch] = useState('');

  // Court statuses
  const [courts, setCourts] = useState([
    { id: 'A', name: 'Sân A (Standard)', status: 'Active', load: '65%' },
    { id: 'B', name: 'Sân B (Standard)', status: 'Active', load: '58%' },
    { id: 'C', name: 'Sân C (Premium)', status: 'Active', load: '82%' },
    { id: 'D', name: 'Sân D (Premium)', status: 'Maintenance', load: '0%' },
    { id: 'E', name: 'Sân E (VIP)', status: 'Active', load: '90%' },
  ]);

  // Handle Admin Login
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Sai tài khoản hoặc mật khẩu chủ sân!');
    }
  };

  // Booking action handlers
  const handleConfirmBooking = (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Confirmed' } : b));
  };

  const handleCancelBooking = (id) => {
    if (window.confirm(`Bạn có chắc muốn hủy lịch đặt ${id}?`)) {
      setBookings(prev => prev.filter(b => b.id !== id));
    }
  };

  // Toggle court status
  const toggleCourtStatus = (id) => {
    setCourts(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'Active' ? 'Maintenance' : 'Active';
        return { ...c, status: nextStatus, load: nextStatus === 'Maintenance' ? '0%' : '50%' };
      }
      return c;
    }));
  };

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                            b.phone.includes(bookingSearch) ||
                            b.id.toLowerCase().includes(bookingSearch.toLowerCase());
      const matchesFilter = bookingFilter === 'All' ? true : b.status === bookingFilter;
      return matchesSearch && matchesFilter;
    });
  }, [bookings, bookingSearch, bookingFilter]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      return c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
             c.phone.includes(customerSearch) ||
             c.email.toLowerCase().includes(customerSearch.toLowerCase());
    });
  }, [customers, customerSearch]);

  // Totalized Revenue Calculations
  const stats = useMemo(() => {
    const totalConfirmed = bookings.filter(b => b.status === 'Confirmed').reduce((sum, b) => sum + b.price, 0);
    const totalPending = bookings.filter(b => b.status === 'Pending').reduce((sum, b) => sum + b.price, 0);
    const totalSpent = customers.reduce((sum, c) => sum + c.spent, 0);
    return {
      revenueToday: totalConfirmed,
      potentialRevenue: totalPending,
      totalRevenueAllTime: totalSpent,
      totalOrders: bookings.length,
      pendingOrders: bookings.filter(b => b.status === 'Pending').length,
    };
  }, [bookings, customers]);

  // ─────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="ad-login-page">
        <div className="ad-grid-bg" />
        <div className="ad-login-card">
          <div className="ad-login-header">
            <span className="ad-login-icon">🛡️</span>
            <h2>SmashCourt Admin</h2>
            <p>Trang quản trị dành riêng cho chủ sân</p>
          </div>
          {loginError && <div className="ad-login-error">{loginError}</div>}
          <form onSubmit={handleLogin}>
            <div className="ad-form-group">
              <label>Tài khoản</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="admin" 
                required 
              />
            </div>
            <div className="ad-form-group">
              <label>Mật khẩu</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
              />
            </div>
            <button type="submit" className="ad-btn-login">Đăng nhập Admin ⚡</button>
          </form>
          <div className="ad-login-footer">
            <p>Tài khoản demo: <b>admin</b> / Mật khẩu: <b>admin</b></p>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // DASHBOARD MAIN
  // ─────────────────────────────────────────
  return (
    <div className="ad-dashboard">
      <div className="ad-grid-bg" />

      {/* Header bar */}
      <header className="ad-header">
        <div className="ad-logo">
          <span className="ad-badge-shield">🛡️ CONTROL PANEL</span>
          <h3>SmashCourt Admin</h3>
        </div>
        <div className="ad-header-actions">
          <span className="ad-user-indicator">🟢 Chủ sân (Online)</span>
          <button className="ad-btn-logout" onClick={() => setIsLoggedIn(false)}>Đăng xuất</button>
        </div>
      </header>

      {/* Main dashboard stats cards */}
      <section className="ad-stats-grid">
        <div className="ad-stat-card">
          <div className="ad-stat-icon" style={{ color: 'var(--green)' }}>💵</div>
          <div className="ad-stat-info">
            <div className="ad-stat-label">Doanh thu hôm nay (Đã Confirm)</div>
            <div className="ad-stat-val">{stats.revenueToday.toLocaleString('vi-VN')}đ</div>
            <div className="ad-stat-sub">Tiềm năng: +{stats.potentialRevenue.toLocaleString('vi-VN')}đ chờ duyệt</div>
          </div>
        </div>
        <div className="ad-stat-card">
          <div className="ad-stat-icon" style={{ color: 'var(--gold)' }}>🏆</div>
          <div className="ad-stat-info">
            <div className="ad-stat-label">Tổng doanh thu hệ thống</div>
            <div className="ad-stat-val">{stats.totalRevenueAllTime.toLocaleString('vi-VN')}đ</div>
            <div className="ad-stat-sub">Từ toàn bộ lịch sử khách hàng</div>
          </div>
        </div>
        <div className="ad-stat-card">
          <div className="ad-stat-icon" style={{ color: 'var(--cyan)' }}>📅</div>
          <div className="ad-stat-info">
            <div className="ad-stat-label">Lịch đặt hôm nay</div>
            <div className="ad-stat-val">{stats.totalOrders} lượt</div>
            <div className="ad-stat-sub">{stats.pendingOrders} lịch chờ xác nhận</div>
          </div>
        </div>
        <div className="ad-stat-card">
          <div className="ad-stat-icon" style={{ color: '#CC66FF' }}>👥</div>
          <div className="ad-stat-info">
            <div className="ad-stat-label">Tổng số khách hàng</div>
            <div className="ad-stat-val">{customers.length} thành viên</div>
            <div className="ad-stat-sub">Có 3 tài khoản đạt hạng VIP Gold</div>
          </div>
        </div>
      </section>

      {/* Layout Grid */}
      <div className="ad-layout">
        {/* Navigation Sidebar */}
        <aside className="ad-sidebar">
          <button 
            className={`ad-side-btn${activeTab === 'bookings' ? ' active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <span>📅</span> Quản lý lịch đặt
          </button>
          <button 
            className={`ad-side-btn${activeTab === 'revenue' ? ' active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            <span>📈</span> Phân tích doanh thu
          </button>
          <button 
            className={`ad-side-btn${activeTab === 'customers' ? ' active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <span>👥</span> Danh sách khách hàng
          </button>
          <button 
            className={`ad-side-btn${activeTab === 'courts' ? ' active' : ''}`}
            onClick={() => setActiveTab('courts')}
          >
            <span>🏸</span> Trạng thái sân
          </button>
        </aside>

        {/* Content Area */}
        <main className="ad-content">
          {/* TAB 1: QUẢN LÝ LỊCH ĐẶT */}
          {activeTab === 'bookings' && (
            <div className="ad-pane fade-up">
              <div className="ad-pane-header">
                <h4>Quản lý danh sách lịch đặt</h4>
                <div className="ad-filters">
                  <input 
                    type="text" 
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Tìm tên, SĐT, mã đặt sân..."
                    className="ad-search-input"
                  />
                  <select 
                    value={bookingFilter}
                    onChange={(e) => setBookingFilter(e.target.value)}
                    className="ad-filter-select"
                  >
                    <option value="All">Tất cả trạng thái</option>
                    <option value="Confirmed">Đã xác nhận</option>
                    <option value="Pending">Chờ duyệt</option>
                  </select>
                </div>
              </div>

              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Sân</th>
                      <th>Ngày đặt</th>
                      <th>Khung giờ</th>
                      <th>Thanh toán</th>
                      <th>Giá trị</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                          Không tìm thấy lịch đặt nào phù hợp
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr key={b.id}>
                          <td className="ad-code">{b.id}</td>
                          <td>
                            <div className="ad-cust-info">
                              <b>{b.name}</b>
                              <span>{b.phone}</span>
                            </div>
                          </td>
                          <td>{b.court}</td>
                          <td>{b.date}</td>
                          <td>{b.time}</td>
                          <td style={{ fontSize: 12 }}>{b.payment}</td>
                          <td className="ad-amount">{b.price.toLocaleString('vi-VN')}đ</td>
                          <td>
                            <span className={`ad-status-badge ${b.status.toLowerCase()}`}>
                              {b.status === 'Confirmed' ? 'Đã duyệt' : 'Chờ xác nhận'}
                            </span>
                          </td>
                          <td>
                            <div className="ad-row-actions">
                              {b.status === 'Pending' && (
                                <button 
                                  className="ad-btn-approve"
                                  onClick={() => handleConfirmBooking(b.id)}
                                >
                                  Duyệt ✓
                                </button>
                              )}
                              <button 
                                className="ad-btn-cancel"
                                onClick={() => handleCancelBooking(b.id)}
                              >
                                Hủy ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PHÂN TÍCH DOANH THU */}
          {activeTab === 'revenue' && (
            <div className="ad-pane fade-up">
              <div className="ad-pane-header">
                <h4>Biểu đồ phân tích doanh thu sân</h4>
                <button className="ad-btn-export" onClick={() => alert('Đã xuất báo cáo Excel thành công!')}>
                  📥 Xuất báo cáo Excel
                </button>
              </div>

              {/* Chart simulation widget */}
              <div className="ad-chart-container">
                <div className="ad-chart-meta">
                  <div>
                    <h5>Doanh thu tuần này</h5>
                    <p style={{ color: 'var(--muted)', fontSize: 12 }}>So với tuần trước tăng 14.5%</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h4 style={{ color: 'var(--gold)' }}>12,850,000đ</h4>
                    <span style={{ fontSize: 11, color: 'var(--green)' }}>▲ Tăng trưởng tốt</span>
                  </div>
                </div>

                {/* SVG Visual Chart */}
                <div className="ad-visual-chart">
                  <svg viewBox="0 0 600 200" className="ad-svg-line">
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="50" y1="20" x2="550" y2="20" stroke="rgba(255,255,255,0.05)" />
                    <line x1="50" y1="70" x2="550" y2="70" stroke="rgba(255,255,255,0.05)" />
                    <line x1="50" y1="120" x2="550" y2="120" stroke="rgba(255,255,255,0.05)" />
                    <line x1="50" y1="170" x2="550" y2="170" stroke="rgba(255,255,255,0.05)" />

                    {/* Chart area glow */}
                    <path 
                      d="M 50 170 L 50 140 L 133 110 L 216 150 L 300 80 L 383 60 L 466 120 L 550 40 L 550 170 Z" 
                      fill="url(#chartGlow)"
                    />

                    {/* Chart line path */}
                    <path 
                      d="M 50 140 L 133 110 L 216 150 L 300 80 L 383 60 L 466 120 L 550 40" 
                      fill="none" 
                      stroke="var(--gold)" 
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Nodes points */}
                    <circle cx="50" cy="140" r="5" fill="var(--gold)" />
                    <circle cx="133" cy="110" r="5" fill="var(--gold)" />
                    <circle cx="216" cy="150" r="5" fill="var(--gold)" />
                    <circle cx="300" cy="80" r="5" fill="var(--gold)" />
                    <circle cx="383" cy="60" r="5" fill="var(--gold)" />
                    <circle cx="466" cy="120" r="5" fill="var(--gold)" />
                    <circle cx="550" cy="40" r="5" fill="var(--cyan)" />
                  </svg>
                  
                  {/* Weekday labels */}
                  <div className="ad-chart-labels">
                    <span>Thứ 2</span>
                    <span>Thứ 3</span>
                    <span>Thứ 4</span>
                    <span>Thứ 5</span>
                    <span>Thứ 6</span>
                    <span>Thứ 7</span>
                    <span>Chủ Nhật</span>
                  </div>
                </div>
              </div>

              {/* Court breakdown widget */}
              <div className="ad-revenue-breakdown">
                <h5>Doanh thu chi tiết theo loại Sân</h5>
                <div className="ad-breakdown-grid">
                  <div className="ad-breakdown-card">
                    <div className="ad-breakdown-title">Sân VIP (BWF Standard)</div>
                    <div className="ad-breakdown-bar-wrap">
                      <div className="ad-breakdown-bar" style={{ width: '48%', background: '#CC66FF' }} />
                    </div>
                    <div className="ad-breakdown-meta">
                      <span>48% công suất</span>
                      <b>5,400,000đ</b>
                    </div>
                  </div>
                  <div className="ad-breakdown-card">
                    <div className="ad-breakdown-title">Sân Premium (PVC Yonex)</div>
                    <div className="ad-breakdown-bar-wrap">
                      <div className="ad-breakdown-bar" style={{ width: '35%', background: 'var(--cyan)' }} />
                    </div>
                    <div className="ad-breakdown-meta">
                      <span>35% công suất</span>
                      <b>3,950,000đ</b>
                    </div>
                  </div>
                  <div className="ad-breakdown-card">
                    <div className="ad-breakdown-title">Sân Standard (Epoxy)</div>
                    <div className="ad-breakdown-bar-wrap">
                      <div className="ad-breakdown-bar" style={{ width: '17%', background: 'var(--green)' }} />
                    </div>
                    <div className="ad-breakdown-meta">
                      <span>17% công suất</span>
                      <b>1,500,000đ</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DANH SÁCH KHÁCH HÀNG */}
          {activeTab === 'customers' && (
            <div className="ad-pane fade-up">
              <div className="ad-pane-header">
                <h4>Quản lý tệp khách hàng hệ thống</h4>
                <div className="ad-filters">
                  <input 
                    type="text" 
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Tìm tên, SĐT, Email..."
                    className="ad-search-input"
                  />
                </div>
              </div>

              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Mã KH</th>
                      <th>Tên khách hàng</th>
                      <th>Số điện thoại</th>
                      <th>Email</th>
                      <th>Tổng số giờ đã đặt</th>
                      <th>Tổng tích lũy</th>
                      <th>Hạng mức</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                          Không tìm thấy khách hàng nào
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((c) => (
                        <tr key={c.id}>
                          <td className="ad-code">{c.id}</td>
                          <td><b>{c.name}</b></td>
                          <td>{c.phone}</td>
                          <td>{c.email}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{c.totalHours} giờ</td>
                          <td className="ad-amount">{c.spent.toLocaleString('vi-VN')}đ</td>
                          <td>
                            <span className={`ad-tier-badge ${c.tier.toLowerCase().replace(' ', '-')}`}>
                              {c.tier}
                            </span>
                          </td>
                          <td>
                            <div className="ad-row-actions">
                              <button 
                                className="ad-btn-block"
                                onClick={() => alert(`Đã gửi cảnh báo đến khách hàng ${c.name}!`)}
                              >
                                Nhắc nhở ⚠️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: TRẠNG THÁI SÂN */}
          {activeTab === 'courts' && (
            <div className="ad-pane fade-up">
              <div className="ad-pane-header">
                <h4>Quản lý đóng/mở trạng thái sân</h4>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
                Nhấp nút toggle để khóa sân phục vụ công tác bảo trì định kỳ hoặc vệ sinh. Sân bảo trì sẽ hiển thị trạng thái "Hết sân" trên trang người dùng.
              </p>

              <div className="ad-courts-mgmt-grid">
                {courts.map((court) => (
                  <div key={court.id} className={`ad-court-mgmt-card ${court.status.toLowerCase()}`}>
                    <div className="ad-court-mgmt-header">
                      <h5>{court.name}</h5>
                      <span className={`ad-court-status-tag ${court.status.toLowerCase()}`}>
                        {court.status === 'Active' ? 'Đang hoạt động' : 'Bảo trì'}
                      </span>
                    </div>
                    <div className="ad-court-mgmt-body">
                      <div className="ad-court-mgmt-row">
                        <span>Tỉ lệ lấp đầy hôm nay</span>
                        <b>{court.load}</b>
                      </div>
                      <div className="ad-court-mgmt-row">
                        <span>Nhiệt độ phòng</span>
                        <b>27°C</b>
                      </div>
                    </div>
                    <div className="ad-court-mgmt-footer">
                      <button 
                        className={`ad-btn-toggle ${court.status.toLowerCase()}`}
                        onClick={() => toggleCourtStatus(court.id)}
                      >
                        {court.status === 'Active' ? '🛑 Tạm khóa bảo trì' : '🟢 Mở hoạt động'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
