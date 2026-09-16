# ADAPTATION — Master Document → Willowbrook hiện tại

**Ngày:** 2026-09-16
**Trạng thái:** Đề xuất của lead (Friend). Các mục DISCUSS chờ executive producer chốt.
**Chỉ đạo:** Chỉ lọc logic game. Bỏ toàn bộ roadmap/product (possession, influence, god view,
time control, replay, save/load infra) — đó là việc riêng của EP với lead, không thuộc doc này.
**Nguyên tắc lọc:**
- Không phá Phase 6 đang chạy (6A/6B PASS, 6C ở fix round 2/2, 6D chưa bắt đầu).
- Mọi adopt đều qua Examiner Tier-3 như thường lệ.
- Mọi con số sinh học trong doc gốc (ghrelin decay 3.0/h, oxytocin 1.8/h, coherence = 1−adenosine/200…)
  là **tham số tune được**, không phải chân lý thiết kế. Ghi rõ ở từng chỗ dùng.

---

## 1. ADOPT — lấy ngay (sau khi 6D xong, như Phase 6E hoặc đầu Phase 7)

### A1. Feeling-scape composition pipeline (Tier 3)
- **Lấy:** pipeline collect → merge → dominant (urgency weights) → secondary (top 3) → tone,
  + vocabulary 40 qualities (physical 16 / emotional 12 / cognitive 8 / social 4).
- **Vì sao:** đây là *hợp đồng interface* cho AI brain tương lai ("AI chỉ sống ở tầng 3").
  Ngay bây giờ nó cho WHY HUD hiển thị bằng ngôn ngữ cảm giác thay vì số —
  đúng Nguyên tắc 2 của doc (player suy luận từ hành vi/cảm giác, không đọc số).
- **Vị trí:** chạy sau C3 (emotion derivation) của 6C; đọc từ body + emotions + senses + memory.
- **Test bắt buộc:** determinism (same seed → same scape), urgency weights phân biệt được.

### A2. Hearing + smell có range và modifier (Tier 2.5)
- **Lấy:** bảng base range (speech 15, shout 40, cry 25, wolf-howl 50, thunder 100;
  cooked-food 15, smoke 25, burning 40, blood 5…) + modifier
  (mưa ×0.7, bão ×0.5, đêm ×1.5, gió cùng/ngược chiều, mệt ×0.7)
  + quality theo khoảng cách (words → tone → presence).
- **Vì sao:** 6A làm attention/salience nhưng chưa có lan truyền âm thanh/mùi theo
  khoảng cách–thời tiết. Deterministic, test được, đúng "mô hình hóa đời thật".
- **Không lấy:** giá trị range cụ thể như hằng số thiêng — là tham số tune.

### A3. Bảng World-event → tín hiệu sinh học chuẩn hóa (Tier 0)
- **Lấy:** bảng event→signal (ăn→ghrelin↓, nguy hiểm→adrenaline↑↑, mất mát→serotonin↓↓…)
  như một bảng chuẩn duy nhất thay cho update body rải rác ad hoc hiện tại.
- **Vì sao:** Examiner audit được; tránh mỗi system tự bịa coupling riêng.

### A4. Kỷ luật phân tầng + điểm dừng "đủ cho AI brain"
- Mỗi tầng chỉ biết tầng dưới nó. AI không bao giờ thấy số.
- Điểm dừng tự nhiên: không mô hình hóa sâu hơn mức AI brain dùng được
  (chống over-modeling — đúng chỉ đạo "đừng cố mô hình hóa mọi thứ").
- Áp dụng ngay cho mọi code mới từ bây giờ, không chờ phase mới.

### A5. AIContext / AIResponse — giữ như target contract (thiết kế, chưa implement)
- AI nhận: feelingScape + self (không needs/chemicals) + memories + relationships + knowledge + context.
- AI trả: actionId/target/payload + reason (góc nhìn character) + voice (inner monologue).
- Code mới hướng dần tới contract này (đưa feelingScape vào context).

---

## 2. DISCUSS — cần EP chốt

