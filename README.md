# 🌐 SPLA Platform - Multi-domain IoT Monitoring

**SPLA Platform** là một hệ thống giám sát IoT (Internet of Things) đa miền (Multi-domain) đa khách hàng (Multi-tenant) thời gian thực. Hệ thống được thiết kế theo kiến trúc Software Product Line (SPLA) để thu thập, chuẩn hóa, lưu trữ và cảnh báo dữ liệu thống kê từ nhiều lĩnh vực khác nhau như Nhà thông minh (Smart Home), Nhà máy (Factory), Bệnh viện (Hospital), Nông trại (Farm) và Giao thông (Traffic).

## 🏢 1. Kiến trúc hệ thống

Dự án áp dụng kiến trúc phân tán hiện đại, bao gồm 4 thành phần (module) cốt lõi:

1. **Simulator (Bộ mô phỏng dữ liệu thiết bị)**
   - Đóng vai trò là các thiết bị IoT (Sensors) đang hoạt động.
   - Hỗ trợ các kịch bản thời gian thực (baseline bình thường, warning cảnh báo, critical nguy hiểm).
   - Giao diện UI control panel trực quan giúp khởi chạy theo chủ đích.
2. **Data Ingestion Router (n8n)**
   - Sử dụng workflow engine `n8n` chạy trên Docker.
   - Nhận Webhook từ Simulator, xử lý làm sạch dữ liệu (Normalize Payload) và chuyển tiếp dữ liệu đến Backend qua chuẩn REST.
3. **Core Backend (Node.js & Express)**
   - Xử lý logic nghiệp vụ trung tâm, đánh giá ngưỡng cảnh báo (Thresholds).
   - Lưu trữ dữ liệu và sinh ra Alert (cảnh báo).
   - Sử dụng Socket.IO để phát sóng (broadcast) thời gian thực số liệu lên giao diện.
4. **Vite React Frontend**
   - Ứng dụng web hiển thị Dashboard giám sát thời gian thực theo hướng Multi-domain.
   - Biểu diễn thông số bằng các biểu đồ tương tác (Line Chart, Gauge) và các bảng cảnh báo.
   - Giao diện quản lý thiết bị, ngưỡng cảnh báo và xác thực người dùng.

### 👋 Luồng dữ liệu (SPLA Architecture)
```text
Simulator/Device 
  -> n8n Webhook 
  -> Data Normalization (n8n Workflow)
  -> Core Backend Ingest API
  -> Threshold Evaluation (Backend)
  -> Persist SensorData + Alert (SQLite)
  -> Socket.IO Broadcast (to specific Organization/Domain rooms)
  -> Frontend Dashboard Render + Realtime Updates
```

### 🌟 5 Biến thể hỗ trợ (Domains)
- 🏠 **Smart Home** — Nhiệt độ, Khói, Cửa, Chuyển động.
- 🏥 **Hospital** — Nhịp tim, SpO2, Huyết áp.
- 🏭 **Factory** — Nhiệt độ máy, Rọc, Áp suất.
- 🚗 **Traffic** — Mật độ xe, Tai nạn, Tắc đường.
- 🌾 **Farm** — Độ ẩm đất, Ánh sáng, pH.

## 🛠 2. Công nghệ sử dụng (Tech Stack)

- **Frontend:** React.js 19, Vite, TailwindCSS 4, Chart.js.
- **Backend:** Node.js, Express.js.
- **Real-time:** Socket.IO.
- **Cơ sở dữ liệu:** SQLite thông qua ORM Prisma (dễ dàng scale lên PostgreSQL).
- **Workflow & Integration:** n8n (Docker container).
- **Simulator**: Node.js + Axios (Kèm UI Server).

## 📁 3. Cấu trúc dự án

