# CHI TIẾT D1–D4: Đang có gì → Sẽ làm gì (so với Master Document)

**Ngày:** 2026-09-16 · **Mục đích:** so từng mục với bản Master Document EP gửi,
ghi rõ cái gì đã có trong code, cái gì sẽ làm thêm, cái gì bỏ/để dành và vì sao.
**Trạng thái D1:** EP chưa chốt option (xem §D1 cuối) — doc này trình bày theo
hướng lead khuyến nghị (Option 1: giữ C3 + cross-effects đơn giản; 12 chất → Phase 7).

---

## D1 — Substrate của cảm xúc: 12 chất hóa học vs C3 hiện tại

### Doc gốc nói gì
- 12 chất: ghrelin, leptin (đói/no), cortisol, adrenaline (stress/sợ),
  dopamine, serotonin (thưởng/ổn định), oxytocin (xã hội),
  substanceP, endorphin (đau/giảm đau), adenosine, melatonin, histamine (ngủ/thức).
- Mỗi chất có công thức production − decay riêng (vd ghrelin decay 3.0/h),
  17 cặp cross-effects (vd adrenaline → cortisol +2.0, oxytocin → cortisol −0.5).
- Cảm xúc **nổi lên** từ pattern các chất. 3 chuỗi nhân quả mẫu:
  đói → stress → cáu; yêu → bình an; sợ → kiệt sức.

### Hiện tại đã có gì (6C · C3 — đã PASS Examiner)
`src/entities/02_body.js:243-290` — `deriveEmotions()` chạy sau `updateBody` mỗi tick:
- **hungry → anxious**: `intensity = clamp((0.35 − satiety)/0.35, 0.1, 1.0)` (dòng 275-278)
- **pain/damage → suffering**: cộng dồn wound + illness (dòng 281-287)
- **ổn định → content** (baseline khi không có gì xấu)
- **decay theo thời gian**: mỗi emotion có decay riêng, intensity ≤ 0.01 thì rụng
  (trừ `content`) — cảm xúc *tan dần*, không bật/tắt đột ngột (dòng 264-273)
- Cảm xúc đã nối vào: memory (C2 ghi emotion tag `tired-but-proud`),
  utility (suppression stress), WHY trace.

**Còn thiếu so với doc gốc:** không có lớp "chất" trung gian; không có cross-effects
(đói không làm tăng stress, sợ không để lại kiệt sức); không có baseline mãn tính
(lo âu kéo dài tuần, đau buồn kéo dài tháng).

### Sẽ làm gì (Option 1 — khuyến nghị)
1. **Giữ nguyên C3** — không đập đi xây lại lớp hóa chất.
2. **Thêm cross-effect couplings CÓ DECAY** (chấp nhận đề xuất từ thảo luận EP 2026-09-16 —
   conditional bật/tắt là chưa đủ, AI brain cần thấy *quá trình*):
   - Mỗi coupling là một accumulator riêng trên villager, có tích tụ + tan dần theo dt:
     `acc += rate(bodyState) * dtH; acc *= Math.pow(decayPerHour, dtH); signal += acc;`
     (dt-scaled để giữ determinism với mọi tick size.)
   - `hunger↑ → stress↑`: đói lâu thì stress tích tụ dần, ăn xong tan dần —
     không bật/tắt đột ngột.
   - `fear↑↑ → exhaustion`: sau fear event, fatigue tăng nhanh trong vài giờ tiếp theo.
   - `pain↑ → patience↓` trong social utility (nối vào modifier C2).
   - Mỗi coupling là conditional显式 (kỷ luật C2: không trọng số mờ), có test phân biệt riêng.
3. **Định nghĩa `FeelingSubstrate` interface ngay bây giờ** (chấp nhận đề xuất từ thảo luận EP):
   - Contract mà AI brain sẽ đọc: `getFeelingScape(v)`, `getLayers(v)`.
   - Implementation hiện tại: delegate về C3 + couplings (§2).
   - Implementation Phase 7: 12 chất thật — **swap được mà không phá AI brain**,
     test chạy được với cả 2 implementation (test migration path ngay từ bây giờ).
   - Kỷ luật bug #13: interface phải được *dùng thật* (C3 đi qua nó), không phải
     khai báo treo.
