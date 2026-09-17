# Software Requirements Specification (SRS)
# TechBuy Advisor — Decision Engine cho PC Gaming (MVP v1)

**Phiên bản tài liệu:** 1.0 (tổng hợp từ Product Strategy v7.2, UX Design v1, Critic Review, Technical Architecture v1)
**Người tổng hợp:** Business Analyst
**Trạng thái:** Draft — chờ sign-off, còn Open Questions ở mục 10

---

## 1. Giới thiệu & Mục tiêu

### 1.1 Mục đích tài liệu
Tài liệu này hợp nhất bốn nguồn đóng góp (Product, UX, Critic, Architecture) thành một đặc tả yêu cầu phần mềm duy nhất, đủ chi tiết để hai đội kỹ thuật độc lập triển khai và cho ra **cùng một kết quả tất định (deterministic)** đối với Recommendation Engine, Compatibility Engine và Price Verdict. Ở những chỗ bốn nguồn mâu thuẫn nhau (ví dụ số lượng game, thành phần bắt buộc của build, công thức Value Score), tài liệu chọn phương án của Architecture Spec làm baseline vì đây là bản đã cụ thể hoá thành số triển khai được, đồng thời liệt kê mâu thuẫn tại mục 10 (Open Questions) để chủ sản phẩm chốt trước khi code.

### 1.2 Bối cảnh & định vị sản phẩm
TechBuy Advisor không phải "website bán đồ công nghệ có AI". Đây là **Decision Engine** trả lời ba câu hỏi cho người dùng:

| Câu hỏi | Output bắt buộc |
|---|---|
| WHAT | Một cấu hình PC cụ thể (build) |
| WHERE | Retailer + giá cập nhật |
| WHEN | BUY / WAIT / NEUTRAL kèm lý do kiểm chứng được |

**Nguyên tắc kiến trúc quan trọng nhất:** AI/LLM **không** quyết định WHAT/WHERE/WHEN. AI chỉ diễn giải (explain) một quyết định đã được engine rule-based tính toán trước. Recommendation, Compatibility và Price Verdict phải là các hệ thống **100% deterministic, có test vector**, không phụ thuộc model sinh ngôn ngữ.

### 1.3 Mục tiêu sản phẩm & mục tiêu kinh doanh
- Giúp người dùng có ý định build PC gaming ra quyết định trong dưới 2 phút, với độ tin cậy có thể kiểm chứng (nguồn benchmark, công thức giá).
- Loại bỏ toàn bộ lời hứa không-testable (ví dụ "không bottleneck") khỏi copy sản phẩm.
- Xây một nền tảng dữ liệu giá + SKU đủ sạch tại Việt Nam để làm moat cạnh tranh thật, thay vì chỉ cạnh tranh bằng UI/AI.
- North Star metric: **Qualified Decision Rate**, không phải số lượt chat hay pageview.

### 1.4 Thuật ngữ & viết tắt
| Thuật ngữ | Ý nghĩa |
|---|---|
| Build (B) | Một cấu hình PC gồm tập linh kiện thuộc các category bắt buộc |
| Feasible Set (F) | Tập hợp tất cả Build thoả toàn bộ Hard Constraint |
| Canonical SKU | Một mã sản phẩm chuẩn hoá duy nhất trong hệ thống, có thể map tới nhiều retailer |
| Golden Test Vector | Bộ input/output cố định dùng để hồi quy engine |
| Snapshot ID | Định danh trạng thái dữ liệu giá/SKU tại một thời điểm, phục vụ audit/reproduce |
| Delta30 | % lệch giữa CurrentPrice và Median30 |
| SUSPECT | Trạng thái một điểm giá bị nghi ngờ bất thường, không dùng để tính verdict |

---

## 2. Phạm vi (Scope)

### 2.1 Trong phạm vi (In-scope) — MVP V1
- Nền tảng web (Next.js, mobile-first), không có app native.
- 1 loại sản phẩm: **PC Gaming build-to-order**. Không laptop.
- 1 mục đích sử dụng: **Gaming**. Không AI/ML, không Workstation, không Office.
- Ngân sách hỗ trợ: **15.000.000 – 35.000.000 VNĐ**.
- Độ phân giải: **1080p, 1440p** (không 4K ở V1).
- Danh mục linh kiện: **CPU, GPU, Mainboard, RAM, SSD, PSU, Case** là 7 category bắt buộc luôn xuất hiện trong build; **Cooler** được gán có điều kiện (xem FR-11).
- Canonical SKU: **120–150 SKU**, được curate thủ công (không tự động crawl phát hiện sản phẩm mới).
- Retailer: đúng **3 retailer** đạt SLA chất lượng dữ liệu (ví dụ KCCShop, MemoryZone, An Phát) — không crawl Shopee/Lazada.
- Danh sách game benchmark cố định (xem Open Question OQ-01 về số lượng 5 vs 10).
- Ba lõi tính năng: **Recommendation Engine, Compatibility Engine, Price Intelligence (Price Verdict)**.
- Value Score, Price Alert (magic link), Affiliate deep link, LLM Explanation (bất đồng bộ, không block).
- Golden test suite (≥30 vector) + property-based test cho compatibility.
- Admin Kill-Switch để vô hiệu hoá SKU lỗi trong runtime.
- Cơ chế người dùng báo lỗi cấu hình (bug report) gắn kèm trace_id/snapshot_id.