### D1. Chemical substrate: 12 chất vs tối thiểu vs giữ nguyên C3
- Doc gốc: 12 chất + 17 cặp cross-effects.
- Thực trạng: 6C vừa build C3 (body → emotion trực tiếp, đã PASS audit).
- **Option 1 (lead khuyến nghị):** giữ C3; chỉ lấy *ý* cross-effects (đói→stress,
  sợ→kiệt sức) như vài coupling đơn giản trong C3. Full 12 chất để dành Phase 7.
- **Option 2:** implement substrate tối thiểu 6 tín hiệu (đói, stress, sợ, đau, mệt, thoải mái)
  để C3 đọc — giữa đường, vẫn test được.
- **Option 3:** full 12 — lead KHÔNG khuyến nghị (số decay bịa, test burden lớn,
  quota Robin đang hạn chế, rủi ro dead code kiểu bug #13).

### D2. Organ qualities: lấy vocabulary, không simulate cơ quan
- Lấy vocabulary (hollow, racing, clammy, parched…) **suy từ body fields hiện có** —
  rẻ, có ích cho voice/memory text.
- Không simulate 9 cơ quan riêng: trùng lặp với body fields, thêm state = thêm chỗ hỏng.

### D3. Voice lines theo intensity (subtle → overwhelming)
- Fragmenting theo intensity (câu đầy đủ → câu ngắn → mảnh vỡ → một từ)
  mô hình đúng nhận thức con người dưới stress — lấy.
- Dùng cho: memory text + WHY HUD (dev). **Chưa** lấy personality × life-stage matrix
  (để dành khi có brain thật để đọc).

### D4. Dream — chỉ lấy core chức năng
- Lấy: ngủ = memory consolidation + morning mood effect
  (stress cao → nightmare → sáng hôm sau anxious).
- Không lấy: nội dung giấc mơ chi tiết, công thức coherence bịa,
  "player xem giấc mơ" (product).

---

## 3. DEFER — để dành (ghi nhận, không làm bây giờ)

- **Full 12-chemical + cross-effects:** substrate cho Phase 7.
- **Mental illness patterns:** tôn trọng 6C KHÔNG LÀM (không bệnh tâm thần lâm sàng).
  Khi làm thì đúng cách của doc: *pattern kéo dài của cùng 12 chất, không thêm chất mới*;
  PTSD "không hồi phục hoàn toàn" là mechanic narrative mạnh — để dành.
- **Dream narrative content**, **voice personality matrix**.
- **Possession / influence / replay / god-view / time-control:** product — theo chỉ đạo,
  để riêng cho EP với lead, không thuộc upgrade game-logic.

## 4. DROP — bỏ

- Số sinh học trình bày như chân lý (decay 3.0/h, 17 cặp cross-effects…): chỉ là tham số.
- Roadmap 5 phase × 2 tháng: không khớp capacity team (Robin + Examiner + lead).
- Replay storage math (3.6GB/năm), file structure TypeScript — doc gốc viết cho stack khác;
  project là JS vanilla bundle.
- "Không có rules hiển thị" áp cho **player** — nhưng HUD số hiện tại là dev tool,
  giữ cho dev, chỉ đổi những gì player thấy (khi có player-facing UI).

---

## 5. Thứ tự đề xuất

1. Xong 6C (fix round 2/2) + 6D trước — không chen scope mới.
2. A4 (kỷ luật phân tầng/điểm dừng) áp dụng ngay từ bây giờ.
3. Sau 6D: A1 + A2 + A3 + A5 như **Phase 6E "Cảm giác"** (hoặc đầu Phase 7) — vẫn qua Examiner Tier-3.
4. D1–D4 chốt trước khi implement bất kỳ mục nào trong §2.

## 6. Xung đột đã xử lý

- 6C KHÔNG LÀM "bệnh tâm thần lâm sàng" → mental illness vào DEFER, không phá quyết định cũ.
- Doc gốc "AI không thấy số" vs HUD số hiện tại → HUD là dev tool, giữ; nguyên tắc áp cho
  AI interface và player-facing display sau này.
