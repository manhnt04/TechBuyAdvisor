# Hướng dẫn Thiết lập Tự động hóa Ingestion Cron Worker & Price Alerts

TechBuy Advisor hỗ trợ 3 phương thức tự động hóa việc cào giá và kiểm tra Price Alert hàng ngày:

---

## Cách 1: Chạy trực tiếp qua Node.js Daemon (Local & Server)

Khởi động worker chạy nền liên tục với chu kỳ 24 giờ một lần:

```bash
# Chạy daemon định kỳ
npm run worker:cron

# Hoặc kích hoạt chạy kiểm tra ngay lập tức một lần:
npm run worker:cron -- --now
```

---

## Cách 2: Thiết lập Windows Task Scheduler (Hệ điều hành Windows)

1. Mở **Task Scheduler** (bấm phím Windows, gõ `Task Scheduler`).
2. Chọn **Create Basic Task...**:
   - **Name**: `TechBuy Ingestion Worker`
   - **Trigger**: `Daily` lúc `03:00:00 AM`
   - **Action**: `Start a program`
   - **Program/script**: `node` (hoặc đường dẫn đầy đủ đến `node.exe`)
   - **Add arguments**: `node_modules/tsx/dist/cli.mjs scripts/cron-worker.ts --now`
   - **Start in**: `M:\__ProjectAI__\_OJT\TechBuy Advisor`
3. Nhấn **Finish**.

---

## Cách 3: Kích hoạt từ xa qua Webhook Cron Endpoint

Endpoint bảo mật: `POST /api/v1/cron/ingest`

Có thể cấu hình trên **Vercel Cron**, **cron-job.org**, hoặc **GitHub Actions**:

### Ví dụ gọi cURL:
```bash
curl -X POST https://your-domain.com/api/v1/cron/ingest \
  -H "Authorization: Bearer techbuy-cron-secret-2026"
```

### GitHub Actions Workflow mẫu (`.github/workflows/daily-price-sync.yml`):
```yaml
name: Daily Price Ingestion & Alert Dispatch

on:
  schedule:
    - cron: '0 20 * * *' # Chạy lúc 3:00 AM giờ Việt Nam (20:00 UTC)
  workflow_dispatch:

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Ingestion Webhook
        run: |
          curl -f -X POST "${{ secrets.DEPLOY_URL }}/api/v1/cron/ingest" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## Nhật ký theo dõi (Audit Log)
Mỗi lần chạy thành công hoặc gặp sự cố, worker đều tự động ghi lại lịch sử vào file:
`data/cron_history.log`
kèm thống kê số lượng listing đã quét, số điểm giá bất thường (suspect) và số email Price Drop đã gửi.
