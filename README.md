# Smart Monitoring Platform (SPLA Based)

Nen tang giam sat IoT da tenant dua tren kien truc Software Product Line (SPLA), tich hop n8n workflow engine va realtime qua Socket.IO.

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

## SPLA Data Model

He thong su dung cac entity:
- Organization
- User
- Device
- Metric
- Threshold
- SensorData
- Alert
- DashboardConfig

## Run Local

### Quick Fullstack Start

1. Backend:
```bash
cd backend
npm run setup
npm run dev
```

2. n8n:
```bash
cd n8n
docker compose up -d
```
Import 5 workflow files and publish them in n8n UI.

3. Frontend:
```bash
cd frontend
npm install
npm run dev
```

4. Simulator:
```bash
cd simulator
npm install
npm start
```

### 1. Backend (Core Platform)
```bash
cd backend
npm install
npm run prisma:migrate -- --name spla_init
npm run dev
# Server: http://localhost:3000
```

Ghi chu:
- Backend tu dong seed du lieu mac dinh cho 5 domain neu database trong.
- Tai khoan admin mac dinh: `admin@spla.local` / `admin123` (co the doi qua `.env`).

### 2. Frontend (Dashboard)
```bash
cd frontend
npm install
npm run dev
# → Dashboard: http://localhost:5173
```

Optional frontend env:
- Copy `frontend/.env.example` to `.env.local` and adjust:
  - `VITE_API_BASE`
  - `VITE_SOCKET_URL`

### 3. Simulator (Fake IoT Data)
```bash
cd simulator
npm install

# Open simulator control UI
npm run ui
# -> http://localhost:4060

# Deterministic demo mode (recommended)
npm run demo

# Tat ca variants qua n8n (scenario mode)
node index.js all n8n 3000 scenario

# 1 variant qua n8n (scenario mode)
node index.js hospital n8n 3000 scenario

# Fallback direct vao backend (scenario mode)
node index.js home direct 3000 scenario

# Random mode (soak test)
node index.js all n8n 3000 random
```

Ghi chu demo:
- Scenario mode dung du lieu co kich ban, lap lai giong nhau qua moi lan chay.
- Muc tieu de thuyet trinh luong normal -> warning -> critical -> recovered ro rang.
- Neu muon thao tac bang giao dien thay vi terminal, mo Simulator UI va bam:
  - Send once / Next step
  - Start autoplay / Stop autoplay
  - Reset selected scenario / Reset all scenarios

### 4. n8n (Workflow Engine)
```bash
cd n8n
docker-compose up -d
# n8n UI: http://localhost:5678
# Import workflow-*.json vao n8n
```

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/ingest` | Nhan du lieu sensor (organization scoped) |
| GET | `/api/config/organizations` | Danh sach organization |
| GET | `/api/config/variants?organizationId=...` | Danh sach dashboard/domain theo organization |
| GET | `/api/config/variants/:id?organizationId=...` | Dashboard config + thresholds |
| GET | `/api/devices?organizationId=...` | Danh sach devices theo organization |
| GET | `/api/logs?organizationId=...` | SensorData timeline |
| GET | `/api/logs/stats?organizationId=...` | Thong ke tong hop |
| GET | `/api/thresholds?organizationId=...` | Danh sach threshold theo metrics |
| PUT | `/api/thresholds/:metricId` | Cap nhat threshold metric |
| GET | `/api/alerts?organizationId=...` | Danh sach alerts |
| PUT | `/api/alerts/:id/resolve` | Resolve alert |
| POST | `/api/auth/register` | Dang ky user theo organization |
| POST | `/api/auth/login` | Dang nhap theo organization |
| GET | `/api/auth/me` | User profile + organization |

## WebSocket Events

| Event | Direction | Mô tả |
|-------|-----------|--------|
| `device_update` | Server -> Client | Sensor update realtime |
| `alert_created` | Server -> Client | Alert moi duoc tao |
| `join_scope` | Client -> Server | Join room theo organization/domain |
| `leave_scope` | Client -> Server | Leave room theo organization/domain |

## SPLA Architecture

```
Simulator/Device -> n8n workflow -> Backend ingest
  -> Threshold evaluation in backend
  -> SensorData + Alert persisted in SQLite
  -> Socket.IO push to org/domain rooms
  -> Frontend dashboard render from DashboardConfig + realtime stream
```

**5 Biến thể hỗ trợ:**
- 🏠 **Smart Home** — Nhiệt độ, Khói, Cửa, Chuyển động
- 🏥 **Hospital** — Nhịp tim, SpO2, Huyết áp  
- 🏭 **Factory** — Nhiệt độ máy, Rung, Áp suất
- 🚗 **Traffic** — Mật độ xe, Tai nạn, Tắc đường
- 🌾 **Farm** — Độ ẩm đất, Ánh sáng, pH

## Tech Stack

- **Backend**: Node.js, Express, Socket.io, Prisma, SQLite
- **Frontend**: React, Vite, TailwindCSS, Chart.js
- **Workflow**: n8n (Docker)
- **Simulator**: Node.js + Axios