### 2.2 Ngoài phạm vi (Out-of-scope) — V1
- Laptop, marketplace, tích hợp Shopee/Lazada.
- Community feature (review, forum, chat cộng đồng).
- Video AI, chatbot tổng quát không gắn với build cụ thể.
- Quantitative price forecasting (dự báo giá tương lai) — V1 chỉ dùng dữ liệu lịch sử (Median30).
- Độ phân giải 4K.
- Tính năng "chống bottleneck" dưới bất kỳ tên gọi/claim nào không có mô hình kiểm chứng được.
- Tính ship fee / voucher / trả góp vào giá hiển thị.
- Đăng ký/đăng nhập bắt buộc để dùng luồng chính (chỉ cần email khi tạo Price Alert).
- Đa ngôn ngữ (chỉ tiếng Việt).
- Desktop-specific redesign (V1 chỉ mở rộng 2 cột từ layout mobile, không đổi flow).

---

## 3. Personas & User Stories

### 3.1 Primary Persona — "Người build PC lần đầu, có ngân sách, thiếu tự tin"
Người Việt 18–35 tuổi, chuẩn bị build PC gaming trong vòng 30 ngày, ngân sách 15–35 triệu, không đủ tự tin để tự chọn từng linh kiện.

**Job-to-be-done:**
> "Tôi có 25 triệu, chơi Valorant + Cyberpunk ở 1440p. Hãy đưa cho tôi một cấu hình tương thích, đáng tiền, có benchmark đáng tin, và nói tôi có nên mua ở mức giá hiện tại không."

**Lưu ý rủi ro (từ Critic):** Nhóm này thực tế thường tin cậy bạn bè/group Facebook/Discord/nhân viên shop hơn một website lạ. Willingness-to-trust vào "Value Score 87/100" là thấp nếu không có bằng chứng minh bạch (nguồn benchmark, công thức, giá mua được thật). Sản phẩm phải thắng bằng minh bạch + tiết kiệm tiền rõ ràng, không phải bằng "AI thông minh".

### 3.2 Secondary Persona (Future expansion, không build ở V1)
- Enthusiast tự build, muốn so sánh/kiểm chứng lựa chọn của mình.
- Người săn sale, theo dõi giá dài hạn.
- Người mua laptop gaming.

### 3.3 User Stories chính (mapped tới FR)
- US-01: Là người dùng, tôi nhập ngân sách, độ phân giải, 1–3 game và ưu tiên, để nhận một cấu hình cụ thể trong dưới 2 phút. *(FR-01 → FR-06)*
- US-02: Là người dùng, tôi muốn biết chắc chắn cấu hình được đề xuất tương thích 100% về phần cứng. *(FR-10 → FR-15)*
- US-03: Là người dùng, tôi muốn biết giá hiện tại có phải là giá tốt so với 30 ngày qua không, để quyết định mua ngay hay chờ. *(FR-20 → FR-27)*
- US-04: Là người dùng, tôi muốn xem giải thích bằng ngôn ngữ tự nhiên nhưng không phải chờ nó mới thấy cấu hình. *(FR-30, FR-31)*
- US-05: Là người dùng, khi không có cấu hình phù hợp, tôi muốn biết lý do thật và được gợi ý điều chỉnh cụ thể, không bị đưa build sai để "cho có". *(FR-16, FR-17)*
- US-06: Là người dùng, tôi muốn tạo cảnh báo giá cho một linh kiện để mua sau khi giá giảm. *(FR-28, FR-29)*
- US-07: Là admin/vận hành, tôi muốn vô hiệu hoá ngay một SKU bị lỗi giá/hết hàng mà không cần redeploy. *(FR-40, FR-41)*
- US-08: Là admin/vận hành, tôi muốn nhận báo lỗi từ người dùng kèm đủ thông tin để tái tạo lỗi (trace_id, snapshot_id). *(FR-42)*

---

## 4. Nguyên tắc thiết kế cốt lõi (áp dụng xuyên suốt FR/NFR)

1. **Mỗi input tồn tại trong UI phải có ảnh hưởng deterministic tới engine.** Nếu bỏ input mà output không đổi → bỏ input đó khỏi UI.
2. **Recommendation là kết quả tất định**, không phải gợi ý mềm của chatbot. Với cùng một input + cùng một snapshot dữ liệu, hai lần gọi phải ra cùng một build.
3. **LLM không bao giờ block Recommendation.** Explanation là kênh render độc lập, xuất hiện sau, có fallback template tĩnh.
4. **Mọi con số hiển thị phải có công thức hoặc nguồn** (Value Score, Delta30, FPS, Compatibility) — không có số "ước lượng" không giải thích được.
5. **Không hứa điều không kiểm chứng được.** Cấm dùng "bottleneck", "không nghẽn cổ chai", "AI thông minh sẽ lo hết" trong mọi copy.
6. **Fail state là trạng thái first-class**, không che giấu: `NO_FEASIBLE_BUILD`, `INSUFFICIENT_DATA`, `LOW_CONFIDENCE`, `SUSPECT` đều có UI/response riêng, không được ngầm chuyển thành NEUTRAL hay build gần đúng không tương thích.
7. **Hard Constraint không bao giờ được nới lỏng để "tìm được build gần nhất".** Chỉ được nới Soft Constraint hoặc ngân sách (trong giới hạn cho phép).
8. **Mọi hằng số quy tắc (headroom factor, ngưỡng outlier, ngưỡng Delta30...) phải nằm trong config versioned**, không hard-code rải rác trong code.

---

## 5. Functional Requirements (FR)

### Nhóm A — Thu thập nhu cầu (Input / Onboarding)

**FR-01.** Hệ thống phải cho phép người dùng nhập ngân sách trong khoảng [15.000.000, 35.000.000] VNĐ qua slider kèm preset chip (15/20/25/30/35 triệu), không yêu cầu đăng nhập.

