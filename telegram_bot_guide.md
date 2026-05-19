# Hướng Dẫn Tích Hợp Telegram Bot Cho Website Đặt Sân Cầu Lông

Tài liệu này hướng dẫn chi tiết từng bước cách tạo một Telegram Bot, lấy các thông tin cấu hình cần thiết (`TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID`) để kích hoạt chức năng tự động gửi thông báo đặt sân thành công về điện thoại của chủ sân.

---

## 📋 Mục lục
1. [Bước 1: Tạo Telegram Bot qua @BotFather](#bước-1-tạo-telegram-bot-qua-botfather)
2. [Bước 2: Lấy Chat ID của bạn (hoặc Nhóm)](#bước-2-lấy-chat-id-của-bạn-hoặc-nhóm)
3. [Bước 3: Cấu hình file `.env` ở Backend](#bước-3-cấu-hình-file-env-ở-backend)
4. [Bước 4: Kiểm thử hoạt động (Test)](#bước-4-kiểm-thử-hoạt-động-test)

---

## 🤖 Bước 1: Tạo Telegram Bot qua @BotFather

**@BotFather** là công cụ chính thức của Telegram dùng để tạo và quản lý các bot.

1. Mở ứng dụng Telegram trên điện thoại hoặc máy tính của bạn.
2. Tìm kiếm từ khóa **`@BotFather`** (chọn tài khoản có tích xanh xác minh).
3. Nhấn nút **Start** hoặc gửi tin nhắn `/start`.
4. Gửi lệnh `/newbot` để tạo bot mới.
5. `@BotFather` sẽ yêu cầu bạn đặt tên cho Bot (ví dụ: `SmashCourt Notification`).
6. Tiếp theo, đặt **username** cho Bot. Username phải kết thúc bằng chữ `bot` (ví dụ: `smashcourt_booking_bot` hoặc `SmashCourtNotificationBot`).
7. Sau khi đặt thành công, `@BotFather` sẽ gửi lại cho bạn một đoạn mã thông tin chúc mừng kèm theo **HTTP API Token** (Token có dạng như thế này: `7182930491:AAHkdJgH...`).
   
   > [!IMPORTANT]
   > Hãy copy đoạn mã này. Đây chính là **`TELEGRAM_BOT_TOKEN`** của bạn. Giữ bí mật mã này để bảo mật!

8. **Kích hoạt Bot**: Hãy click vào đường link dẫn tới bot của bạn (dạng `t.me/username_bot_cua_ban`) và nhấn **Start** để cho phép bot gửi tin nhắn cho bạn.

---

## 🆔 Bước 2: Lấy Chat ID của bạn (hoặc Nhóm)

**Chat ID** là mã định danh duy nhất của bạn hoặc nhóm chat nơi bạn muốn nhận thông báo.

### Cách A: Lấy Chat ID cá nhân (Chỉ nhận tin nhắn riêng)
1. Trên Telegram, tìm kiếm bot **`@GetIdsBot`** hoặc **`@userinfobot`**.
2. Nhấn **Start**.
3. Bot sẽ phản hồi lại thông tin tài khoản của bạn, trong đó có phần `Id` (một dãy số dạng `123456789`).
4. Dãy số này chính là **`TELEGRAM_CHAT_ID`** cá nhân của bạn.

### Cách B: Lấy Chat ID nhóm (Gửi thông báo vào Nhóm của các chủ sân)
1. Tạo một nhóm chat (Group) trên Telegram và thêm các chủ sân/nhân viên cùng với **Bot của bạn** vào nhóm.
2. Tìm kiếm bot **`@GetIdsBot`** và thêm nó vào nhóm.
3. Ngay khi được thêm vào, bot sẽ tự động hiển thị ID của nhóm (thường bắt đầu bằng dấu trừ, ví dụ: `-1002938491823`).
4. Mã bắt đầu bằng dấu `-` đó chính là **`TELEGRAM_CHAT_ID`** của nhóm. Sau khi lấy xong ID, bạn có thể xóa bot `@GetIdsBot` ra khỏi nhóm.

---

## 🛠️ Bước 3: Cấu hình file `.env` ở Backend

1. Mở file `backend/.env` trong thư mục dự án của bạn:
   [backend/.env](file:///d:/dowloal/Website%20Đặt%20Lịch%20Sân%20Câu%20lông/backend/.env)
2. Điền các mã bạn vừa lấy được vào:
   ```env
   # Cấu hình Telegram Bot gửi thông báo đặt sân
   TELEGRAM_BOT_TOKEN=điền_token_bot_ở_bước_1_vào_đây
   TELEGRAM_CHAT_ID=điền_chat_id_ở_bước_2_vào_đây
   ```
3. Lưu file lại và khởi động lại Server backend (nếu đang chạy) để cấu hình mới được áp dụng.

---

## 🚀 Bước 4: Kiểm thử hoạt động (Test)

1. Đảm bảo Backend và Frontend đang hoạt động bình thường.
2. Truy cập vào website đặt sân cầu lông của bạn.
3. Thực hiện đặt thử một sân bất kỳ (điền tên khách hàng, số điện thoại, chọn giờ, phương thức thanh toán).
4. Nhấn **Xác nhận đặt sân**.
5. Kiểm tra Telegram: Bạn sẽ lập tức nhận được tin nhắn từ Bot với giao diện thông báo chuyên nghiệp:

> 🔔 **THÔNG BÁO CÓ LỊCH ĐẶT SÂN MỚI** 🔔
> 
> 👤 **Khách hàng:** Nguyễn Văn A  
> 📞 **Số điện thoại:** 0901234567  
> ✉️ **Email:** nva@gmail.com  
> 
> 🏸 **Thông tin sân:**  
> • **Tên sân:** Sân VIP  
> • **Ngày đặt:** 2026-05-20  
> • **Khung giờ:** 18:00 - 20:00  
> 
> 💰 **Thanh toán:**  
> • **Phương thức:** Chuyển khoản  
> • **Tiền cọc:** 120.000 ₫  
> 
> 📝 **Ghi chú:** Đặt sân tổ chức giải đấu nội bộ.

---

> [!TIP]
> Việc gửi thông báo được xử lý bất đồng bộ trong background. Khách hàng trên trang web sẽ nhận được thông báo đặt sân thành công ngay lập tức mà không cần đợi Telegram xử lý xong, đảm bảo tốc độ phản hồi cực nhanh và trải nghiệm người dùng tuyệt vời!

---

## 📊 Bước 5: Tra cứu Thống Kê qua Bot Telegram (Tính Năng Mới)

Bên cạnh việc tự động báo tin vui khi có khách đặt sân, bạn có thể chủ động nhắn tin trực tiếp cho con Bot để yêu cầu xuất báo cáo thống kê doanh thu và lịch đặt bất kỳ lúc nào:

1. Vào cuộc trò chuyện với Bot **SmashCourt Cầu Lông**.
2. Gửi một trong các câu lệnh sau:
   * **`/thongke`** hoặc nhắn chữ **`thống kê`**: Xem báo cáo tổng quan **Hôm nay** (Tổng lượt đặt, Tổng số khách đặt, Tổng tiền cọc đã thu, và danh sách chi tiết các sân + giờ đặt kèm SĐT).
   * **`/thongke homqua`** (hoặc nhắn **`thống kê hôm qua`**): Xem báo cáo chi tiết của **Ngày hôm qua**.
   * **`/help`**: Nhận hướng dẫn danh sách các câu lệnh.

> [!WARNING]
> **BẢO MẬT TUYỆT ĐỐI**: Vì lý do bảo mật dữ liệu doanh thu của sân, **Bot chỉ trả lời tin nhắn từ duy nhất tài khoản Telegram của bạn** (trùng khớp với `TELEGRAM_CHAT_ID` đã cấu hình). Bất kỳ tài khoản lạ nào nhắn tin cho Bot đều sẽ bị bỏ qua và không nhận được bất kỳ thông tin nào!
