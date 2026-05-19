const https = require('https');
const db = require('../db');

let offset = 0;
let isPolling = false;

const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

/**
 * Gửi yêu cầu API đến Telegram
 */
const apiCall = (method, payload) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === 'your_telegram_bot_token_here') return Promise.resolve(null);

  const data = JSON.stringify(payload);
  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${token}/${method}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.write(data);
    req.end();
  });
};

/**
 * Xử lý lệnh nhận được từ chủ sân
 */
const handleMessage = async (message) => {
  const chatId = message.chat.id;
  const text = (message.text || '').trim().toLowerCase();

  // Chỉ phản hồi tin nhắn từ Chủ Sân để bảo mật thông tin đặt lịch
  const configChatId = String(process.env.TELEGRAM_CHAT_ID);
  if (String(chatId) !== configChatId) {
    console.log(`⚠️ Nhận lệnh Telegram từ Chat ID lạ (${chatId}). Bỏ qua vì lý do bảo mật.`);
    return;
  }

  // Lệnh: /thongke hoặc thống kê
  if (text.startsWith('/thongke') || text.includes('thống kê') || text.includes('thong ke') || text.startsWith('/today')) {
    try {
      const isYesterday = text.includes('hôm qua') || text.includes('hom qua') || text.includes('yesterday') || text.includes('homqua');
      
      let dateQuery = 'CURRENT_DATE';
      let dateLabel = 'HÔM NAY';
      if (isYesterday) {
        dateQuery = 'CURRENT_DATE - 1';
        dateLabel = 'HÔM QUA';
      }

      // Lấy danh sách đặt lịch
      const query = `
        SELECT * FROM bookings 
        WHERE booking_date = ${dateQuery}
        ORDER BY court_name ASC, time_slot ASC
      `;
      const result = await db.query(query);
      const bookings = result.rows;

      // Lấy ngày định dạng thân thiện
      const dateResult = await db.query(`SELECT TO_CHAR(${dateQuery}, 'DD/MM/YYYY') as formatted_date`);
      const dateString = dateResult.rows[0].formatted_date;

      const totalBookings = bookings.length;
      const totalMoney = bookings.reduce((sum, b) => sum + (b.deposit_amount || 0), 0);
      const uniqueCustomers = new Set(bookings.map(b => b.customer_phone || b.customer_name)).size;

      let detailsText = '';
      if (totalBookings > 0) {
        detailsText = bookings.map((b, idx) => {
          return `${idx + 1}. *${b.court_name}* | Khung giờ: ${b.time_slot}\n   👤 Khách: ${b.customer_name} (${b.customer_phone || 'Không có SĐT'})\n   💰 Tiền cọc: ${formatVND(b.deposit_amount || 0)}`;
        }).join('\n\n');
      } else {
        detailsText = '_Không có lượt đặt sân nào._';
      }

      const responseMessage = `
📊 *BÁO CÁO THỐNG KÊ ĐẶT SÂN ${dateLabel}*
📅 Ngày: *${dateString}*

🏸 *Tổng số lượt đặt:* ${totalBookings} lượt
👤 *Tổng số khách đặt:* ${uniqueCustomers} người
💰 *Tổng tiền cọc thu về:* ${formatVND(totalMoney)}

📋 *Chi tiết danh sách đặt sân:*
${detailsText}
      `.trim();

      await apiCall('sendMessage', {
        chat_id: chatId,
        text: responseMessage,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('❌ Lỗi khi thực hiện lệnh thống kê:', error.message);
      await apiCall('sendMessage', {
        chat_id: chatId,
        text: '❌ Đã xảy ra lỗi hệ thống khi truy xuất dữ liệu thống kê đặt sân.'
      });
    }
  } 
  // Lệnh: /help hoặc trợ giúp
  else if (text === '/start' || text === '/help' || text.includes('help') || text.includes('trợ giúp') || text.includes('tro giup')) {
    const helpMessage = `
🏸 *Hệ thống SmashCourt Badminton Bot* 🏸

Chào bạn! Đây là các lệnh bạn có thể dùng để xem thống kê đặt sân ngay lập tức:

📊 */thongke* hoặc *thống kê* - Xem thống kê đặt sân của *Hôm nay*.
📅 */thongke homqua* - Xem thống kê đặt sân của *Hôm qua*.
❓ */help* - Xem lại hướng dẫn này.
    `.trim();

    await apiCall('sendMessage', {
      chat_id: chatId,
      text: helpMessage,
      parse_mode: 'Markdown'
    });
  }
};

/**
 * Khởi động vòng lặp Long Polling lắng nghe tin nhắn từ Telegram
 */
const startPolling = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === 'your_telegram_bot_token_here') {
    return;
  }

  if (isPolling) return;
  isPolling = true;
  console.log('🤖 Đã kích hoạt thành công Telegram Bot Listener! Đang đợi lệnh điều khiển...');

  const poll = async () => {
    try {
      const response = await apiCall('getUpdates', {
        offset: offset,
        timeout: 30
      });

      if (response && response.ok && response.result) {
        for (const update of response.result) {
          offset = update.update_id + 1;
          if (update.message) {
            await handleMessage(update.message);
          }
        }
      }
    } catch (e) {
      console.error('❌ Lỗi kết nối Telegram Polling:', e.message);
    }
    // Lặp lại sau 1 giây
    setTimeout(poll, 1000);
  };

  poll();
};

module.exports = {
  startPolling
};
