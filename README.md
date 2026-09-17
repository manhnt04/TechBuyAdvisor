# TechBuy Advisor

Website giao diện sáng cho luồng chọn PC gaming theo [SRS](./SRS_TechBuy_Advisor_v1.md).

## Chạy tại máy

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Trạng thái

Đã có trang giới thiệu, form nhập ngân sách/độ phân giải/game/ưu tiên, màn kết quả và tab thông tin, WebGL shader ở hero, chuyển động responsive và hỗ trợ `prefers-reduced-motion`.

Màn kết quả hiện **chưa tạo build hoặc hiển thị giá**. SRS yêu cầu kết luận dựa trên SKU được kiểm định, benchmark có nguồn, lịch sử giá và 3 retailer còn hiệu lực. Những dữ liệu này chưa có trong workspace. Cần bổ sung dữ liệu và backend trước khi bật recommendation, compatibility, price verdict, alert và các API vận hành.