**FR-02.** Hệ thống phải cho phép chọn đúng 1 độ phân giải trong {1080p, 1440p}. Không có giá trị mặc định tự động (tránh bias); CTA submit bị khoá cho tới khi người dùng chọn.

**FR-03.** Hệ thống phải cho phép chọn 1 đến 3 game từ danh sách game được benchmark sẵn (xem OQ-01 về số lượng game chính thức). Chọn game thứ 4 trở đi phải bị chặn tại UI kèm thông báo lý do.

**FR-04.** Hệ thống phải cho phép chọn 1 ưu tiên (priority) trong {FPS, Quiet, Compact, No-RGB}, ảnh hưởng tới Soft Constraint scoring, không ảnh hưởng Hard Constraint.

**FR-05.** Hệ thống không được hiển thị bất kỳ input nào không có ánh xạ trực tiếp tới một biến trong Recommendation Engine (ví dụ: không hỏi "PC hay Laptop", không hỏi "mục đích sử dụng").

**FR-06.** Khi submit, hệ thống gửi request `POST /api/v1/recommend` với payload tối thiểu gồm `budget_vnd`, `resolution`, `target_games[]`, `priority`, `client_timestamp`, và phải trả về `trace_id` + `snapshot_id` cho mọi response (thành công lẫn thất bại) để phục vụ audit.

### Nhóm B — Recommendation Engine (WHAT)

**FR-07.** Engine phải xây dựng **Feasible Set F** = tập toàn bộ build B thoả **toàn bộ** Hard Constraint (định nghĩa ở FR-10). Build không thuộc F không bao giờ được trả về cho người dùng, kể cả khi Feasible Set rỗng.

**FR-08.** Trong Feasible Set, engine chọn build tối ưu:
`B* = argmax Score(B)` với điều kiện `TotalPrice(B) ≤ Budget × 1.02`.
- Hard budget mặc định = Budget.
- Cho phép vượt ngân sách tối đa +2% **chỉ khi** `Score(B_over) ≥ Score(best_under) + 5`. Nếu không thoả điều kiện này, không được vượt ngân sách.

**FR-09.** Công thức tính điểm build (Value/Score) dùng ở V1 (theo Architecture, baseline chính thức):

```
ValueScore(B) = ( Σ_{i=1}^{N} Weight_i × NormFPS_i ) / TotalPrice(B) × 10^7

Weight_i  = 1 / N   (N = số game người dùng chọn, chia đều, không tự suy đoán game nào quan trọng hơn)
NormFPS_i = min(100, ExpectedFPS_i / TargetFPS_i × 100)
```
Ghi chú: Product v7.2 đề xuất công thức trọng số 4 thành phần (`0.50×Performance + 0.25×PriceEfficiency + 0.15×Availability + 0.10×Preference`); Architecture v1 và Critic đều khuyến nghị công thức đơn giản hơn ở trên cho V1. Đây là điểm cần chốt — xem **OQ-02**.

**FR-10.** Hard Constraint (fail một cái → loại build khỏi Feasible Set), tối thiểu gồm:
```
CPU.socket = MB.socket
MB.ram_type = RAM.type
Case.supported_mb ⊇ MB.form_factor
GPU.length ≤ Case.gpu_clearance
PSU.form_factor ∈ Case.supported_psu
PSU.wattage ≥ RequiredPower
PSU có connector GPU tương ứng
SSD.interface được MB hỗ trợ
Cooler.socket hỗ trợ CPU.socket (khi Cooler được gán, xem FR-11)
Cooler.height ≤ Case.cooler_clearance (khi áp dụng)
CPU_BIOS_support = TRUE
```

**FR-11.** Xử lý Cooler (đã siết theo Architecture để giảm độ phức tạp dữ liệu clearance):
- Nếu CPU TDP ≤ 65W: gán mặc định stock cooler đi kèm CPU, không cần solve clearance.
- Nếu CPU TDP > 65W: gán đúng 1 mã tản khí tháp tiêu chuẩn đã được kiểm định compatibility, áp dụng Hard Constraint clearance ở FR-10.
- Người dùng không được tự chọn Cooler ở V1.

**FR-12.** Công thức tính công suất nguồn yêu cầu (RequiredPower), dùng cấu hình versioned:
```
RequiredPower = ceil_to_50W( (CPU_MaxTDP + GPU_MaxTDP + OtherSystemPower) × HeadroomFactor )
```
Giá trị mặc định V1: `OtherSystemPower = 75W`, `HeadroomFactor = 1.25`.
Ví dụ: CPU 88W + GPU 160W → (88+160+75)×1.25 = 403.75W → PSU tối thiểu 450W.
Các hằng số này phải nằm trong bảng config có version, không hard-code.

**FR-13.** Soft Constraint (ảnh hưởng điểm số, không loại build) tối thiểu gồm: Quiet preference, Compact preference, No-RGB preference, Price freshness, Retailer availability. Soft Constraint không được phép làm thay đổi trạng thái Hard Constraint pass/fail.

**FR-14.** Khi có từ 2 build trở lên có điểm số ngang nhau (chênh lệch < 0.01 hoặc bằng nhau tuỳ ngưỡng versioned), engine phải áp dụng **Tie-Breaker theo đúng thứ tự cố định sau, không được đổi thứ tự**:
```
1. ValueScore DESC
2. ExpectedFPS (của game ưu tiên/nặng nhất) DESC
3. TotalPrice ASC
4. PriceFreshness DESC
5. sku_id (CPU) lexical ASC
```

