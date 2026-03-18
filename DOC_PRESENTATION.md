# HƯỚNG DẪN TRIỂN KHAI VÀ THUYẾT TRÌNH BẢO VỆ (DEMO GUIDE)

## 1. Chuẩn bị (Trước khi lên bục Demo)

Hãy chắc chắn bạn đã chạy đồng thời 4 thành phần sau trên 4 terminal/tab console khác nhau:

1. **Khởi động n8n (Docker):**
   ```bash
   cd n8n
   docker-compose up -d
   ```
2. **Khởi động Backend:**
   ```bash
   cd backend
   npm run generate # Nếu thiết bị mới hoàn toàn chưa có db
   node bootstrap.js # Tạo dữ liệu organization/user mẫu
   npm run dev
   ```
3. **Khởi động Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
4. **Khởi động Simulator (GUI Control):**
   ```bash
   cd simulator
   npm run ui
   # Dashboard Simulator sẽ mở ở http://localhost:4060
   ```

**Checklist:** 
- Đã mở trình duyệt sẵn `http://localhost:5173` (Frontend)
- Đã mở tab `http://localhost:5678` (n8n - Có thể login và mở sẵn 1 workflow ví dụ "Factory")
- Đã mở tab `http://localhost:4060` (Simulator UI)

---

## 2. Kịch bản Thuyết Trình (Định thời: 5-8 phút)

### Bước 1: Giới thiệu & UC-Login (1 phút)
- **Hành động:** Trình chiếu web ở trang Login (`http://localhost:5173`).
- **Lời thoại:** "Chào thầy/cô, nhóm em xin demo dự án Hệ thống giám sát IoT Đa miền. Trước tiên để đảm bảo bảo mật, em xin phép Đăng nhập vào hệ thống dưới quyền Quản trị viên."
- **Nhập:** Organization Slug: `home` | Email: `admin@spla.local` | Mật khẩu: `admin123` -> Bấm Login.

### Bước 2: UC-View Dashboard & Đổi Domain (1 phút)
- **Hành động:** Trỏ chuột vào các thành phần trên Sidebar và các biểu đồ Gauge, Line Chart trên màn hình. Sau đó bấm đổi Domain từ *Smart Home* sang *Factory* (ở menu bên trái).
- **Lời thoại:** "Đây là màn hình Dashboard tổng quan. Điểm mạnh của dự án em là thiết kế Multi-domain. Khi em chuyển đổi cài đặt từ domain Smart Home sang Factory, các biểu đồ, tham số (như nhiệt độ, độ rung cơ học) sẽ tự động được Render lại để đáp ứng đúng nghiệp vụ của nhà máy mà không cần phải reload."

### Bước 3: UC-Send Sensor Data + UC-Process Data (Trọng tâm - 2 phút)
- **Hành động:** Chuyển qua tab UI Simulator. Chọn domain **Factory**. Bấm nút **"Next Step"** (Ở mức độ Baseline - Bình thường). Ngay lập tức mở tab **n8n**.
- **Lời thoại:** "Để có dữ liệu mô phỏng giống thật nhất, em đã viết một bộ Simulator riêng biệt. Khi Simulator gửi 1 gói dữ liệu (bắn Webhook), n8n sẽ đứng ra làm trung gian tiếp nhận (như thầy thấy các Node đang nháy xanh ở đây). Nó xử lý chuẩn hoá, bóc tách JSON và gửi về cho Core Backend Node.js để lưu trữ."

### Bước 4: UC-Generate & Receive Alert (1.5 phút)
- **Hành động:** Quay lại UI Simulator, chuyển Scenario qua bước **Warning** hoặc **Critical** và nhấn **Next Step**. Lập tức quay lại **Frontend Dashboard**. Chờ 1 giây để bảng Alert nổi đỏ, các biểu đồ dựng đứng lên.
- **Lời thoại:** "Đây là một Use Case cực kỳ quan trọng. Khi em gửi cố tình gửi lên số liệu vượt ngưỡng (ví dụ nhiệt độ máy nén tăng vọt), Backend ngay lập tức phát hiện thông qua thuật toán đánh giá Cảnh báo. Cảnh báo sẽ được lưu vào DB và phát Socket.io lên thẳng màn hình Dashboard như thầy vừa thấy, hoàn toàn thời gian thực!"

### Bước 5: Cấu hình linh hoạt Settings & Quản lý Device (Tính điểm mở rộng + 1.5 phút)
- **Hành động:** Nhấn vào mục **Settings** ở thanh Sidebar. Sửa một Ngưỡng Alert (Ví dụ: Chỉnh ngưỡng Nhiệt độ Critical từ 85 độ xuống 40 độ), bấm Save. Sau đó chuyển sang Simulator tiến hành bắn số liệu bình thường (nhiệt độ 50) nhưng Alert đỏ vẫn nổ. Thêm thao tác vào phần **Devices** để đổi tên 1 thiết bị.
- **Lời thoại:** "Không dừng lại ở việc hard-code các chỉ số. Hệ thống cho phép người Quản trị viên thay đổi cấu hình Ngưỡng (Threshold) bất kỳ lúc nào để phù hợp tiến độ vận hành. Em vừa đổi ngưỡng Cảnh báo xuống cực kì thấp, do đó dù Simulator đang bắn thông số mức độ thông thường, thì hệ thống vẫn phát hiện đó là Cảnh báo như yêu cầu mới thiết lập."

### Bước 6: Kết luận
- **Lời thoại:** "Với kiến trúc phân mảnh Micro-services/Modular, tách biệt luồng tiếp nhận (n8n) và nghiệp vụ (Node.js/React), hệ thống có khả năng mở rộng tốt và đáp ứng đủ các Use Cases của giám sát IoT thời gian thực. Em xin phép kết thúc phần trình bày."

---

## 3. Lường trước câu hỏi của Giảng viên (Q&A)

**Hỏi: Tại sao lại cần dùng n8n ở giữa mà không để Simulator bắn thẳng vào Backend?**
> **Trả lời:** "n8n đóng vai trò như một API Gateway và Message Broker. Trong thực tế, các thiết bị của các hãng khác nhau sẽ bắn ra định dạng JSON/MQTT khác nhau. n8n giúp chuẩn hoá định dạng (Normalize) về một format chung trước khi vào Backend của mình. Điều này giúp Core Backend luôn sạch sẽ, không phải gánh vác việc xử lý dị đồng nhất dữ liệu của hàng ngàn máy trạm.

**Hỏi: Hệ thống dùng gì để số liệu nhảy Real-time không tải lại trang? Phía Backend kiểm soát ra sao?**
> **Trả lời:** "Dạ em dùng WebSockets (thư viện Socket.io). Mỗi khi Backend Controller nhận xong dữ liệu chuẩn từ n8n, bên cạnh việc cắm Prisma lưu vào SQLite, hệ thống sẽ phát tín hiệu (emit) với Event `sensor_data` hoặc `alert_created` lên. React ở client sẽ lắng nghe qua Socket Context để trigger hàm update state, biểu đồ Chart.js tự động vẽ thêm line."

**Hỏi: Đổi Threshold xong tại sao Alert tự bắt được luôn? Backend kiểm tra kiểu gì?**
> **Trả lời:** "Trong `ingestController`, em có một hàm tên là `evaluateSeverity`. Mỗi data point bay vào sẽ được query trong DB tham chiếu lấy ra Threshold hiện hành của đúng loại Metric đó. Do là truy vấn lấy cấu hình mới nhất tại thời điểm Ingest, nên khi UI đổi Threshold thì logic đánh giá vi phạm cũng đổi ngay tức khắc ạ." 
