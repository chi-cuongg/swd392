# n8n Setup (Local)

This folder contains Docker compose and prebuilt workflows for SPLA routing.

## 1) Start n8n

```bash
cd n8n
docker compose up -d
```

n8n UI: http://localhost:5678

## 2) Import workflows

Import each file from this folder in n8n UI:
- workflow-smart-home.json
- workflow-hospital.json
- workflow-factory.json
- workflow-traffic.json
- workflow-farm.json

Then open each workflow and click Publish/Activate.

## 3) Production webhook endpoints

- POST /webhook/smart-home
- POST /webhook/hospital
- POST /webhook/factory
- POST /webhook/traffic
- POST /webhook/farm

## 4) Data flow

Simulator/Device -> n8n webhook -> Backend /api/ingest -> SQLite + Socket -> Frontend

Threshold/alert logic is handled by backend.
