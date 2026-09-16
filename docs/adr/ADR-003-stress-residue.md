# ADR-003: stressResidue — cặn stress bất đối xứng qua đêm (quyết định 3B)

- **Status:** Accepted (2026-09-16)
- **Deciders:** EP + Lead (sau hội đồng 4 persona vòng 3)

## Context
D4 functional-core bị Ông đồ tố "ngủ = nút reset vô cảm" (mẹ chôn con hôm qua,
hôm nay ăn khoai là content). Thợ cả cảnh báo depression loop: xã hội chưa có cơ
chế chữa lành, trauma không lối ra sẽ sụp đổ kinh tế làng. Nhà sinh thái đề xuất
lối giữa: không bệnh lâm sàng, chỉ một biến cặn bất đối xứng.

## Decision
**3B với ceiling cứng:**
- `stressResidue`: accumulator 0..1, chỉ tích khi ngày có stress/suffering cực hạn
  (ngưỡng do 6E định, test phân biệt).
- **Ceiling:** `stressResidue ≤ 0.35 × maxStress`. Đủ để "mang dấu vết", không đủ
  để sụp đổ. (Tham số tune khởi đầu, không phải chân lý sinh học.)
- **Recovery:** ngày bình yên liên tiếp (không threat, không loss, mood > 0) →
  residue −8%/ngày. 2–3 ngày bình yên ≈ tan hết. Đây là "đường chữa lành".
- Residue làm giảm workFactor nhẹ và tăng vigilance — nối vào D1 accumulators.

## Consequences
- Giấc ngủ không còn là nút reset: history tồn tại qua đêm.
- Không depression loop: ceiling + recovery có điều kiện = negative feedback loop,
  đúng cơ chế sinh học (cortisol không tích vô hạn ở người khỏe).
- Không narrative giấc mơ, không PTSD lâm sàng — vẫn defer Phase 7+.

## Enforcement
- **Assert ceiling trong substrate** (Examiner test cố ý dồn 5 ngày xấu liên tiếp →
  residue không vượt 0.35×max).
- Test: ngày trauma → sáng hôm sau residue > 0; 3 ngày bình yên → ≈ 0.