4. **Ghi lại các coupling thành bảng** (nối tiếp A3 — bảng world-event → signal),
   để Examiner audit được từng mũi tên nhân quả.
5. **Để dành Phase 7:** full 12 chất + 17 cặp cross-effects như substrate cho AI brain,
   tune dựa trên hành vi quan sát được (không bịa số rồi hy vọng).

### Không làm / để dành (vì sao)
- Không implement 12 chất bây giờ: số decay bịa (doc ghi như chân lý nhưng là tham số),
  12 biến state × 100 dân làng = test burden lớn, nguy cơ dead code (bài học bug #13),
  quota Robin hạn chế. Đây là Phase 7 cải trang.
- Không thêm chất mới cho bệnh tâm lý (tôn trọng 6C KHÔNG LÀM).

### Ví dụ đời thật (so sánh)
| Tình huống | Doc gốc (12 chất) | Chúng ta (Option 1 + decay accumulators) |
|---|---|---|
| Bỏ đói 2 ngày | ghrelin↑ → cortisol↑ → serotonin↓ → cáu, mất hứng | satiety↓ → anxious↑ **+ stress tích tụ dần, tan dần sau khi ăn** → cáu có quá trình |
| Gặp sói, thoát được | adrenaline↑↑ → tim đập nhanh → adenosine tích tụ → kiệt sức | fear event → fatigue tăng nhanh 3h tiếp theo (accumulator) |
| Tang thương kéo dài | serotonin↓ + dopamine↓ nhiều tuần → depression | **chưa làm** → Phase 7, qua đúng `FeelingSubstrate` interface đã định nghĩa |

---

## D2 — Cơ quan: 9 organs simulate vs vocabulary từ vựng

### Doc gốc nói gì
- 9 cơ quan (stomach, heart, lungs, muscles, skin, bladder, bowels, eyes, throat),
  mỗi cơ quan có states rời rạc (vd stomach: empty/light/full/overfull/nauseous;
  heart: slow/normal/fast/racing/irregular).
- Bảng Organ → Quality (stomach empty → `hollow`, heart racing → `racing`,
  skin clammy → `clammy`…).

### Hiện tại đã có gì
Body fields liên tục đã tồn tại: satiety, hydration, fatigue, pain, blood,
wetness, coreTemp, conditions (wound/illness…), workFactor/speedFactor (6C·C4).
**Không có** lớp cơ quan rời rạc — và cũng không cần, vì mọi organ state trong doc
đều là "bucket hóa" của một field liên tục đã có
(vd stomach empty ≈ satiety < 0.25; heart racing ≈ fear event vừa xảy ra).

### Sẽ làm gì
1. **Lấy vocabulary, không simulate cơ quan.** Bảng Organ → Quality của doc được
   tái dùng như **bảng từ vựng**: mỗi quality ánh xạ từ body fields hiện có.
   - Vd: `satiety<0.25 → "hollow"`, `fear vừa qua → "racing"`,
     `wetness>0.7 → "clammy"`, `throat: hydration<0.2 → "parched"`.
2. Vocabulary này phục vụ 2 nơi: **memory text** (episodic memory ghi bằng lời cảm giác
   thay vì số) và **D3 voice lines**.
3. Bảng ánh xạ là tham số tune được, có test: cùng body state → cùng từ vựng (deterministic).

### Không làm / để dành (vì sao)
- Không simulate 9 cơ quan như state machine riêng: trùng lặp 1-1 với body fields,
  thêm state = thêm chỗ hỏng = thêm test burden, **không sinh thêm story nào**
  mà body fields chưa sinh được (đúng chỉ đạo "đừng mô hình hóa mọi thứ").
- Nếu Phase 7 cần granularity (vd bladder urgent → hành vi tìm chỗ kín đáo),
  lúc đó mới tách — khi có consumer (AI brain) thật sự đọc.

### Ví dụ đời thật (so sánh)
| | Doc gốc | Chúng ta |
|---|---|---|
| Marta đói | `stomach.state = "empty"` → quality `hollow` | `satiety = 0.18` → từ vựng `hollow` → memory ghi "belly hollow" |
| Bram rèn xong | `muscles.state = "sore"`, `skin.state = "clammy"` | `fatigue = 0.8`, `wetness = 0.75` → "heavy", "clammy" |
| Khác biệt | thêm 9 state machines phải maintain | 0 state mới; cùng từ vựng, cùng story |

---

## D3 — Voice lines: generative engine vs intensity fragmenting

### Doc gốc nói gì
- 4 mức intensity: subtle (câu đầy đủ) → noticeable (câu ngắn) → insistent (mảnh vỡ)
  → overwhelming (một từ). Vd: "My belly feels a little empty." → "Belly empty.
  Want bread." → "Empty. Empty. Bread." → "Bread. Bread. Bread."
- Style theo personality (introvert = terse, extrovert = chatty…),
  theo life stage (child/adult/elder), language mixing (cảm xúc mạnh → tiếng mẹ đẻ).

### Hiện tại đã có gì
- Memory episodic lưu text; WHY trace + `#pi-why` HUD hiển thị reason bằng chữ
  (6A/6B đã nối reasons vào WHY).
- C2 ghi emotion tag (`tired-but-proud`) vào memory.
- **Chưa có** voice generator: memory text hiện tại là template cố định theo event.

### Sẽ làm gì
1. **Intensity fragmenting** — lấy đúng 4 mức của doc, deterministic:
   - intensity < 0.35 → câu đầy đủ ("My belly feels a little empty. I should eat soon.")
   - 0.35–0.6 → câu ngắn ("Belly empty. Want bread.")
   - 0.6–0.85 → mảnh vỡ ("Empty. Empty. Bread.")
   - > 0.85 → một từ ("Bread. Bread. Bread.")
   - Intensity lấy từ emotion intensity của C3 (đã có, đã decay).
2. **Dùng cho 2 nơi:** text của episodic memory (thay template cố định) và WHY HUD (dev).
   Đây là chỗ Nguyên tắc 2 của doc thành hình: dev/player đọc *"Belly empty.
   Everything heavy."* thay vì `satiety: 0.18`.
3. Từ vựng lấy từ D2 (organ qualities) + 40 qualities của A1 (feeling-scape).

### Không làm / để dành (vì sao)
- **Personality × life-stage matrix: để dành** khi AI brain tồn tại — hiện tại không có
  consumer nào đọc style khác nhau; làm bây giờ = trang trí (bẫy bug #13).
- **Language mixing:** để dành (game hiện tại đơn ngữ trong sim).
- Voice không ảnh hưởng decision — chỉ là *lớp trình bày* của feeling đã có.
  Kỷ luật: presentation không được lái behavior.

### Ví dụ đời thật (so sánh)
| Intensity | Doc gốc | Chúng ta (giống hệt phần này) |
|---|---|---|
| subtle | "My belly feels a little empty. I should eat soon." | y hệt — từ C3 intensity < 0.35 |
| overwhelming | "Bread. Bread. Bread." | y hệt — từ C3 intensity > 0.85 |
| Khác biệt | + style introvert/extrovert, child/elder | chưa — để dành khi có brain đọc |

---

## D4 — Dream: full simulation vs functional core

### Doc gốc nói gì
- REM cycles (5 chu kỳ/đêm), dream composition (40% ký ức 7 ngày + 30% ký ức quan
  trọng + 20% ký ức cũ + 10% hiện sinh), coherence = 1 − adenosine/200,
  loại mơ theo nguồn (oxytocin thấp → longing dream, cortisol cao → nightmare…),
  forgetting curve (intensity > 0.7 → thành memory; 0.4–0.7 → ảnh hưởng mood sáng),
  player xem giấc mơ (god view).

### Hiện tại đã có gì
- Sleep: fatigue/adeno
...[truncated 2985 chars]