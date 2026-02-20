# Smart Monitoring Platform (SPLA Based)

> Nền tảng giám sát IoT đa lĩnh vực dựa trên kiến trúc Software Product Line (SPLA), tích hợp Workflow Engine (n8n) và Real-time Communication (WebSocket).

## 📁 Cấu trúc dự án

```
swd392/
├── backend/          # Core Platform (Node.js + Express + Socket.io)
│   ├── prisma/       # Database schema (SQLite)
│   ├── src/
│   │   ├── controllers/   # Business logic handlers
│   │   ├── routes/        # API endpoints
│   │   ├── utils/         # Prisma client, Auth middleware
│   │   └── index.js       # Server entry point
│   └── .env
├── frontend/         # Dashboard (React + Vite + TailwindCSS)
│   └── src/
│       ├── components/    # Widgets (Gauge, Chart, Status, etc.)
│       ├── context/       # Socket.io Context
│       └── App.jsx
├── n8n/              # Workflow Engine configs
│   ├── docker-compose.yml
│   ├── workflow-smart-home.json
│   └── workflow-hospital.json
├── simulator/        # IoT Data Simulator
│   └── index.js
└── README.md
```

## 🚀 Hướng dẫn chạy

### 1. Backend (Core Platform)
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
# → Server: http://localhost:3000
```

### 2. Frontend (Dashboard)
```bash
cd frontend
npm install
npm run dev
# → Dashboard: http://localhost:5173
```

### 3. Simulator (Fake IoT Data)
```bash
cd simulator
npm install
# Tất cả variants:
node index.js
# Hoặc chỉ 1 variant (home/hospital/factory/traffic/farm):
node index.js hospital
# Tùy chỉnh interval (ms):
node index.js all 1000
```

### 4. n8n (Workflow Engine — Optional)
```bash
cd n8n
docker-compose up -d
# → n8n UI: http://localhost:5678
# Import workflow-*.json vào n8n
```

## 🔌 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/ingest` | Nhận dữ liệu từ n8n/Simulator |
| GET | `/api/devices` | Danh sách thiết bị |
| GET | `/api/devices/:id` | Chi tiết thiết bị + logs |
| GET | `/api/config/variants` | Danh sách biến thể SPLA |
| GET | `/api/config/variants/:id` | Config chi tiết cho 1 variant |
| GET | `/api/logs` | Query logs (filter: deviceId, level) |
| GET | `/api/logs/stats` | Thống kê tổng hợp |
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập (JWT) |
| GET | `/api/auth/me` | Thông tin user hiện tại |

## 📡 WebSocket Events

| Event | Direction | Mô tả |
|-------|-----------|--------|
| `device_update` | Server → Client | Dữ liệu cảm biến realtime |
| `join_variant` | Client → Server | Tham gia room theo variant |

## 🏗️ SPLA Architecture

```
                    [ CORE PLATFORM ]
      ─────────────────────────────────────────────
      │  Auth  │  Ingestion  │  WebSocket  │  UI  │
      ─────────────────────────────────────────────
              ▲            ▲            ▲
              │            │            │
      [ VARIANT 1 ]  [ VARIANT 2 ]  [ VARIANT 3 ] ...
      (Smart Home)   (Hospital)     (Factory)
           │              │              │
      [ n8n Flow ]   [ n8n Flow ]   [ n8n Flow ]
           │              │              │
        ESP8266       Simulator      Simulator
```

**5 Biến thể hỗ trợ:**
- 🏠 **Smart Home** — Nhiệt độ, Khói, Cửa, Chuyển động
- 🏥 **Hospital** — Nhịp tim, SpO2, Huyết áp  
- 🏭 **Factory** — Nhiệt độ máy, Rung, Áp suất
- 🚗 **Traffic** — Mật độ xe, Tai nạn, Tắc đường
- 🌾 **Farm** — Độ ẩm đất, Ánh sáng, pH

## 🧪 Demo Scenarios

1. **Fire Alert**: Chạy `node index.js home` → Chờ `temp > 50` → Dashboard hiện popup đỏ
2. **Patient Critical**: Chạy `node index.js hospital` → `heart_rate > 120` → Warning/Critical
3. **Dynamic Switch**: Click variant trong Sidebar → Dashboard tự render widgets khác

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Socket.io, Prisma, SQLite
- **Frontend**: React, Vite, TailwindCSS, Chart.js
- **Workflow**: n8n (Docker)
- **Simulator**: Node.js + Axios