**FR-15.** Nếu Feasible Set rỗng (F = ∅), hệ thống phải trả `status: NO_FEASIBLE_BUILD` kèm lý do vi phạm cụ thể (ví dụ: ngân sách quá thấp so với độ phân giải/game đã chọn) và tối thiểu 1 gợi ý điều chỉnh khả thi (giảm resolution, tăng ngân sách, bỏ bớt game nặng). Không được trả một build gần đúng vi phạm Hard Constraint dưới bất kỳ hình thức nào.

**FR-16.** Mọi response thành công phải kèm khối `compatibility.checks_passed[]` liệt kê rõ các Hard Constraint đã pass (ví dụ: SOCKET_MATCH, RAM_DDR_MATCH, PSU_WATTAGE_SUFFICIENT, FORM_FACTOR_VALID, GPU_CLEARANCE_VALID).

**FR-17.** Engine không bao giờ được output một build mà bất kỳ Hard Constraint nào fail. Đây là bất biến (invariant) phải được kiểm chứng bằng property-based test cho **mọi** build engine từng trả về, không chỉ mẫu ngẫu nhiên.

### Nhóm C — Price Intelligence / Price Verdict (WHEN)

**FR-18.** `CurrentPrice(SKU)` = giá thấp nhất trong các listing hợp lệ (valid) đang in-stock. Listing hợp lệ phải thoả đồng thời: `stock = IN_STOCK`, `age ≤ 48h`, và đã pass Anomaly Filter (FR-21). Ship phí và voucher **không** được tính vào giá này ở V1; điều này phải được ghi rõ trên UI (disclaimer bắt buộc).

**FR-19.** `DailyReferencePrice(SKU)` = **median** của các giá retailer hợp lệ trong ngày (không dùng min tuyệt đối), để một listing lỗi đơn lẻ không kéo lệch biểu đồ lịch sử.

**FR-20.** `Median30` = median của DailyReferencePrice trong 30 ngày gần nhất (hoặc toàn bộ dữ liệu hợp lệ có sẵn nếu <30 ngày, xem FR-24).

**FR-21.** Anomaly/Outlier Filter: một điểm giá bị đánh dấu `SUSPECT` nếu:
```
price_t < 0.65 × median(giá hợp lệ 7 ngày gần nhất)
HOẶC
price_t > 1.50 × median(giá hợp lệ 7 ngày gần nhất)
```
Điểm `SUSPECT` không được dùng để tính CurrentPrice, DailyReferencePrice, hay Verdict cho tới khi được xác minh thủ công. Ngưỡng 0.65/1.50 phải nằm trong config versioned.

**FR-22.** Công thức Delta30 và quy tắc Verdict (áp dụng khi có ≥14 ngày dữ liệu hợp lệ):
```
Delta30 = (CurrentPrice − Median30) / Median30

BUY_NOW  nếu Delta30 ≤ −0.07
WAIT     nếu Delta30 ≥ +0.07
NEUTRAL  nếu −0.07 < Delta30 < +0.07
```
Ngưỡng ±7% phải nằm trong config versioned.

**FR-23.** Mỗi Verdict trả về cho người dùng phải kèm câu giải thích theo template kiểm chứng được, ví dụ: *"Giá tốt nhất hiện tại thấp hơn median 30 ngày 9%."* — không phải câu do LLM tự sinh không kiểm soát được nội dung số liệu.

**FR-24.** Quy tắc dữ liệu thưa (sparse data), phải implement chính xác theo bảng sau:

| Số ngày dữ liệu hợp lệ | Trạng thái verdict | Confidence |
|---|---|---|
| < 7 ngày | `INSUFFICIENT_DATA` (ẩn verdict, chỉ hiện giá) | N/A |
| 7–13 ngày | So với Median7, vẫn cho ra BUY_NOW/WAIT/NEUTRAL | LOW |
| ≥ 14 ngày | So với Median30 (hoặc toàn bộ dữ liệu ≤30 ngày có sẵn) | HIGH |

**FR-25.** Mỗi component trong response phải có `retailer.last_updated` và trạng thái tồn kho; nếu dữ liệu giá của một retailer quá 48h tuổi, retailer đó bị loại khỏi phép tính CurrentPrice và UI phải hiện badge "Cập nhật X giờ trước" thay vì ẩn đi im lặng.

**FR-26.** Nếu toàn bộ retailer của một SKU đang OOS (out of stock) hoặc scrape thất bại, hệ thống phải fallback sang linh kiện thay thế hợp lệ trong Feasible Set thay vì hiển thị SKU không mua được, hoặc thông báo rõ tình trạng.

**FR-27.** Người dùng phải xem được biểu đồ lịch sử giá 30 ngày (hoặc dữ liệu có sẵn) cho từng linh kiện, có đánh dấu (làm mờ) các điểm `SUSPECT`.

**FR-28.** Người dùng có thể tạo Price Alert cho một SKU với giá mục tiêu + email, xác thực qua magic link (token hết hạn 15 phút), không cần mật khẩu.

**FR-29.** Khi CurrentPrice của SKU đạt hoặc thấp hơn giá mục tiêu trong Alert, hệ thống phải gửi thông báo (kênh cụ thể: email — xem OQ-05 về kênh bổ sung như Zalo/SMS).

### Nhóm D — Giao diện & Luồng người dùng (UX)

**FR-30.** Recommendation (Màn 2A) phải render trong thời gian mục tiêu NFR-01 mà **không chờ** LLM Explanation. Explanation là một khối UI riêng, load sau qua kênh streaming độc lập (SSE).

