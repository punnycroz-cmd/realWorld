# ADR-001: FeelingSubstrate Interface (quyết định 1B)

- **Status:** Accepted (2026-09-16)
- **Deciders:** EP + Lead (sau hội đồng 4 persona vòng 3)

## Context
D1 tranh luận Option 1 (giữ C3 + decay accumulators) vs full 12 chemicals. EP đề xuất
định nghĩa `FeelingSubstrate` interface ngay; hội đồng phản biện:
- **Thợ cả:** interface hứa "swap êm sang 12 chất" là dối trá lịch thiệp — 3 accumulator
  tuyến tính vs 12 chất phi tuyến, phân phối tín hiệu sẽ đảo lộn, AI brain hóa điên.
- **Nhà sinh thái:** Option 1 toàn mũi tên một chiều, thiếu feedback vòng kín.
- **Nhà nhận thức luận (gỡ):** interface trung thực *iff* là lối đi độc đạo bắt buộc.

## Decision
Chọn **1B với lý do đã sửa**: giữ interface KHÔNG phải vì "swap êm" (oversell),
mà vì nó là **cơ chế ép kỷ luật A4 ngay hôm nay** — mọi code nhận thức đọc cảm giác
qua `substrate.feel(v)` / `substrate.getLayers(v)`, cấm chọc thẳng `v.body`.

## Consequences
- Phase 7 viết lại **một** implementation, không phải 100 chỗ rải rác. Phân phối tín
  hiệu VẪN sẽ đảo lộn khi swap — đã ghi nhận trung thực, không hứa hẹn.
- WHY HUD và mọi decision code đọc qua interface.
- Không thêm state mới ngoài accumulators của D1.

## Enforcement
1. **Lint rule (CI fail):** cấm `v.body.` trong `src/brain/**`. Implement trong 6E
   (Robin), Examiner verify bằng bypass-test cố ý.
2. ADR này là bằng chứng "không hứa swap êm" — ai hỏi sau này thì chỉ vào đây.
