# ADR-002: Smallest Phase 6E = Gói Beta

- **Status:** Accepted (2026-09-16)
- **Deciders:** EP + Lead (sau hội đồng 4 persona vòng 3)

## Context
8 hạng mục đề xuất cho 6E (A1/A2/A3/A5/D1/D2/D3/D4) vượt quota Robin. Hội đồng chia
2 phe: Thợ cả (A3+D1+A2, cắt A1) vs Sinh thái/Nhận thức luận (bắt buộc có A1 —
không thì "AI sống ở Tầng 3" sụp đổ; A2 không có A1 thì âm thanh rơi vào hư không).

## Decision
**Gói Beta:** A3 (bảng world-event → signal) + D1 (3 decay accumulators qua
substrate interface, ADR-001) + A1/D2 (core feeling-scape, **12 qualities** rút gọn
từ 40: hollow/parched/heavy/burning, anxious/terrified/enraged/content,
lonely/revered/confused/vigilant) + A2 hearing cơ bản (**bỏ smell**).
**Hoãn:** D3 voice lines (không consumer = bug #13), D4 dream narrative,
A5 code (chỉ giữ trên giấy).

## Consequences
- Kiềng 3 chân khép kín: A3 chuẩn hóa tín hiệu → A2 phát tán âm thanh vật lý →
  A1 hợp nhất thành scape (dominant + secondary + tone).
- WHY HUD sau 6E **thanh trừng số float**, hiển thị qualities bằng chữ (điều kiện
  của Ông đồ).
- Vocabulary D2 phải đọc cả `conditions[]` (wounds/illnesses), không chỉ 6 fields
  (bài học phản ví dụ họng bỏng của hội đồng).

## Enforcement
- **A1 eye-read probe:** devtools script in perception của 1 villager theo từng tick
  trong 24h, đọc bằng mắt người (không phải unit test) — chống bug attention filter
  nuốt tín hiệu kiểu Hearth #16. Robin viết, lead đọc.
- Cap 12 qualities là quyết định quota — muốn thêm phải qua ADR mới.