**FR-31.** Nếu LLM timeout (> 2 giây) hoặc lỗi, hệ thống phải fallback về template tĩnh dựng từ dữ liệu build (ví dụ: *"Cấu hình gồm {CPU} + {GPU} tối ưu cho {budget} ở {resolution}, đáp ứng {games}."*), không hiển thị lỗi cho người dùng và không chặn phần Recommendation.

**FR-32.** Màn hình Recommendation phải hiển thị tối thiểu: tổng giá + trạng thái so với ngân sách, kết quả Compatibility (PASS/lý do), danh sách đủ category linh kiện, FPS kỳ vọng theo từng game đã chọn kèm nguồn benchmark, Value Score (có thể mở rộng xem công thức), Price Verdict + Delta30 + confidence, retailer tốt nhất kèm độ mới dữ liệu.

**FR-33.** Khi `NO_FEASIBLE_BUILD`, hệ thống phải hiển thị màn hình riêng (Màn 2F) nêu lý do cụ thể và tối thiểu 1–2 hành động điều chỉnh khả thi (giảm độ phân giải, tăng ngân sách, bỏ game nặng nhất). Không hiển thị build gần đúng gắn nhãn "gần đúng" nếu build đó vi phạm Hard Constraint.

**FR-34.** Người dùng phải xem được chi tiết từng linh kiện (Màn 3): giá hiện tại, Verdict/Delta30/confidence, biểu đồ giá, danh sách retailer, form tạo Price Alert, và disclaimer bắt buộc về ship/voucher + thời điểm cập nhật giá.

**FR-35.** Mọi màn hình phải tuân thủ: skeleton loading chỉ scoped vào khối đang tải (không che toàn màn hình); CTA chính sticky trong vùng dễ thao tác bằng ngón cái trên mobile; không dùng các cụm từ "bottleneck", "không nghẽn cổ chai" ở bất kỳ đâu trong copy.

**FR-36.** Hệ thống phải có nút "Báo lỗi cấu hình này" ở màn Recommendation, gửi kèm `trace_id`, `snapshot_id`, danh sách SKU đang hiển thị và lý do do người dùng chọn/nhập.

### Nhóm E — Vận hành & Quản trị dữ liệu (Admin/Ops)

**FR-37.** Toàn bộ SKU, giá, retailer phải được curate qua whitelist thủ công (curated whitelist mapping): mỗi Canonical SKU được gán cứng với URL sản phẩm cụ thể tại đúng 3 retailer đã chọn. Không cho phép engine tự động phát hiện sản phẩm/URL mới.

**FR-38.** Hệ thống ingestion (scraper worker) phải chạy theo lịch cố định (tối thiểu mỗi 6–12 giờ), trích xuất giá + tồn kho, và áp dụng Anomaly Filter (FR-21) trước khi ghi nhận vào cơ sở dữ liệu lịch sử giá.

**FR-39.** Khi một worker scrape thất bại liên tiếp ≥3 lần trên cùng một URL hoặc trả về giá null, hệ thống phải kích hoạt circuit breaker, đánh dấu URL đó `SCRAPE_FAILED`, dùng snapshot hợp lệ gần nhất (nếu ≤48h tuổi) kèm badge cảnh báo, và gửi alert nội bộ (Telegram/Discord/Slack) cho kỹ thuật viên.

**FR-40.** Admin phải có khả năng vô hiệu hoá (disable) một Canonical SKU khỏi hệ thống recommendation trong thời gian thực (không cần redeploy), thông qua API/CLI nội bộ có xác thực.

**FR-41.** Sau khi một SKU bị disable, toàn bộ request recommendation tiếp theo phải tự động loại SKU đó khỏi Feasible Set và trả về build thay thế hợp lệ khác (nếu có).

**FR-42.** Mọi báo cáo lỗi từ người dùng (FR-36) phải được lưu trữ kèm đủ ngữ cảnh (trace_id, snapshot_id, danh sách SKU, timestamp) để đội vận hành có thể tái tạo chính xác trạng thái đã sinh ra lỗi.

### Nhóm F — Đo lường (Analytics)

**FR-43.** Hệ thống phải track riêng biệt 3 chỉ số activation: ACT-01 (Completion Rate), ACT-02 (Completion Time), ACT-03 (System Latency) — định nghĩa chi tiết ở NFR tương ứng — không được gộp chung thành một con số.

**FR-44.** Hệ thống phải track North Star metric **Qualified Decision Rate**: tỷ lệ session mà người dùng (a) submit nhu cầu, (b) xem recommendation, (c) mở ít nhất 1 linh kiện, và (d) click retailer hoặc tạo price alert.

**FR-45.** Hệ thống phải track tỷ lệ phân bổ Verdict (BUY_NOW/WAIT/NEUTRAL/INSUFFICIENT_DATA) và tỷ lệ tạo Price Alert để đánh giá chất lượng Price Intelligence theo thời gian.

---

## 6. Non-Functional Requirements (NFR)

### Hiệu năng & Độ trễ
- **NFR-01 (Latency Recommendation):** Thời gian từ submit tới recommendation hiển thị (`submit → recommendation_visible`): p50 ≤ 1.0s, p95 ≤ 2.5s, p99 ≤ 4.0s.
- **NFR-02 (Latency Solver nội bộ):** Constraint Engine + scoring phải chạy < 50ms (p99) cho một request, tách biệt khỏi thời gian network/render.
- **NFR-03 (Latency LLM Explanation):** Không được tính vào NFR-01. Nếu > 2s không có phản hồi, phải fallback template tĩnh (FR-31).

