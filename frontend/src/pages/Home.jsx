import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/* ===== 3D Court Projection Math Helper ===== */
function project3D(x, y, z, angleX, angleY) {
  const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
  const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
  const y1 = y * cosX - z * sinX;
  const z1 = y * sinX + z * cosX;
  const x2 = x * cosY + z1 * sinY;
  const z2 = -x * sinY + z1 * cosY;
  const scale = 400 / (400 + z2);
  return { x: x2 * scale, y: y1 * scale, z: z2 };
}

/* ===== Court Preview Canvas Component ===== */
const CourtPreviewCanvas = ({ floorColorStart, floorColorEnd, lineColor }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let t = Math.random() * 5; // offset phase
    let animationFrameId;

    const drawPreview = () => {
      ctx.clearRect(0, 0, 400, 200);
      ctx.save();
      ctx.translate(200, 130);

      const aX = 0.5;
      const aY = t * 0.3;

      const floorPts = [
        [-160, 0, -90], [160, 0, -90], [160, 0, 90], [-160, 0, 90]
      ].map(([x, y, z]) => project3D(x, y, z, aX, aY));

      ctx.beginPath();
      ctx.moveTo(floorPts[0].x, floorPts[0].y);
      floorPts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();

      const g = ctx.createLinearGradient(-100, -80, 100, 80);
      g.addColorStop(0, floorColorStart);
      g.addColorStop(1, floorColorEnd);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Simple center divider
      const dividerPts = [[0, 0, -90], [0, 0, 90]];
      const p1 = project3D(...dividerPts[0], aX, aY);
      const p2 = project3D(...dividerPts[1], aX, aY);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Net
      const nL = project3D(-160, -40, 0, aX, aY);
      const nR = project3D(160, -40, 0, aX, aY);
      ctx.beginPath();
      ctx.moveTo(nL.x, nL.y);
      ctx.lineTo(nR.x, nR.y);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
      t += 0.006;
      animationFrameId = requestAnimationFrame(drawPreview);
    };

    drawPreview();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [floorColorStart, floorColorEnd, lineColor]);

  return <canvas ref={canvasRef} width={400} height={200} />;
};

