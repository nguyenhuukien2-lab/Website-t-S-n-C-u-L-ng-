import React, { useState, useMemo, useEffect } from 'react';

export const Admin = () => {
  // Authentication status
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [courts, setCourts] = useState([]);
  
  // RBAC state
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  
  // Search & Filters
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('All');
  const [customerSearch, setCustomerSearch] = useState('');

  // Load live data from the database
  const loadData = async () => {
    try {
      // 1. Fetch Bookings from Postgres
      const bookingsRes = await fetch('http://localhost:5000/api/bookings');
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        const mappedBookings = bookingsData.data.map(b => ({
          id: `SC${b.id}`,
          rawId: b.id,
          name: b.customerName,
          phone: b.customerPhone,
          court: b.courtName,
          date: b.date,
          time: b.time,
          price: parseInt(b.depositAmount) || 0,
          payment: b.paymentMethod,
          status: b.status === 'pending' ? 'Pending' : (b.status === 'confirmed' ? 'Confirmed' : 'Cancelled')
        }));
        setBookings(mappedBookings);
      }

      // 2. Fetch Customers from Postgres (LEFT JOIN queries)
      const customersRes = await fetch('http://localhost:5000/api/auth/users');
      const customersData = await customersRes.json();
      if (customersData.success) {
        setCustomers(customersData.data);
      }

      // 3. Fetch Court statuses from Postgres
      const courtsRes = await fetch('http://localhost:5000/api/courts');
      const courtsData = await courtsRes.json();
      if (courtsData.success) {
        const mappedCourts = courtsData.data.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status === 'available' ? 'Active' : 'Maintenance',
          load: c.status === 'available' ? '65%' : '0%'
        }));
        setCourts(mappedCourts);
      }

      // 4. Fetch RBAC data from Postgres
      const [rolesRes, permsRes, rpRes, urRes] = await Promise.all([
        fetch('http://localhost:5000/api/rbac/roles'),
        fetch('http://localhost:5000/api/rbac/permissions'),
        fetch('http://localhost:5000/api/rbac/role-permissions'),
        fetch('http://localhost:5000/api/rbac/user-roles')
      ]);
      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      const rpData = await rpRes.json();
      const urData = await urRes.json();
      if (rolesData.success) setRoles(rolesData.data);
      if (permsData.success) setPermissions(permsData.data);
      if (rpData.success) setRolePermissions(rpData.data);
      if (urData.success) setUserRoles(urData.data);
    } catch (error) {
      console.error("Lỗi đồng bộ dữ liệu API với Postgres:", error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
      // Tự động reload mỗi 15 giây để đồng bộ liên tục khi có ai đặt sân mới!
      const interval = setInterval(loadData, 15000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // Lấy header kèm token xác thực gửi lên API
  const getAuthHeaders = () => {
    const token = localStorage.getItem('smashcourt_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Handle Admin Login (Kết nối trực tiếp tài khoản Postgres & Hỗ trợ demo bypass)
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Bypass nhanh tài khoản demo 'admin' / 'admin' để thuận tiện phát triển
    if (username === 'admin' && password === 'admin') {
      setIsLoggedIn(true);
      setLoginError('');
      loadData();
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password: password })
      });
      const data = await res.json();
      if (data.success) {
        if (data.user.role === 'admin' || data.user.role === 'staff') {
          // Lưu token phân quyền vào bộ nhớ cục bộ
          localStorage.setItem('smashcourt_token', data.token);
          setIsLoggedIn(true);
          setLoginError('');
          loadData();
        } else {
          setLoginError('Tài khoản của bạn (Khách hàng) không được cấp quyền truy cập Admin!');
        }
      } else {
        setLoginError(data.error || 'Sai tên đăng nhập hoặc mật khẩu!');
      }
    } catch (error) {
      setLoginError('Không thể kết nối đến máy chủ backend!');
    }
  };

  // Booking action handlers (Cập nhật trực tiếp xuống Postgres kèm Token xác thực)
  const handleConfirmBooking = async (id) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${booking.rawId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'confirmed' })
      });
      const data = await res.json();
      if (data.success) {
        await loadData(); // Tải lại dữ liệu ngay lập tức để đồng bộ hóa các con số doanh thu
      } else {
        alert("Lỗi duyệt lịch: " + data.error);
      }
    } catch (error) {
      console.error("Lỗi duyệt lịch đặt sân:", error);
      alert("Lỗi kết nối máy chủ backend!");
    }
  };

  const handleCancelBooking = async (id) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    if (window.confirm(`Bạn có chắc muốn hủy lịch đặt ${id}?`)) {
      try {
        const res = await fetch(`http://localhost:5000/api/bookings/${booking.rawId}/status`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: 'cancelled' })
        });
        const data = await res.json();
        if (data.success) {
          await loadData(); // Tải lại dữ liệu ngay lập tức
        } else {
          alert("Lỗi hủy lịch: " + data.error);
        }
      } catch (error) {
        console.error("Lỗi hủy lịch đặt sân:", error);
        alert("Lỗi kết nối máy chủ backend!");
      }
    }
  };

  // Toggle court status (Cập nhật trực tiếp xuống Postgres kèm Token xác thực)
  const toggleCourtStatus = async (id) => {
    const court = courts.find(c => c.id === id);
    if (!court) return;

    const nextStatus = court.status === 'Active' ? 'maintenance' : 'available';

    try {
      const res = await fetch(`http://localhost:5000/api/courts/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      } else {
        alert("Lỗi đổi trạng thái sân: " + data.error);
      }
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái sân:", error);
      alert("Lỗi kết nối máy chủ backend!");
    }
  };

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = (b.name || '').toLowerCase().includes(bookingSearch.toLowerCase()) ||
                            (b.phone || '').includes(bookingSearch) ||
                            (b.id || '').toLowerCase().includes(bookingSearch.toLowerCase());
      const matchesFilter = bookingFilter === 'All' ? true : b.status === bookingFilter;
      return matchesSearch && matchesFilter;
    });
  }, [bookings, bookingSearch, bookingFilter]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      return (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
             (c.phone || '').includes(customerSearch) ||
             (c.email || '').toLowerCase().includes(customerSearch.toLowerCase());
    });
  }, [customers, customerSearch]);

  // Totalized Revenue Calculations (Phép tính động dựa trên Postgres thật)
  const stats = useMemo(() => {
    const totalConfirmed = bookings.filter(b => b.status === 'Confirmed').reduce((sum, b) => sum + b.price, 0);
    const totalPending = bookings.filter(b => b.status === 'Pending').reduce((sum, b) => sum + b.price, 0);
    const totalSpent = customers.reduce((sum, c) => sum + (parseInt(c.spent) || 0), 0);
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
          <button 
            className={`ad-side-btn${activeTab === 'rbac' ? ' active' : ''}`}
            onClick={() => setActiveTab('rbac')}
          >
            <span>🛡️</span> Phân quyền
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

          {/* TAB 5: PHÂN QUYỀN RBAC */}
          {activeTab === 'rbac' && (
            <div className="ad-pane fade-up">
              <div className="ad-pane-header">
                <h4>🛡️ Quản lý phân quyền hệ thống (RBAC)</h4>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
                Phân vai trò cho người dùng và gán/thu hồi quyền hạn cho từng vai trò. Mọi thay đổi có hiệu lực ngay lập tức.
              </p>

              {/* ── SECTION 1: Danh sách vai trò ── */}
              <div style={{ marginBottom: 32 }}>
                <h5 style={{ color: 'var(--cyan)', marginBottom: 12, fontSize: 15 }}>📋 Danh sách vai trò trong hệ thống</h5>
                <div className="ad-courts-mgmt-grid">
                  {roles.map(role => (
                    <div key={role.id} className={`ad-court-mgmt-card ${selectedRoleId === role.id ? 'active' : ''}`}
                      style={{ cursor: 'pointer', border: selectedRoleId === role.id ? '2px solid var(--cyan)' : undefined }}
                      onClick={() => setSelectedRoleId(role.id)}
                    >
                      <div className="ad-court-mgmt-header">
                        <h5>{role.role_name}</h5>
                        <span className="ad-court-status-tag active" style={{ fontSize: 11 }}>
                          {role.user_count} người dùng
                        </span>
                      </div>
                      <div className="ad-court-mgmt-body">
                        <div className="ad-court-mgmt-row">
                          <span>Mô tả</span>
                          <b style={{ fontSize: 12 }}>{role.role_note || '—'}</b>
                        </div>
                        <div className="ad-court-mgmt-row">
                          <span>Mã vai trò</span>
                          <b style={{ fontFamily: 'monospace', color: 'var(--cyan)' }}>{role.id}</b>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── SECTION 2: Ma trận quyền hạn của vai trò đã chọn ── */}
              {selectedRoleId && (
                <div style={{ marginBottom: 32 }}>
                  <h5 style={{ color: 'var(--green)', marginBottom: 12, fontSize: 15 }}>
                    🔐 Quyền hạn của vai trò: <span style={{ color: 'var(--cyan)' }}>
                      {roles.find(r => r.id === selectedRoleId)?.role_name}
                    </span>
                  </h5>
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th>Quyền hạn</th>
                          <th>Mô tả</th>
                          <th>Controller / Action</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissions.map(perm => {
                          const rp = rolePermissions.find(r => r.role_id === selectedRoleId);
                          const assigned = rp?.permissions?.some(p => p.perm_id === perm.id) || false;
                          return (
                            <tr key={perm.id}>
                              <td><b>{perm.permision_name}</b></td>
                              <td style={{ color: 'var(--muted)', fontSize: 12 }}>{perm.permision_note}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--cyan)' }}>
                                {perm.lines && perm.lines[0]?.controller
                                  ? perm.lines.map(l => `${l.controller}/${l.action}`).join(', ')
                                  : '—'}
                              </td>
                              <td>
                                <span className={`ad-status-badge ${assigned ? 'confirmed' : 'pending'}`}>
                                  {assigned ? '✅ Đã gán' : '⛔ Chưa gán'}
                                </span>
                              </td>
                              <td>
                                {assigned ? (
                                  <button className="ad-btn-cancel" style={{ fontSize: 12 }}
                                    onClick={async () => {
                                      await fetch('http://localhost:5000/api/rbac/role-perm/revoke', {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ roleId: selectedRoleId, permId: perm.id })
                                      });
                                      loadData();
                                    }}
                                  >Thu hồi ✕</button>
                                ) : (
                                  <button className="ad-btn-approve" style={{ fontSize: 12 }}
                                    onClick={async () => {
                                      await fetch('http://localhost:5000/api/rbac/role-perm/assign', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ roleId: selectedRoleId, permId: perm.id })
                                      });
                                      loadData();
                                    }}
                                  >Gán quyền ✓</button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── SECTION 3: Gán vai trò cho người dùng ── */}
              <div>
                <h5 style={{ color: '#CC66FF', marginBottom: 12, fontSize: 15 }}>👥 Gán vai trò cho người dùng</h5>
                <div className="ad-table-wrap">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>Vai trò hiện tại</th>
                        <th>Đổi vai trò</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userRoles.map(u => (
                        <tr key={u.id}>
                          <td className="ad-code">{u.id}</td>
                          <td><b>{u.full_name}</b></td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`ad-tier-badge ${u.role_id === 'r-admin' ? 'elite-vip' : u.role_id === 'r-staff' ? 'vip-gold' : 'standard'}`}>
                              {u.role_name || 'Chưa gán'}
                            </span>
                          </td>
                          <td>
                            <select
                              className="ad-filter-select"
                              style={{ minWidth: 160 }}
                              value={u.role_id || ''}
                              onChange={async (e) => {
                                const newRoleId = e.target.value;
                                if (!newRoleId) return;
                                await fetch('http://localhost:5000/api/rbac/assign', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: u.id, roleId: newRoleId })
                                });
                                loadData();
                              }}
                            >
                              <option value="">-- Chọn vai trò --</option>
                              {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.role_name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