### Activation Metrics (đã tách theo yêu cầu sửa lỗi từ bản trước)
- **NFR-04 (ACT-01 — Completion Rate):** `M1_submit / M1_started ≥ 40%`.
- **NFR-05 (ACT-02 — Completion Time):** Median thời gian `first_input → M2_interactive ≤ 120 giây`.
- **NFR-06 (ACT-03 — System Latency):** Giống NFR-01, đo và báo cáo riêng như một activation metric.

### Độ chính xác & Tính tất định (Determinism)
- **NFR-07:** Với cùng input và cùng snapshot dữ liệu, hệ thống phải trả về **chính xác cùng một build** ở mọi lần gọi, mọi môi trường triển khai (đảm bảo bằng Tie-Breaker cố định — FR-14).
- **NFR-08:** 100% Golden Test Vectors (tối thiểu 30 case, bao phủ: ngân sách thấp/cao, 1080p/1440p, đơn/đa game, OOS, thiếu benchmark, không có build khả thi, build hoà điểm, giá cũ (stale), khác biệt priority) phải pass trước khi release bất kỳ thay đổi nào vào Recommendation Engine.
- **NFR-09:** Property-based test phải xác nhận bất biến "mọi build được trả về đều pass 100% Hard Constraint" trên toàn bộ không gian test được sinh, không chỉ mẫu cố định.

### Chất lượng dữ liệu
- **NFR-10:** Pipeline giá phải đạt tỷ lệ crawl thành công ổn định > 95% sau 14 ngày vận hành liên tục trước khi cho phép launch Price Verdict.
- **NFR-11:** Không được để lọt bất kỳ giá trị 0đ hoặc giá null vào dữ liệu phục vụ tính toán (chặn bằng Anomaly Filter + validation tầng ingestion).
- **NFR-12:** Độ phủ dữ liệu giá tối thiểu 14 ngày liên tục cho một SKU trước khi SKU đó được phép hiển thị Verdict khác `INSUFFICIENT_DATA`.

### Bảo mật & Quyền truy cập
- **NFR-13:** Public API (`/recommend`) không yêu cầu đăng nhập nhưng phải giới hạn rate 15 request/phút/IP và không lộ chi tiết lỗi hệ thống nội bộ trong response.
- **NFR-14:** Admin API và Ingestion API chỉ truy cập được từ mạng nội bộ (VPC/IP whitelist) + JWT secret token; database không public port ra Internet.
- **NFR-15:** Price Alert API yêu cầu xác thực qua magic link (token hết hạn 15 phút) để chống spam/bot trước khi ghi nhận alert.

### Khả dụng & Chịu lỗi
- **NFR-16:** Khi một retailer scrape lỗi, hệ thống vẫn phải phục vụ được recommendation dựa trên dữ liệu snapshot gần nhất hợp lệ, kèm badge minh bạch về độ mới dữ liệu (không được im lặng dùng dữ liệu cũ).
- **NFR-17:** Kill-switch vô hiệu hoá SKU phải có hiệu lực trong vòng ≤ 30 giây kể từ khi admin thực thi, không cần redeploy.

### Tuân thủ & Pháp lý
- **NFR-18:** Mọi màn hình hiển thị giá phải kèm disclaimer: giá chưa gồm ship/voucher, kèm thời điểm cập nhật.
- **NFR-19:** Tần suất crawl phải tuân thủ giới hạn hợp lý (rate limit ≥2s/request) để tránh gây quá tải hạ tầng đối tác, tôn trọng robots.txt ở mức cơ bản.

### Khả năng truy cập & Thiết bị
- **NFR-20:** Vùng chạm tối thiểu 44px, contrast tối thiểu 4.5:1, hỗ trợ screen reader cho toàn bộ luồng chính.
- **NFR-21:** Toàn bộ luồng phải hoạt động ổn định trên điều kiện mạng yếu tại Việt Nam (cache, lazy-load ảnh, fallback text khi chart lỗi).

---

## 7. User Flows

### 7.1 Luồng chính (Happy Path)
```
Landing/SEO page
   ↓
[Màn 1] Nhập nhu cầu: Ngân sách → Độ phân giải → 1–3 Game → Ưu tiên
   ↓ (FR-06)
POST /api/v1/recommend
   ↓
[Màn 2A] Recommendation & Verdict
   ├── Build hoàn chỉnh + Compatibility PASS      (FR-16)
   ├── FPS kỳ vọng theo từng game + nguồn         (FR-32)
   ├── Tổng giá + Value Score                     (FR-09, FR-32)
   ├── Price Verdict (BUY/WAIT/NEUTRAL) + Delta30 (FR-22, FR-23)
   └── CTA: Mua từng linh kiện / Tạo price alert
   ↓ (song song, không block)
[Màn 2B] AI Explanation (stream SSE, có fallback template) (FR-30, FR-31)
   ↓ (khi user chọn xem chi tiết 1 linh kiện)
[Màn 3] Chi tiết linh kiện: Price history, Delta30, Retailer list, Price Alert (FR-27, FR-28, FR-34)
```

### 7.2 Nhánh lỗi/ngoại lệ
```
Feasible Set = ∅          → [Màn 2F] NO_FEASIBLE_BUILD + gợi ý điều chỉnh (FR-15, FR-33)
LLM timeout/fail           → Recommendation vẫn hiển thị, Explanation dùng template (FR-31)
Retailer toàn bộ OOS/fail  → Fallback linh kiện thay thế hoặc badge cảnh báo (FR-26, FR-39)
Giá stale > 48h            → Ẩn CTA mua nhanh, chỉ hiện "giá tham khảo" (FR-25)
Valid days < 7             → Verdict = INSUFFICIENT_DATA, ẩn BUY/WAIT/NEUTRAL (FR-24)
Người dùng báo lỗi build   → Gửi kèm trace_id/snapshot_id → Admin kill-switch SKU nếu cần (FR-36, FR-40, FR-42)
```

