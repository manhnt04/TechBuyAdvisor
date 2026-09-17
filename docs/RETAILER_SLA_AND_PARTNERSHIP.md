# TechBuy Advisor — Thỏa Thuận Đối Tác & Chuẩn SLA Nhà Bán Lẻ (WHERE Feature)

**Tài liệu giải quyết:** Open Question **OQ-09** (Pháp lý & Phương thức thu thập dữ liệu) và **OQ-10** (Bộ tiêu chí đạt chuẩn SLA cho Launch Gate).

---

## 1. Bối cảnh & Nguyên tắc cốt lõi

TechBuy Advisor không bán hàng trực tiếp và không đóng vai trò trung gian thanh toán. Nền tảng là một **Decision Engine** độc lập, minh bạch, kết nối người mua có nhu cầu thực tế với các nhà bán lẻ uy tín tại Việt Nam.

Để bảo vệ quyền lợi người dùng và đảm bảo tính khả thi lâu dài, TechBuy Advisor loại bỏ hoàn toàn việc cào dữ liệu không phép từ các sàn thương mại điện tử không kiểm soát được nguồn gốc hàng hóa (Shopee, Lazada). Thay vào đó, nền tảng thiết lập quan hệ đối tác chính thức với **3 nhà bán lẻ hàng đầu** (ví dụ: KCCShop, MemoryZone, An Phát PC).

---

## 2. Thỏa thuận hợp tác đối tác (OQ-09)

### 2.1 Mô hình hợp tác Affiliate / Referral
1. **Chia sẻ doanh thu (Revenue Share)**:
   - Mỗi link sản phẩm tại TechBuy Advisor được gắn định danh đối tác:
     `?ref=techbuy&utm_source=techbuy_advisor&utm_medium=decision_engine&utm_campaign=pc_gaming_build`
   - Đối tác ghi nhận cookie theo dõi 30 ngày (hoặc theo phiên) và chia sẻ mức hoa hồng từ **1.5% đến 3.0%** trên tổng giá trị đơn hàng linh kiện thành công.
2. **Quyền sử dụng thương hiệu & hình ảnh**:
   - Nhà bán lẻ đồng ý cho TechBuy Advisor hiển thị logo, tên thương hiệu, giá bán công khai và trạng thái kho hàng trên giao diện Decision Engine.
   - TechBuy Advisor cam kết hiển thị giá trung thực, minh bạch, có disclaimer rõ ràng ("Giá chưa bao gồm phí vận chuyển và voucher riêng của cửa hàng").

### 2.2 Phương thức kỹ thuật thu thập dữ liệu (Data Integration)
Nhà bán lẻ có thể chọn một trong hai phương thức sau:

#### Phương thức 1: Cung cấp Data Feed / Partner API (Khuyến khích)
- Nhà bán lẻ cung cấp endpoint API bảo mật hoặc file XML/JSON/CSV tự động cập nhật mỗi 4–6 giờ.
- Schema chuẩn:
  ```json
  {
    "sku_id": "cpu-i5-12400f",
    "retailer": "KCCShop",
    "product_name": "CPU Intel Core i5-12400F",
    "price_vnd": 2390000,
    "stock_status": "IN_STOCK",
    "url": "https://kccshop.vn/cpu-intel-core-i5-12400f/",
    "updated_at": "2026-09-17T08:00:00Z"
  }
  ```

#### Phương thức 2: Cho phép Crawl qua Whitelist IP (Whitelisted Scraping)
- Nếu nhà bán lẻ chưa có hệ thống Data Feed, đối tác đồng ý văn bản cho phép bot của TechBuy Advisor truy cập các URL định trước theo whitelist.
- Quy chuẩn Bot của TechBuy Advisor:
  - User-Agent: `TechBuyAdvisorBot/1.0 (+https://techbuy.vn/bot; bot@techbuy.vn)`
  - Dải IP cố định được thông báo trước để nhà bán lẻ không chặn bằng Cloudflare/WAF.
  - Tần suất cào: Tối thiểu 2 giây/request (NFR-19), chỉ quét tối đa 4 lần/ngày vào các khung giờ thấp điểm (00:00, 06:00, 12:00, 18:00).

---

## 3. Bộ tiêu chuẩn SLA cho Launch Gate (OQ-10)

Trước khi tính năng **WHERE** (Hiển thị giá và đối tác mua) được kích hoạt chính thức trên bản production, nhà bán lẻ phải vượt qua kỳ đánh giá chạy thử **14 ngày liên tục** theo bảng tiêu chí sau:

| Chỉ số SLA | Định nghĩa | Ngưỡng bắt buộc | Hành động khi vi phạm |
|---|---|:---:|---|
| **SLA-01: Tỷ lệ crawl thành công (14 ngày)** | Tỷ lệ số lần cào/gọi API thành công trong 14 ngày thử nghiệm | $\ge 95\%$ | Nếu $< 95\%$, không đủ điều kiện launch gate (NFR-10). |
| **SLA-02: Uptime vận hành** | Tỷ lệ thời gian endpoint/trang sản phẩm phản hồi thành công | $\ge 98.0\%$ | Quá 12 giờ gián đoạn $\to$ tạm ẩn nhãn giá đối tác trên Màn 3. |
| **SLA-03: Độ trễ cập nhật giá** | Thời gian từ khi giá trên web đổi đến khi TechBuy cập nhật | $\le 6$ giờ | Badge cảnh báo độ mới dữ liệu; nếu quá 48h $\to$ loại khỏi CurrentPrice (FR-25). |
| **SLA-04: Độ chính xác tồn kho** | Tỷ lệ sản phẩm báo IN_STOCK thực tế khách hàng đặt mua được | $\ge 95\%$ | Người dùng bấm "Báo lỗi" $\ge 3$ lần/tuần vì hết hàng $\to$ gửi yêu cầu đối soát kho. |
| **SLA-05: Xuất xứ & Bảo hành** | Nguồn gốc sản phẩm phân phối | 100% chính hãng | Cấm tuyệt đối hàng xách tay không bảo hành, cam kết bảo hành $\ge 36$ tháng cho CPU/GPU/MB/PSU. |

---

## 4. Cơ chế vận hành & Xử lý sự cố kỹ thuật

1. **Circuit Breaker tự động (FR-39)**:
   - Khi scraper phát hiện một URL của nhà bán lẻ trả về lỗi HTTP (404/500) hoặc timeout 3 lần liên tiếp:
     - Hệ thống lập tức đánh dấu URL đó là `SCRAPE_FAILED`.
     - Tự động fallback sang giá của snapshot gần nhất (nếu $\le 48$h tuổi).
     - Gửi cảnh báo tự động tới Telegram/Discord của đội vận hành để liên hệ kỹ thuật đối tác.
2. **Bộ lọc giá bất thường (Anomaly/Outlier Filter — FR-21)**:
   - Nếu giá cào được lệch ngoài biên độ $[-35\%, +50\%]$ so với trung vị 7 ngày gần nhất $\to$ đánh dấu `SUSPECT`.
   - Điểm giá `SUSPECT` không được hiển thị cho người dùng để tránh lỗi hiển thị giá nhầm lẫn của cửa hàng.
3. **Admin Kill-Switch (FR-40, FR-41)**:
   - Khi nhà bán lẻ thông báo một mặt hàng bị lỗi giá hoặc cháy hàng khẩn cấp, admin TechBuy có thể gọi `POST /api/v1/admin/sku` để vô hiệu hóa SKU đó trong vòng $\le 30$ giây mà không cần redeploy mã nguồn.
