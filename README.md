# TechBuy Advisor — Decision Engine cho PC Gaming (MVP v1)

Website tư vấn và quyết định chọn cấu hình PC gaming theo đặc tả [SRS_TechBuy_Advisor_v1.md](./SRS_TechBuy_Advisor_v1.md).

## Chạy tại máy

```bash
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:3000`.

### Chạy kiểm thử tự động (Unit, Golden & Property-Based Tests)

```bash
npm test
```

### Kiểm tra build production

```bash
npm run build
```

## Các tính năng cốt lõi đã hoàn thành

1. **Recommendation Engine (WHAT)**:
   - Feasible Set với **10 Hard Constraints** kiểm tra phần cứng nghiêm ngặt (Socket, RAM DDR, Form factor, GPU clearance, PSU wattage & connectors, SSD interface, CPU BIOS, Cooler).
   - Tối ưu **Value Score** chuẩn hóa theo FPS thực tế và chi phí đầu tư.
   - Cơ chế kiểm soát ngân sách (+2% chỉ khi điểm số tăng vượt trội $\ge 5$).
   - Quy trình Tie-Breaker 5 bước tất định 100%.
2. **Price Intelligence (WHEN)**:
   - Bộ lọc giá bất thường (Anomaly/Outlier Filter) phát hiện điểm giá `SUSPECT`.
   - Tính toán $\Delta_{30}$ so với trung vị 30 ngày (Median30) hoặc 7 ngày đối với dữ liệu thưa.
   - Price Verdict minh bạch: `BUY_NOW`, `WAIT`, `NEUTRAL`.
3. **Danh mục linh kiện thực tế & Nhà bán lẻ (WHERE)**:
   - Danh mục gồm 33 SKU tuyển chọn tại Việt Nam cho dải ngân sách 15–35 triệu đồng.
   - Giá cập nhật từ 3 nhà bán lẻ: KCCShop, MemoryZone, An Phát PC.
   - 360 kết quả benchmark được kiểm định cho 5 game (Valorant, LoL, CS2, Cyberpunk 2077, Black Myth: Wukong) ở cả 1080p và 1440p.
4. **Giao diện người dùng hoàn chỉnh (UX)**:
   - Màn 1: Onboarding / Builder với slider ngân sách, preset chips, chọn độ phân giải và game.
   - Màn 2A: Kết quả cấu hình đề xuất, bảng FPS trong game, checklist tương thích 10/10 PASS, banner Price Verdict và Value Score.
   - Màn 2F: Xử lý trạng thái khi không có cấu hình khả thi kèm các nút hành động điều chỉnh nhanh (hạ resolution, tăng ngân sách, bớt game).
   - Màn 3: Modal chi tiết từng linh kiện, biểu đồ lịch sử giá 30 ngày dạng SVG và form đặt cảnh báo giá (Price Alert qua magic link).
   - Báo lỗi cấu hình gắn kèm `trace_id` và `snapshot_id` phục vụ kiểm tra và đối soát kỹ thuật.
5. **Vận hành & Kỹ thuật**:
   - Rate limit 15 req/phút/IP cho API public.
   - Admin Kill-Switch API vô hiệu hóa SKU tức thì trong runtime.
   - Scraper worker & Circuit breaker tự động ngắt khi scrape thất bại 3 lần liên tiếp.
