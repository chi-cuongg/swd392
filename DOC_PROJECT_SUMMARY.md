# TÀI LIỆU MÔ TẢ DỰ ÁN: SPLA PLATFORM - MULTI-DOMAIN IOT MONITORING

## 1. Giới thiệu chung
**SPLA Platform** là một hệ thống giám sát IoT (Internet of Things) đa miền (Multi-domain) thời gian thực. Hệ thống được thiết kế để thu thập, chuẩn hóa, lưu trữ và cảnh báo dữ liệu thống kê từ nhiều lĩnh vực khác nhau như Nhà thông minh (Smart Home), Nhà máy (Factory), Bệnh viện (Hospital), Nông trại (Farm) và Giao thông (Traffic).

Dự án áp dụng kiến trúc phân tán hiện đại, tách biệt hoàn toàn giữa việc sinh ra dữ liệu, router định tuyến và lõi xử lý logic trung tâm. 

## 2. Kiến trúc hệ thống
Hệ thống bao gồm 4 thành phần (module) cốt lõi:

1. **Simulator (Bộ mô phỏng dữ liệu thiết bị)**
   - Đóng vai trò là các thiết bị IoT (Sensors) đang hoạt động.
   - Hỗ trợ các kịch bản thời gian thực (baseline bình thường, warning cảnh báo, critical nguy hiểm).
   - Giao diện UI control panel trực quan giúp khởi chạy theo chủ đích thay vì hoàn toàn ngẫu nhiên.
2. **Data Ingestion Router (n8n)**
   - Sử dụng workflow engine `n8n` chạy trên Docker.
   - Nhận Webhook từ Simulator, xử lý làm sạch dữ liệu (Normalize Payload) và chuyển tiếp dữ liệu đến Backend qua chuẩn REST.
3. **Core Backend (Node.js & Express)**
   - Xử lý logic nghiệp vụ trung tâm.
   - So sánh dữ liệu thiết bị gửi lên với cấu hình Ngưỡng (Threshold) hiện tại bằng thuật toán đánh giá (evaluateSeverity) linh hoạt.
   - Nếu dữ liệu vi phạm ngưỡng, sẽ sinh ra Alert và lưu xuống cơ sở dữ liệu.
   - Sử dụng Socket.io để phát sóng (broadcast) thời gian thực số liệu lên giao diện.
4. **Vite React Frontend**
   - Ứng dụng web hiển thị Dashboard giám sát thời gian thực.
   - Hiển thị theo từng Domain (phân chia context rõ ràng).
   - Biểu diễn thông số bằng các biểu đồ tương tác (Line Chart, Gauge) và các bảng cảnh báo trực quan.
   - Giao diện quản lý cấu hình cảnh báo, quản lý thiết bị và xác thực người dùng.

## 3. Công nghệ sử dụng
- **Frontend:** React.js 19, Vite, TailwindCSS 4, Chart.js.
- **Backend:** Node.js, Express.js.
- **Real-time:** Socket.io (cả Front và Back).
- **Cơ sở dữ liệu:** SQLite thông qua ORM Prisma (dễ dàng scale lên PostgreSQL nhờ Prisma).
- **Workflow & Integration:** n8n (Docker container).

## 4. Các Use Case (Chức năng cốt lõi)**
1. **Đăng nhập và Phân quyền:** Xác thực người dùng (JWT) để bảo vệ dashboard.
2. **Xem Dashboard & Đổi Domain:** Cập nhật các widget hiển thị thời gian thực theo cấu hình riêng của từng Domain.
3. **Quản lý thiết bị:** Nhận diện và cho phép cập nhật thông tin thiết bị đang kết nối tới mạng.
4. **Phát trực tiếp & Xử lý dữ liệu dạng luồng:** n8n nhận dữ liệu -> Core Node.js xử lý ngưỡng.
5. **Cảnh báo tự động (Alerting):** Phát hiện bất thường từ luồng dữ liệu thời gian thực và nổi cảnh báo đỏ.
6. **Cấu hình Ngưỡng (Threshold Control):** Cho phép người dùng tùy biến mức độ an toàn (Warn/Critical) ngay trên giao diện UI.

### Bảng Use Case theo ID
| ID | Use Case | Actor | Mo ta ngan | Man hinh/API lien quan |
| --- | --- | --- | --- | --- |
| UC-01 | Register Account | End User | Tao tai khoan moi bang email/mat khau. | Auth API (backend) |
| UC-02 | Login Account | End User | Dang nhap de truy cap he thong. | Login UI, Auth API |
| UC-03 | Reset Password | End User | Gui yeu cau doi mat khau khi quen. | Auth API (backend) |
| UC-04 | View Dashboard | End User | Xem realtime metrics, chart, status. | Dashboard UI |
| UC-05 | Receive Alert | End User | Nhan canh bao khi vuot nguong. | Alert panel, Socket.io |
| UC-06 | Manage Devices | Administrator | Them/sua/xoa thong tin thiet bi. | Manage Devices UI, /devices API |
| UC-07 | Configure Domain | Administrator | Thiet lap nguong canh bao theo domain/metric. | Configure Thresholds UI, /thresholds API |
| UC-08 | Send Sensor Data | IoT Device/Simulator | Gui du lieu sensor vao he thong. | Simulator UI, /ingest API |
| UC-09 | Process Data | Workflow Engine (n8n) | Xu ly va chuan hoa data truoc khi vao core. | n8n workflow |
| UC-10 | Send Notification | Notification Service | Gui canh bao qua Email/Telegram (tuong lai). | Alert service (extension) |
| UC-11 | Analyze Data | AI Service | Phan tich du lieu nang cao (tuong lai). | AI service (extension) |
| UC-12 | Switch Domain | End User | Doi domain va cap nhat widget tuong ung. | Sidebar Domain selector |
