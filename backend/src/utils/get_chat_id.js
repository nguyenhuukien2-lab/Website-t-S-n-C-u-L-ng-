require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const https = require('https');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token || token === 'your_telegram_bot_token_here') {
  console.error('\n❌ Thất bại: Bạn chưa điền TELEGRAM_BOT_TOKEN vào file backend/.env!');
  console.log('👉 Vui lòng mở file backend/.env, điền token thực tế của bot vào dòng 11 rồi lưu lại nhé.\n');
  process.exit(1);
}

console.log('🔄 Đang kết nối tới Telegram API để quét tin nhắn mới từ Bot của bạn...');

const url = `https://api.telegram.org/bot${token}/getUpdates`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (!response.ok) {
        console.error('❌ Lỗi từ Telegram API:', response.description);
        return;
      }

      const updates = response.result;
      if (updates.length === 0) {
        console.log('\n⚠️ Không tìm thấy tin nhắn nào gửi tới Bot của bạn.');
        console.log('👉 Hướng dẫn khắc phục:');
        console.log('   1. Hãy đảm bảo bạn đã nhấn nút "START" trong cuộc trò chuyện với Bot của bạn.');
        console.log('   2. Gửi thêm một vài tin nhắn bất kỳ cho Bot (ví dụ: "hello", "test").');
        console.log('   3. Sau đó chạy lại script này.\n');
        return;
      }

      console.log(`\n🎉 Tìm thấy ${updates.length} tương tác gần đây!\n`);
      
      const foundChats = new Map();
      updates.forEach((update) => {
        const message = update.message || update.edited_message;
        if (message && message.chat) {
          const chat = message.chat;
          const key = chat.id;
          foundChats.set(key, {
            id: chat.id,
            name: chat.first_name + (chat.last_name ? ' ' + chat.last_name : ''),
            username: chat.username || 'Không có',
            type: chat.type,
            text: message.text || '[Tệp tin/Hình ảnh]'
          });
        }
      });

      console.log('======= DANH SÁCH CHAT ID TÌM THẤY =======');
      foundChats.forEach((chat) => {
        console.log(`👤 Tên người dùng/Nhóm: ${chat.name} (@${chat.username})`);
        console.log(`🆔 Chat ID: \x1b[32m${chat.id}\x1b[0m`);
        console.log(`🏷️ Loại chat: ${chat.type}`);
        console.log(`💬 Tin nhắn cuối: "${chat.text}"`);
        console.log('------------------------------------------');
      });

      console.log('\n💡 Bạn hãy copy dãy số Chat ID ở trên (kèm dấu trừ nếu là Nhóm) và điền vào dòng 12 trong file backend/.env nhé!');
    } catch (e) {
      console.error('❌ Lỗi phân tích phản hồi:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('❌ Lỗi kết nối mạng:', e.message);
});
