const https = require('https');

/**
 * Gửi thông báo đến Telegram khi có lịch đặt sân mới thành công
 * @param {Object} booking - Thông tin chi tiết lịch đặt sân đã được định dạng
 */
const sendBookingNotification = async (booking) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('⚠️ Bỏ qua gửi thông báo Telegram do thiếu cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong .env');
    return;
  }

  // Định dạng số tiền thành dạng tiền Việt Nam (VND)
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Tạo nội dung thông báo Markdown
  const message = `
🔔 *THÔNG BÁO CÓ LỊCH ĐẶT SÂN MỚI* 🔔

👤 *Khách hàng:* ${booking.customerName}
📞 *Số điện thoại:* ${booking.customerPhone || 'Không cung cấp'}
✉️ *Email:* ${booking.customerEmail || 'Không cung cấp'}

🏸 *Thông tin sân:*
• *Tên sân:* ${booking.courtName}
• *Ngày đặt:* ${booking.date}
• *Khung giờ:* ${booking.time}

💰 *Thanh toán:*
• *Phương thức:* ${booking.paymentMethod || 'Chưa chọn'}
• *Tiền cọc:* ${formatVND(booking.depositAmount || 0)}

📝 *Ghi chú:* ${booking.notes || 'Không có'}
  `.trim();

  const data = JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown'
  });

  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${token}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.ok) {
            console.log('✅ Đã gửi thông báo đặt sân thành công tới Telegram!');
            resolve(response);
          } else {
            console.error('❌ Lỗi từ Telegram API:', response.description);
            resolve(null);
          }
        } catch (e) {
          console.error('❌ Lỗi phân tích phản hồi Telegram:', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Lỗi kết nối gửi Telegram:', error.message);
      resolve(null); // Tránh crash ứng dụng khi lỗi kết nối mạng
    });

    req.write(data);
    req.end();
  });
};

module.exports = {
  sendBookingNotification
};