/* ===== Main Home Component ===== */
export const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Modal booking states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookName, setBookName] = useState('');
  const [bookPhone, setBookPhone] = useState('');
  const [bookCourt, setBookCourt] = useState('Sân A — Standard (80K/giờ)');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('17:00 – 18:00');
  
  // Success popup states
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingCode, setBookingCode] = useState('');

  // Active FAQ index
  const [openFAQIndex, setOpenFAQIndex] = useState(null);

  // References
  const particlesCanvasRef = useRef(null);
  const courtCanvasRef = useRef(null);
  const statsRef = useRef(null);

  // Synchronize Scroll from Route State (if clicked from navbar on another page)
  useEffect(() => {
    if (location.state && location.state.scrollTo) {
      const id = location.state.scrollTo;
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
  }, [location]);

  // Listen to Global Custom Event for Opening Booking Modal (e.g. from Navbar)
  useEffect(() => {
    const handleOpenModal = () => {
      navigate('/courts');
    };

    window.addEventListener('open-booking-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-booking-modal', handleOpenModal);
    };
  }, [navigate]);

  // Modal open helper
  const openModal = () => {
    navigate('/courts');
  };

  // Modal close helper
  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = '';
  };

  // Particles Effect Canvas
  useEffect(() => {
    const canvas = particlesCanvasRef.current;
    if (!canvas) return;

    const pCtx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1
    }));

    let animationFrameId;

    const animateParticles = () => {
      pCtx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        pCtx.fillStyle = `rgba(255, 215, 0, ${p.alpha})`;
        pCtx.fill();
      });
      animationFrameId = requestAnimationFrame(animateParticles);
    };

    animateParticles();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 3D Hero Court Animation
  useEffect(() => {
    const canvas = courtCanvasRef.current;
    if (!canvas) return;

    const cCtx = canvas.getContext('2d');
    let courtAngle = 0;
    let animationFrameId;

    const drawCourt3D = (t) => {
      cCtx.clearRect(0, 0, 600, 600);
      cCtx.save();
      cCtx.translate(300, 320);

      const aX = 0.45 + Math.sin(t * 0.3) * 0.05;
      const aY = t * 0.4;

      // Court floor
      const floorPts = [
        [-150, 0, -280], [150, 0, -280],
        [150, 0, 280], [-150, 0, 280]
      ].map(([x, y, z]) => project3D(x, y, z, aX, aY));

      cCtx.beginPath();
      cCtx.moveTo(floorPts[0].x, floorPts[0].y);
      floorPts.forEach(p => cCtx.lineTo(p.x, p.y));
      cCtx.closePath();

      const grad = cCtx.createLinearGradient(-150, -280, 150, 280);
      grad.addColorStop(0, 'rgba(0, 60, 140, 0.9)');
      grad.addColorStop(1, 'rgba(0, 30, 80, 0.95)');
      cCtx.fillStyle = grad;
      cCtx.fill();
      cCtx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      cCtx.lineWidth = 2;
      cCtx.stroke();

      // Court lines
      const lines = [
        [[-150, 0, -200], [150, 0, -200]],
        [[-150, 0, 200], [150, 0, 200]],
        [[-80, 0, -280], [-80, 0, 280]],
        [[80, 0, -280], [80, 0, 280]],
        [[0, 0, -280], [0, 0, 280]],
        [[-150, 0, 0], [150, 0, 0]],
      ];
      cCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      cCtx.lineWidth = 1;
      lines.forEach(([a, b]) => {
        const p1 = project3D(...a, aX, aY);
        const p2 = project3D(...b, aX, aY);
        cCtx.beginPath();
        cCtx.moveTo(p1.x, p1.y);
        cCtx.lineTo(p2.x, p2.y);
        cCtx.stroke();
      });

      // Net posts
      const posts = [[-150, 0, 0], [150, 0, 0]];
      posts.forEach(([px, py, pz]) => {
        const bot = project3D(px, 0, pz, aX, aY);
        const top = project3D(px, -80, pz, aX, aY);
        cCtx.strokeStyle = '#FFD700';
        cCtx.lineWidth = 3;
        cCtx.beginPath();
        cCtx.moveTo(bot.x, bot.y);
        cCtx.lineTo(top.x, top.y);
        cCtx.stroke();
      });

      // Net strings
      for (let i = 0; i <= 10; i++) {
        const x = -150 + i * 30;
        const top = project3D(x, -70, 0, aX, aY);
        const bot = project3D(x, 0, 0, aX, aY);
        cCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        cCtx.lineWidth = 0.5;
        cCtx.beginPath();
        cCtx.moveTo(top.x, top.y);
        cCtx.lineTo(bot.x, bot.y);
        cCtx.stroke();
      }

      // Net top line
      const netL = project3D(-150, -70, 0, aX, aY);
      const netR = project3D(150, -70, 0, aX, aY);
      cCtx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
      cCtx.lineWidth = 2;
      cCtx.beginPath();
      cCtx.moveTo(netL.x, netL.y);
      cCtx.lineTo(netR.x, netR.y);
      cCtx.stroke();

      // Shuttlecock flying
      const shuttle = project3D(
        Math.sin(t * 0.7) * 100,
        -120 + Math.sin(t * 1.1) * 40,
        Math.cos(t * 0.5) * 150,
        aX, aY
      );
      cCtx.beginPath();
      cCtx.arc(shuttle.x, shuttle.y, 6, 0, Math.PI * 2);
      cCtx.fillStyle = '#FFD700';
      cCtx.fill();
      cCtx.shadowColor = '#FFD700';
      cCtx.shadowBlur = 12;
      cCtx.fill();
      cCtx.shadowBlur = 0;

      // Glow lines on court
      const glow = cCtx.createRadialGradient(0, 50, 0, 0, 50, 200);
      glow.addColorStop(0, 'rgba(0, 150, 255, 0.08)');
      glow.addColorStop(1, 'transparent');
      cCtx.fillStyle = glow;
      cCtx.fillRect(-200, -100, 400, 300);

      cCtx.restore();
      courtAngle += 0.008;
      animationFrameId = requestAnimationFrame(() => drawCourt3D(courtAngle));
    };

    drawCourt3D(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Stats incremental counter animation
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const counters = el.querySelectorAll('.stat-num');
        counters.forEach(counter => {
          const target = parseInt(counter.getAttribute('data-target') || '0', 10);
          let current = 0;
          const duration = 1500; // ms
          const start = performance.now();

          const update = (timestamp) => {
            const progress = Math.min((timestamp - start) / duration, 1);
            current = progress * target;
            
            // Format display text
            if (target >= 1000) {
              counter.textContent = Math.floor(current) + '+';
            } else if (target === 98) {
              counter.textContent = Math.floor(current) + '%';
            } else {
              counter.textContent = Math.floor(current) + '+';
            }

            if (progress < 1) {
              requestAnimationFrame(update);
            } else {
              if (target >= 1000) {
                counter.textContent = target + '+';
              } else if (target === 98) {
                counter.textContent = target + '%';
              } else {
                counter.textContent = target + '+';
              }
            }
          };

          requestAnimationFrame(update);
        });

        observer.disconnect();
      }
    }, { threshold: 0.1 });

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    reveals.forEach(el => revealObs.observe(el));

    return () => {
      revealObs.disconnect();
    };
  }, []);

  // FAQ Expand toggle
  const toggleFAQ = (index) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  // Click handler for modal backdrop
  const handleModalOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeModal();
    }
  };

  // Submit Booking Form
  const handleConfirmBook = (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!bookName.trim() || !bookPhone.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin cá nhân.');
      return;
    }

    // Generate random code SCxxxx
    const randCode = 'SC' + Math.floor(Math.random() * 9000 + 1000);
    setBookingCode(randCode);
    
    // Close form modal, open Success Dialog popup
    setIsModalOpen(false);
    setShowSuccess(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    document.body.style.overflow = '';
    // Clear inputs
    setBookName('');
    setBookPhone('');
  };

  return (
    <div id="smashcourt-home">
      {/* Dynamic Background Particles */}
      <canvas ref={particlesCanvasRef} id="particles"></canvas>

      {/* ===== HERO SECTION ===== */}
      <section id="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="dot"></span>
            Đang mở đặt sân — Hôm nay còn 6 slot trống
          </div>
          <h1 className="hero-title">
            <span className="line1">Đặt sân cầu lông</span><br />
            <span className="line2">Cực nhanh · Cực xịn</span>
          </h1>
          <p className="hero-sub">
            Chọn sân, chọn giờ, xác nhận trong 60 giây. Không cần gọi điện, không cần chờ đợi — sân của bạn, lịch của bạn.
          </p>
          <div className="hero-cta">
            <button className="btn-primary" onClick={openModal}>🏸 Đặt sân ngay</button>
            <a href="#courts" className="btn-secondary">Xem các sân →</a>
          </div>
          <div ref={statsRef} className="hero-stats">
            <div className="stat">
              <span className="stat-num" data-target="1240">0</span>
              <span className="stat-label">Lượt đặt / tháng</span>
            </div>
            <div className="stat">
              <span className="stat-num" data-target="4">0</span>
              <span className="stat-label">Sân chất lượng cao</span>
            </div>
            <div className="stat">
              <span className="stat-num" data-target="98">0</span>
              <span className="stat-label" style={{ whiteSpace: 'nowrap' }}>% hài lòng</span>
            </div>
          </div>
        </div>
        <canvas ref={courtCanvasRef} id="court-canvas" width="600" height="600"></canvas>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features">
        <div className="section-header reveal">
          <span className="section-tag">✦ Tại sao chọn chúng tôi</span>
          <h2 className="section-title">Trải nghiệm đặt sân khác biệt</h2>
          <p className="section-sub">Hệ thống thông minh giúp bạn quản lý lịch chơi cầu lông dễ dàng hơn bao giờ hết.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card reveal">
            <div className="feature-icon">⚡</div>
            <div className="feature-title">Đặt sân 60 giây</div>
            <p className="feature-desc">Chọn sân, chọn khung giờ và xác nhận chỉ trong 3 bước đơn giản. Nhận thông báo ngay lập tức.</p>
          </div>
          <div className="feature-card reveal">
            <div className="feature-icon">🔒</div>
            <div className="feature-title">Giữ sân chắc chắn</div>
            <p className="feature-desc">Thanh toán đặt cọc online qua MoMo, ZaloPay, thẻ ngân hàng. Sân được giữ ngay sau khi xác nhận.</p>
          </div>
          <div className="feature-card reveal">
            <div className="feature-icon">🔔</div>
            <div className="feature-title">Nhắc lịch thông minh</div>
            <p className="feature-desc">Nhận nhắc nhở qua Zalo và SMS trước 2 giờ. Không bao giờ quên lịch đấu của bạn nữa.</p>
          </div>
          <div className="feature-card reveal">
            <div className="feature-icon">↩️</div>
            <div className="feature-title">Hủy lịch dễ dàng</div>
            <p className="feature-desc">Hủy trước 4 tiếng hoàn tiền cọc 100%. Quy trình minh bạch, không rắc rối, không tranh cãi.</p>
          </div>
        </div>
      </section>

      {/* ===== COURTS SECTION ===== */}
      <section id="courts">
        <div className="section-header reveal">
          <span className="section-tag">✦ Hệ thống sân</span>
          <h2 className="section-title">Sân & Bảng giá</h2>
          <p className="section-sub">4 sân cầu lông tiêu chuẩn quốc tế, đầy đủ ánh sáng LED, sàn gỗ cao cấp.</p>
        </div>
        <div className="courts-grid">
          <div className="court-card reveal">
            <div className="court-preview">
              <CourtPreviewCanvas
                floorColorStart="#003080"
                floorColorEnd="#001840"
                lineColor="rgba(0, 255, 136, 0.6)"
              />
              <div className="court-badge badge-standard">Standard</div>
            </div>
            <div className="court-info">
              <div className="court-name">Sân A — Standard</div>
              <p className="court-desc">Sàn gỗ epoxy, đèn LED 500lux, phù hợp luyện tập hàng ngày.</p>
              <div className="court-meta">
                <div className="court-price">80K <span>/ giờ</span></div>
                <button className="btn-book-sm" onClick={() => { setBookCourt('Sân A — Standard (80K/giờ)'); openModal(); }}>Đặt ngay</button>
              </div>
            </div>
          </div>

          <div className="court-card reveal">
            <div className="court-preview">
              <CourtPreviewCanvas
                floorColorStart="#301000"
                floorColorEnd="#180800"
                lineColor="rgba(255, 215, 0, 0.6)"
              />
              <div className="court-badge badge-premium">Premium</div>
            </div>
            <div className="court-info">
              <div className="court-name">Sân B — Premium</div>
              <p className="court-desc">Sàn PVC Yonex nhập khẩu, đèn LED 800lux, có máy lạnh.</p>
              <div className="court-meta">
                <div className="court-price">130K <span>/ giờ</span></div>
                <button className="btn-book-sm" onClick={() => { setBookCourt('Sân B — Premium (130K/giờ)'); openModal(); }}>Đặt ngay</button>
              </div>
            </div>
          </div>

          <div className="court-card reveal">
            <div className="court-preview">
              <CourtPreviewCanvas
                floorColorStart="#001530"
                floorColorEnd="#000820"
                lineColor="rgba(0, 255, 255, 0.6)"
              />
              <div className="court-badge badge-vip">VIP</div>
            </div>
            <div className="court-info">
              <div className="court-name">Sân C — VIP</div>
              <p className="court-desc">Sàn gỗ thi đấu chuẩn BWF, đèn chuyên nghiệp, phòng thay đồ riêng.</p>
              <div className="court-meta">
                <div className="court-price">200K <span>/ giờ</span></div>
                <button className="btn-book-sm" onClick={() => { setBookCourt('Sân C — VIP (200K/giờ)'); openModal(); }}>Đặt ngay</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== REVIEWS SECTION ===== */}
      <section id="reviews">
        <div className="section-header reveal">
          <span className="section-tag">✦ Phản hồi thực tế</span>
          <h2 className="section-title">Khách hàng nói gì?</h2>
        </div>
        <div className="reviews-grid">
          <div className="review-card reveal">
            <div className="review-stars">★★★★★</div>
            <p className="review-text">"Đặt sân nhanh lắm, chỉ mất 1 phút là xong. Sân sạch sẽ, ánh sáng rất tốt. Sẽ tiếp tục ủng hộ!"</p>
            <div className="reviewer">
              <div className="reviewer-avatar">T</div>
              <div>
                <div className="reviewer-name">Trần Minh Tuấn</div>
                <div className="reviewer-meta">Khách thường xuyên · Đà Nẵng</div>
              </div>
            </div>
          </div>

          <div className="review-card reveal">
            <div className="review-stars">★★★★★</div>
            <p className="review-text">"Tính năng nhắc lịch qua Zalo tiện cực. Trước giờ hay quên lịch chơi, giờ không còn nữa."</p>
            <div className="reviewer">
              <div className="reviewer-avatar">L</div>
              <div>
                <div className="reviewer-name">Lê Thị Hoa</div>
                <div className="reviewer-meta">Khách mới · Hội An</div>
              </div>
            </div>
          </div>

          <div className="review-card reveal">
            <div className="review-stars">★★★★☆</div>
            <p className="review-text">"Sân VIP chất lượng rất tốt, xứng đáng với giá tiền. Nhân viên thân thiện, chỗ đậu xe rộng."</p>
            <div className="reviewer">
              <div className="reviewer-avatar">N</div>
              <div>
                <div className="reviewer-name">Nguyễn Văn Bình</div>
                <div className="reviewer-meta">Khách thường xuyên · Đà Nẵng</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section id="faq">
        <div className="section-header reveal">
          <span className="section-tag">✦ Câu hỏi thường gặp</span>
          <h2 className="section-title">FAQ</h2>
        </div>
        <div className="faq-wrap">
          <div className={`faq-item reveal ${openFAQIndex === 0 ? 'open' : ''}`} onClick={() => toggleFAQ(0)}>
            <div className="faq-q">Tôi có thể đặt sân trước bao lâu? <span className="faq-icon">+</span></div>
            <div className="faq-a">Bạn có thể đặt sân trước tối đa 7 ngày. Hệ thống mở slot mới vào 0h mỗi ngày cho ngày thứ 8 tiếp theo.</div>
          </div>

          <div className={`faq-item reveal ${openFAQIndex === 1 ? 'open' : ''}`} onClick={() => toggleFAQ(1)}>
            <div className="faq-q">Hủy sân có bị mất tiền không? <span className="faq-icon">+</span></div>
            <div className="faq-a">Hủy trước 4 tiếng so với giờ đặt — hoàn tiền cọc 100% trong vòng 24h. Hủy muộn hơn sẽ không hoàn cọc. Chính sách minh bạch, không điều kiện ẩn.</div>
          </div>

          <div className={`faq-item reveal ${openFAQIndex === 2 ? 'open' : ''}`} onClick={() => toggleFAQ(2)}>
            <div className="faq-q">Có thể đặt nhiều giờ liên tiếp không? <span className="faq-icon">+</span></div>
            <div className="faq-a">Được! Bạn chọn số giờ thuê tối đa 3 giờ liên tiếp cho một lần đặt. Giá tính theo giờ, không tăng thêm khi thuê nhiều giờ.</div>
          </div>

          <div className={`faq-item reveal ${openFAQIndex === 3 ? 'open' : ''}`} onClick={() => toggleFAQ(3)}>
            <div className="faq-q">Có cho mượn vợt cầu lông không? <span className="faq-icon">+</span></div>
            <div className="faq-a">Có! Sân có dịch vụ cho thuê vợt 20K/cây và bán cầu tại chỗ. Bạn ghi chú khi đặt, nhân viên sẽ chuẩn bị sẵn khi bạn đến.</div>
          </div>
        </div>
      </section>

      {/* ===== CTA BOTTOM SECTION ===== */}
      <section id="cta-bottom">
        <h2 className="reveal">Sẵn sàng xuống sân chưa? 🏸</h2>
        <p className="reveal">Đặt sân ngay hôm nay — chỉ mất 60 giây, giữ chỗ ngay lập tức.</p>
        <button className="btn-primary reveal" onClick={openModal} style={{ fontSize: '18px', padding: '18px 48px' }}>
          ⚡ Đặt sân ngay bây giờ
        </button>
      </section>

      {/* ===== BOOKING MODAL ===== */}
      <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`} onClick={handleModalOverlayClick}>
        <div className="modal">
          <button className="modal-close" onClick={closeModal}>×</button>
          <h3>🏸 Đặt Sân Cầu Lông</h3>
          <form onSubmit={handleConfirmBook}>
            <div className="form-group">
              <label>Họ & tên</label>
              <input
                type="text"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                value={bookPhone}
                onChange={(e) => setBookPhone(e.target.value)}
                placeholder="0905 xxx xxx"
                required
              />
            </div>
            <div className="form-group">
              <label>Chọn sân</label>
              <select value={bookCourt} onChange={(e) => setBookCourt(e.target.value)}>
                <option value="Sân A — Standard (80K/giờ)">Sân A — Standard (80K/giờ)</option>
                <option value="Sân B — Premium (130K/giờ)">Sân B — Premium (130K/giờ)</option>
                <option value="Sân C — VIP (200K/giờ)">Sân C — VIP (200K/giờ)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Ngày chơi</label>
              <input
                type="date"
                value={bookDate}
                onChange={(e) => setBookDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Khung giờ</label>
              <select value={bookTime} onChange={(e) => setBookTime(e.target.value)}>
                <option value="06:00 – 07:00">06:00 – 07:00</option>
                <option value="07:00 – 08:00">07:00 – 08:00</option>
                <option value="08:00 – 09:00">08:00 – 09:00</option>
                <option value="17:00 – 18:00">17:00 – 18:00</option>
                <option value="18:00 – 19:00">18:00 – 19:00</option>
                <option value="19:00 – 20:00">19:00 – 20:00</option>
                <option value="20:00 – 21:00">20:00 – 21:00</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
              Xác nhận đặt sân →
            </button>
          </form>
        </div>
      </div>

      {/* ===== SUCCESS POPUP DIALOG ===== */}
      {showSuccess && (
        <>
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#0A1628',
              border: '1px solid #FFD700',
              borderRadius: '20px',
              padding: '40px',
              textAlign: 'center',
              zIndex: 300,
              fontFamily: "'Be Vietnam Pro', sans-serif",
              animation: 'fadeSlideDown 0.3s ease',
              width: '90%',
              maxWidth: '420px',
              boxShadow: '0 20px 80px rgba(0, 0, 0, 0.7), 0 0 50px rgba(255, 215, 0, 0.2)'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏸</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", color: '#FFD700', fontSize: '18px', fontWeight: 900, marginBottom: '8px' }}>
              Đặt sân thành công!
            </div>
            <div style={{ color: '#7A9BBF', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
              Mã đặt sân: <b style={{ color: '#fff', fontSize: '16px' }}>{bookingCode}</b>
              <br />
              Bạn sẽ nhận SMS xác nhận trong 5 phút.
            </div>
            <button
              onClick={handleCloseSuccess}
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                color: '#000',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '15px',
                boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
              }}
            >
              Tuyệt vời! 🎉
            </button>
          </div>
          {/* Backdrop for Success Popup */}
          <div
            onClick={handleCloseSuccess}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(5px)',
              zIndex: 299
            }}
          />
        </>
      )}
    </div>
  );
};