```text
swd392/
├── backend/          # Core Platform (Node.js + Express + Socket.IO + Prisma)
│   ├── prisma/       # Database schema (SQLite) & Seeds
│   ├── src/          # Source code backend (Controllers, Routes, Services)
├── frontend/         # Dashboard Web App (React 19 + Vite + TailwindCSS 4)
│   ├── src/
│   │   ├── components/  # Các thành phần giao diện, Dashboard Web Widgets
│   │   ├── context/     # Socket.IO Context
├── n8n/              # Workflow Engine (Cấu hình Docker & JSON Workflows)
│   ├── docker-compose.yml
│   └── workflow-*.json
└── simulator/        # Trình giả lập luồng dữ liệu IoT theo kịch bản
    ├── index.js      # CLI Simulator
    ├── uiServer.js   # Giao diện điều khiển Simulator UI
    └── scenarios/    # Các kịch bản tạo dữ liệu giả lập (JSON)
```

## 🚀 4. Hướng dẫn chạy dự án (Run Local)

### 4.1. Core Backend
```bash
cd backend
npm install
npm run prisma:migrate -- --name init_db
npm run dev
# -> Chạy tại: http://localhost:3000
```
> **Lưu ý:** Backend sẽ tự động *seed* dữ liệu mặc định hệ thống nếu Database trống.  
> Tài khoản Admin mặc định: `admin@spla.local` / `admin123`.

### 4.2. Khởi động n8n (Workflow Engine Router)
```bash
cd n8n
docker compose up -d
# -> n8n UI tại: http://localhost:5678
```
> **Lưu ý:** Cần phải truy cập n8n UI, tạo Use Account nội bộ, sau đó Import các file `workflow-*.json` vào và bật (Publish/Activate) chúng.

### 4.3. Dashboard Frontend
```bash
cd frontend
npm install
npm run dev
# -> Dashboard Web tại: http://localhost:5173
```
> **Tuỳ chọn:** Bạn có thể copy `frontend/.env.example` thành `frontend/.env.local` để tuỳ chỉnh biến môi trường (Ví dụ: `VITE_API_BASE`, `VITE_SOCKET_URL`) nếu chạy trên port khác.

### 4.4. Trình giả lập dữ liệu IoT (Simulator)
```bash
cd simulator
npm install

# Mở giao diện Control Panel trực quan (Khuyến nghị dùng lúc Thuyết trình)
npm run ui
# -> Control UI tại: http://localhost:4060

# --- CÁC LỆNH CLI NẾU MUỐN CHẠY BẰNG TERMINAL ---

# Chạy tự động (Deterministic Demo mode) cho tất cả các domain qua n8n
node index.js all n8n 3000 scenario

# Chạy cho 1 domain cụ thể (vd: Hospital)
node index.js hospital n8n 3000 scenario

# Chạy gửi trực tiếp Backend (bỏ qua n8n router)
node index.js home direct 3000 scenario
```

## 📡 5. Tham chiếu REST APIs & WebSockets

### 🔌 Cốt lõi REST API Endpoints
| HTTP Method | API Endpoint | Ý nghĩa |
|--------|----------|--------|
| `POST` | `/api/ingest` | Khai báo Dữ liệu Cảm biến cho Backend. |
| `GET` | `/api/config/*` | Cấu hình Tổ chức, Variants Dashboard. |
| `GET` | `/api/devices` | Danh sách thiết bị (Devices). |
| `GET` | `/api/logs` | Timeline luồng dữ liệu thu thập (SensorData). |
| `GET/PUT` | `/api/thresholds` | Đọc hoặc Mức cập nhật Ngưỡng Cảnh cáo. |
| `GET/PUT` | `/api/alerts` | Danh sách các Cảnh báo vi phạm (Alerts) và Xử lý. |
| `POST` | `/api/auth/*` | Các luồng Đăng nhập, Đăng ký, Lấy Profile JWT. |

### ⚡ Socket.IO Events
| Event Name | Chiều tương tác | Mô tả |
|-------|-----------|--------|
| `device_update` | Backend -> Front | Phát sóng Realtime chỉ số Sensor tới Frontend. |
| `alert_created` | Backend -> Front | Bắn sự kiện khi có Cảnh báo vượt Ngưỡng phát sinh. |
| `join_scope` | Front -> Backend | Yêu cầu tham gia Room Socket theo tên Domain/Org. |
| `leave_scope` | Front -> Backend | Rời khỏi Room Socket khi chuyển Domain. |