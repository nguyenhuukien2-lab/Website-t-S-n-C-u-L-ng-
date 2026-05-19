const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendBookingNotification } = require('../utils/telegram');
const authorize = require('../utils/rbac_guard');

// GET /api/bookings - Lấy tất cả lịch đặt sân từ database
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM bookings ORDER BY booking_date DESC, id DESC');
    
    // Định dạng lại dữ liệu để khớp hoàn toàn với những gì Frontend yêu cầu
    const formattedBookings = result.rows.map(b => {
      let dateString = '';
      if (b.booking_date) {
        const d = new Date(b.booking_date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateString = `${year}-${month}-${day}`;
      }
      
      return {
        id: b.id,
        courtId: b.court_id,
        courtName: b.court_name,
        date: dateString,
        time: b.time_slot,
        status: b.status,
        customerName: b.customer_name,
        customerPhone: b.customer_phone || '',
        customerEmail: b.customer_email || '',
        paymentMethod: b.payment_method || '',
        depositAmount: b.deposit_amount || 0,
        notes: b.notes || '',
      };
    });
    
    res.json({ success: true, data: formattedBookings });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đặt sân:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi server khi lấy danh sách đặt sân' });
  }
});

// POST /api/bookings - Tạo lịch đặt sân mới lưu vào database với các cột chuyên biệt
router.post('/', async (req, res) => {
  const { 
    courtId, 
    courtName, 
    date, 
    startTime, 
    endTime, 
    notes, 
    customerName,
    customerPhone,
    customerEmail,
    paymentMethod,
    depositAmount
  } = req.body;

  if (!courtId || !date || !startTime || !endTime) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đầy đủ thông tin đặt sân' });
  }

  try {
    const timeSlot = `${startTime} - ${endTime}`;
    const insertQuery = `
      INSERT INTO bookings (
        court_id, 
        court_name, 
        booking_date, 
        time_slot, 
        status, 
        customer_name, 
        customer_phone, 
        customer_email, 
        payment_method, 
        deposit_amount, 
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      parseInt(courtId),
      courtName || `Sân #${courtId}`,
      date,
      timeSlot,
      'pending',
      customerName || 'Khách hàng mới',
      customerPhone || '',
      customerEmail || '',
      paymentMethod || 'Tiền mặt',
      depositAmount ? parseInt(depositAmount) : 0,
      notes || '',
    ];

    const result = await db.query(insertQuery, values);
    const newBooking = result.rows[0];

    // Định dạng lại ngày để gửi về cho Client hiển thị chuẩn
    const d = new Date(newBooking.booking_date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const formattedBooking = {
      id: newBooking.id,
      courtId: newBooking.court_id,
      courtName: newBooking.court_name,
      date: dateString,
      time: newBooking.time_slot,
      status: newBooking.status,
      customerName: newBooking.customer_name,
      customerPhone: newBooking.customer_phone,
      customerEmail: newBooking.customer_email,
      paymentMethod: newBooking.payment_method,
      depositAmount: newBooking.deposit_amount,
      notes: newBooking.notes || '',
    };

    // Gửi thông báo đến Telegram trong background (không await để người dùng không phải chờ)
    sendBookingNotification(formattedBooking).catch((err) => {
      console.error('❌ Lỗi khi gửi thông báo Telegram:', err.message);
    });

    res.status(201).json({ success: true, message: 'Đặt sân thành công!', data: formattedBooking });
  } catch (error) {
    console.error('Lỗi khi đặt sân:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi server khi thực hiện đặt sân' });
  }
});

// PUT /api/bookings/:id/status - Cập nhật trạng thái lịch đặt sân (Confirmed hoặc Cancelled)
router.put('/:id/status', authorize('Bookings', 'Confirm'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'confirmed' | 'cancelled' | 'pending'

  if (!status) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp trạng thái mới' });
  }

  try {
    const checkBooking = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (checkBooking.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy lịch đặt sân tương ứng' });
    }

    const updateQuery = 'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *';
    const result = await db.query(updateQuery, [status.toLowerCase(), id]);
    const updatedBooking = result.rows[0];

    // Trả về dữ liệu định dạng chuẩn của Frontend
    const formattedBooking = {
      id: updatedBooking.id,
      courtId: updatedBooking.court_id,
      courtName: updatedBooking.court_name,
      date: new Date(updatedBooking.booking_date).toISOString().split('T')[0],
      time: updatedBooking.time_slot,
      status: updatedBooking.status.charAt(0).toUpperCase() + updatedBooking.status.slice(1), // Viết hoa chữ cái đầu cho khớp FE
      customerName: updatedBooking.customer_name,
      customerPhone: updatedBooking.customer_phone,
      customerEmail: updatedBooking.customer_email,
      paymentMethod: updatedBooking.payment_method,
      depositAmount: updatedBooking.deposit_amount,
      notes: updatedBooking.notes || '',
    };

    res.json({ 
      success: true, 
      message: `Đã cập nhật trạng thái lịch đặt thành ${status}!`,
      data: formattedBooking 
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái đặt sân:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi server khi cập nhật trạng thái đặt sân' });
  }
});

module.exports = router;