### 7.3 State machine tổng quát (Recommendation)
```
Receive Request
   → Check Constraint Feasibility
       → Feasible Set ≠ ∅ → Calculate Best Build → Check Price History
             → valid_days ≥ 14 → confidence=HIGH → BUY_NOW/WAIT/NEUTRAL
             → 7 ≤ valid_days ≤ 13 → confidence=LOW → BUY_NOW/WAIT/NEUTRAL (so Median7)
             → valid_days < 7 → status=INSUFFICIENT_DATA (ẩn verdict)
       → Feasible Set = ∅ → status=NO_FEASIBLE_BUILD (kèm lý do + gợi ý)
```

---

## 8. Dữ liệu & Phân quyền (Data & Permissions)

### 8.1 Thực thể dữ liệu chính
| Thực thể | Mô tả | Nguồn |
|---|---|---|
| Canonical SKU | Sản phẩm chuẩn hoá (CPU/GPU/MB/RAM/SSD/PSU/Case/Cooler) với thông số kỹ thuật đầy đủ cho Hard Constraint | Curate thủ công |
| Retailer Listing | Ánh xạ 1 SKU ↔ 1 URL tại 1 trong 3 retailer, kèm giá/tồn kho theo thời gian | Ingestion worker |
| Price History (TimescaleDB) | Chuỗi thời gian DailyReferencePrice, Median7, Median30 theo SKU | Pipeline tính toán |
| Benchmark Matrix | FPS kỳ vọng theo cặp (CPU, GPU) × game × resolution, có nguồn trích dẫn | Cập nhật thủ công, versioned |
| Recommendation Snapshot | Trace_id, snapshot_id, input, build trả về — phục vụ audit/reproduce | Runtime log |
| Price Alert | Email (chưa xác thực → magic link), SKU, giá mục tiêu | User input |
| Bug Report | Trace_id, snapshot_id, SKU list, lý do | User input |

### 8.2 Ma trận phân quyền
| Vùng/API | Đối tượng | Quyền |
|---|---|---|
| `/api/v1/recommend` (Public) | Người dùng ẩn danh | Read-only, rate-limited 15 req/phút/IP, không cần đăng nhập |
| `/api/v1/price-alerts` | Người dùng có email xác thực magic link | Tạo/xem alert của chính mình |
| Admin/Ingestion API | Internal worker, sysadmin | Full quyền trên SKU/retailer/pricing config; chỉ truy cập qua VPC + JWT |
| Database (PostgreSQL/TimescaleDB) | Internal service only | Không public port ra Internet |
| Config hằng số (HeadroomFactor, ngưỡng Delta30, ngưỡng Outlier...) | Admin/kỹ sư có quyền release | Thay đổi phải versioned, có changelog, trigger lại golden test |

### 8.3 Nguyên tắc dữ liệu
- Không tính ship/voucher vào bất kỳ phép tính giá nào ở V1 — phải disclaimer rõ trên UI (NFR-18).
- Không dùng dữ liệu SUSPECT cho bất kỳ phép tính hiển thị cho người dùng.
- Mọi thay đổi hằng số ảnh hưởng tới kết quả (HeadroomFactor, ngưỡng outlier, ngưỡng verdict) phải version hoá và chạy lại Golden Test Suite trước khi release.

---

## 9. Acceptance Criteria

Tiêu chí nghiệm thu được nhóm theo module, mỗi tiêu chí phải kiểm chứng được bằng test tự động (golden test / property test) hoặc đo lường thực tế (latency, data coverage).

### 9.1 Recommendation & Compatibility Engine
- AC-01: Với cùng input + cùng snapshot dữ liệu, gọi API 10 lần liên tiếp phải trả về **cùng một build** (SKU giống hệt, thứ tự giống hệt).
- AC-02: 100% trong ≥30 Golden Test Vector (bao phủ budget thấp/cao, 1080p/1440p, đơn/đa game, OOS, thiếu benchmark, không có build, build hoà điểm, giá cũ, khác priority) phải pass đúng build/expected output định nghĩa trước.
- AC-03: Property-based test chạy trên ≥1000 build ngẫu nhiên do engine sinh ra phải cho kết quả 100% pass toàn bộ Hard Constraint (socket, RAM, BIOS, storage, GPU clearance, cooler clearance, PSU form factor, PSU wattage, PSU connector, đủ mọi category bắt buộc).
- AC-04: Khi Feasible Set rỗng, response phải có `status = NO_FEASIBLE_BUILD`, không có trường `build`, và có tối thiểu 1 gợi ý điều chỉnh hợp lệ.
- AC-05: Trường hợp vượt ngân sách +2%: chỉ xảy ra khi `Score(B_over) ≥ Score(best_under) + 5`; test phải xác nhận không có trường hợp vượt ngân sách mà không thoả điều kiện này lọt qua.

### 9.2 Price Intelligence
- AC-06: Với dữ liệu giả lập ≥14 ngày hợp lệ, verdict trả về đúng công thức Delta30 (sai số làm tròn ≤ 0.01%).
- AC-07: Với dữ liệu < 7 ngày hợp lệ, response phải là `INSUFFICIENT_DATA`, không hiển thị BUY/WAIT/NEUTRAL.
- AC-08: Một điểm giá thoả điều kiện SUSPECT (FR-21) không được xuất hiện trong phép tính CurrentPrice/Median30/Delta30 của bất kỳ test case nào.
- AC-09: Một retailer listing quá 48h tuổi không được tính vào CurrentPrice; UI hiển thị badge độ mới dữ liệu tương ứng.

