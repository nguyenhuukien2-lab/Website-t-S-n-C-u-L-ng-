require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { sendBookingNotification } = require('./telegram');

const mockBooking = {
  customerName: 'Nguyễn Hữu Kiên (Test)',
  customerPhone: '0901234567',
  customerEmail: 'huukien.dev@gmail.com',
  courtName: 'Sân VIP (Tầng 3)',
  date: '2026-05-20',
  time: '18:00 - 20:00',
  paymentMethod: 'Chuyển khoản Ngân hàng',
  depositAmount: 120000,
  notes: 'Chúc mừng bạn đã cấu hình thành công hệ thống thông báo Telegram Bot tự động!'
};

console.log('🔄 Đang gửi thử nghiệm thông báo đặt sân tới Telegram của bạn...');
sendBookingNotification(mockBooking)
  .then((res) => {
    if (res) {
      console.log('\n✅ THÀNH CÔNG! Bạn hãy kiểm tra ứng dụng Telegram xem Bot đã gửi tin nhắn mẫu đến chưa nhé!');
    } else {
      console.log('\n❌ THẤT BẠI: Vui lòng kiểm tra lại TOKEN và CHAT_ID trong file backend/.env.');
    }
  })
  .catch((err) => {
    console.error('❌ Lỗi:', err.message);
  });