### 9.3 UX & Latency
- AC-10: Đo thực tế trên môi trường staging với tải giả lập: p50 ≤ 1.0s, p95 ≤ 2.5s, p99 ≤ 4.0s cho `submit → recommendation_visible`.
- AC-11: Explanation LLM không xuất hiện trước Recommendation trong bất kỳ trường hợp nào; khi LLM lỗi/timeout > 2s, UI hiển thị template tĩnh, không lỗi, không đứng yên vô hạn.
- AC-12: Toàn bộ copy sản phẩm (UI + notification) không chứa từ "bottleneck" hoặc "không nghẽn cổ chai" (kiểm bằng text scan tự động trước mỗi release).
- AC-13: Màn NO_FEASIBLE_BUILD hiển thị lý do cụ thể + ít nhất 1 nút hành động điều chỉnh khả thi, không hiển thị build vi phạm Hard Constraint gắn nhãn "gần đúng".

### 9.4 Vận hành
- AC-14: Sau khi gọi API disable SKU, request recommendation tiếp theo (trong vòng 30s) không được chứa SKU đã disable.
- AC-15: Khi một URL scrape thất bại 3 lần liên tiếp, hệ thống phải chuyển trạng thái `SCRAPE_FAILED`, gửi alert nội bộ, và fallback đúng theo FR-39.
- AC-16: Trong 14 ngày pipeline chạy thử, tỷ lệ crawl thành công đo được > 95% và không có bản ghi giá 0đ/null lọt vào production dataset — là điều kiện Launch Gate bắt buộc.

---

## 10. Open Questions (cần chốt trước khi triển khai)

- **OQ-01 — Số lượng game benchmark chính thức:** Product/UX đề xuất **10 game** (chọn tối đa 3), Architecture chốt **5 game** (Valorant, LoL, CS2, Cyberpunk 2077, Black Myth: Wukong), Critic đề xuất **5–6 game**. Cần chốt danh sách cuối cùng vì nó ảnh hưởng trực tiếp UI Màn 1 và khối lượng Benchmark Matrix cần curate.
- **OQ-02 — Công thức Value Score:** Product đề xuất công thức 4 trọng số (Performance/PriceEfficiency/Availability/Preference), Architecture và Critic đề xuất công thức đơn giản hơn (tỷ lệ FPS chuẩn hoá / giá). Cần chọn 1 công thức chính thức làm nguồn sự thật duy nhất cho golden test.
- **OQ-03 — Cooler có phải category bắt buộc hiển thị hay không:** Product v7.2 liệt kê Cooler là 1 trong 8 component bắt buộc; Architecture giảm xuống 7 category bắt buộc + Cooler gán có điều kiện theo TDP. UX cần biết để quyết định có hiển thị dòng "Cooler" trong danh sách linh kiện hay ẩn khi là stock cooler mặc định.
- **OQ-04 — Nguồn giá & xử lý voucher/ship:** Không tính ship/voucher ở V1 đã được thống nhất, nhưng cần quyết định: có lộ trình bổ sung giá "ước tính sau voucher phổ biến" ở V1.1 hay không, vì Critic cảnh báo đây là "trust killer" nếu giá click vào không phải giá mua được thật.
- **OQ-05 — Kênh gửi Price Alert:** FR-28/29 hiện chỉ định email; cần xác nhận có bổ sung Zalo/SMS ở V1 hay để V1.1 (ảnh hưởng tới quyết định consent dữ liệu liên hệ).
- **OQ-06 — Cơ chế xác minh SUSPECT price:** Ai (người/hệ thống) xác minh và bằng quy trình nào để một điểm SUSPECT được đưa trở lại dữ liệu hợp lệ? Chưa có SLA xử lý cụ thể.
- **OQ-07 — Cold start Anomaly Filter:** Với SKU mới chưa có đủ 7 ngày dữ liệu, ngưỡng outlier dựa trên Median7 sẽ tính thế nào? Cần quy tắc cold-start riêng (ví dụ dùng giá niêm yết ban đầu làm baseline tạm thời).
- **OQ-08 — Trách nhiệm cập nhật Benchmark Matrix:** Khi game ra bản cập nhật lớn hoặc driver GPU mới làm FPS thực tế lệch khỏi Benchmark Matrix, ai chịu trách nhiệm review/update, tần suất bao lâu một lần?
- **OQ-09 — Rủi ro pháp lý crawl:** Cần xác nhận việc crawl giá từ 3 retailer đã được thoả thuận/đồng ý (affiliate agreement) hay chỉ dựa trên robots.txt công khai; ảnh hưởng tới rủi ro pháp lý dài hạn.
- **OQ-10 — Ngưỡng launch tối thiểu cho WHERE feature:** Đã thống nhất launch cần đúng 3 retailer đạt SLA; cần định nghĩa cụ thể "đạt SLA" là gì (ví dụ: uptime crawl > 95%, độ trễ cập nhật giá < X giờ) để tránh mơ hồ khi go/no-go.
- **OQ-11 — Định vị & positioning cuối cùng:** Critic đề nghị bỏ chữ "Decision Engine"/"AI" khỏi positioning chính để tránh overpromise; Product v7.2 vẫn dùng "Decision Engine" trong tên định vị. Cần Marketing/Product chốt câu định vị cuối trước khi launch trang landing.

---

*Hết tài liệu.*
