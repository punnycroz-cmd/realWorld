# SPEC PHASE 7 — "Xã hội có thể chế"
_Ngày: 2026-09-17. Trạng thái: SPEC (chờ EP duyệt). Điều kiện tiên quyết: Phase 6E đã close (commit f3a41b7)._

## Tài liệu gốc (đọc trước khi implement)

- `docs/thinking-process.md` **Phần 4** — 9 nguyên tắc dẫn đường (ràng buộc bắt buộc, tóm tắt bên dưới).
- `docs/thinking-process.md` **Phần 7** — Adaptation Master Doc + hội đồng 4 persona vòng 3 (12 chemicals, cross-effects, feedback vòng kín, grief bounded).
- `docs/ADAPT_D1-D4_DETAIL.md` — D1: 12 chất + 17 cặp cross-effects (tên chất, chuỗi nhân quả mẫu).
- `docs/adr/ADR-001-substrate-interface.md` — rewrite gom vào một implementation, KHÔNG hứa "swap êm".
- `.phase6e_progress.md` — contract E1→E4 (FeelingSubstrate API, signal table, acoustic falloff, stressResidue).
- Nợ Phase 6D (WORK_LOG.md): 5 món chưa xong (xem 7E).

## Ràng buộc bất biến

**Kế thừa Phase 6 (tóm tắt):** cấm hoàn hảo hóa là luật tối cao — mỗi tính năng phải chứng minh tạo câu chuyện mà hệ cũ không tạo được (điều kiện Ông đồ); hai ngưỡng sinh học (~80% trade-off / ~85–90% override, giữ highest-need-wins); chết ngu phải có logic nội tâm; bảo toàn vật chất tuyệt đối; Belief ≠ truth (3–5 tuples, không pointer tới hidden truth); bounded (không Bayes đầy đủ, không lập pháp dân chủ, không mặc cả/lạm phát/tín dụng — đó là Phase 8); lát cắt mỏng, không waterfall; gieo cultural priors, không đòi 100% emergence.

**Bài học 6E thành luật:**
1. **Không xóa code đặc thù nhân vật khi tiền đề chưa verify bằng code** (vụ Gareth: doc viết "không tồn tại" trong khi code spawn 11 dân làng).
2. **Doc roster phải verify từ `src/data/03_roster.js`**, không viết tay.
3. **Spec viết theo hệ quả đo được**, không viết theo ý định mơ hồ ("8%/ngày" mơ hồ → implement linear; phải ghi "giảm 0.08/ngày, 3 ngày → ≈0").
4. **Brief càng tường minh càng ít correction round** (E3: 0 round; E2: 1 round vì chữ "production-path" mơ hồ).
5. **Verifier cũng có thể sai** — code chạy là trọng tài cuối, kể cả với sai lầm của người verify.

**Quy trình:** SPEC này EP duyệt → mỗi slice: Robin implement → Examiner Tier-3 audit → tối đa 2 fix rounds → re-audit PASS → commit riêng → slice tiếp.

---

## 7A — Tòa án phong tục & Guilds

### LÀM
- **Customary court:** khi proto-norm bị vi phạm (theft đã wire 6D; child-harm/neglect/fire-refusal sau 7E), KHÔNG phạt tự động — mở phiên xử: nguyên đơn, bị cáo, nhân chứng (chỉ người thực sự chứng kiến qua senses — local belief, nối 7E.2). Trưởng lão chủ trì (lớn tuổi nhất / reputation cao nhất). Phán quyết: bồi thường (restitution), lao động công ích, hoặc trục xuất. Mỗi lời khai là belief tuple có source → có thể sai, thiên vị, quên (fidelity trait).
- **Guilds:** 3 guild theo nghề (smith, baker, farmer): membership list, apprenticeship (học việc làm cùng master tăng skill nhanh hơn tự học — đo được), bán hàng theo bloc với caravan được giá tốt hơn bán lẻ (nối 6D scarcity pricing).

### KHÔNG LÀM
Luật thành văn; bỏ phiếu dân chủ; cảnh sát chuyên nghiệp; nhà tù; guild độc quyền ép giá dân làng.

### Tiêu chí nghiệm thu (Examiner Tier-3, production-path, có negative control)
- Vụ trộm oan: nhân chứng mang belief sai (nhớ nhầm) → tòa phạt nhầm người → nạn nhân oan sinh grievance → câu chuyện trả thù xuất hiện (Ông đồ: hệ cũ không tạo được).
- Học việc 30 ngày tăng skill hơn tự học (đo số); người ngoài guild không được bonus.
- Guild bán bloc 10 bánh cho caravan giá/unit cao hơn bán lẻ (đo số).

---

## 7B — Thừa kế & Tang lễ/Lễ nghi

### LÀM
- **Inheritance:** chết → tài sản (inventory, nhà, công cụ) chuyển cho vợ/chồng → con → họ hàng gần nhất → của chung làng. Hai người cùng claim → đưa ra tòa 7A phân xử.
- **Funeral rite:** tang lễ 1–2 ngày sau khi chết; người tham dự nhận cohesion↑ (oxytocin), người thân nhận grief bounded (nối 7C). Bỏ tang người mình ghét → gossip/reputation consequence.
- **Harvest festival:** theo mùa, tốn food thật (bảo toàn vật chất), morale↑ cả làng.
- **Rain ritual khi hạn hán:** belief-only — KHÔNG có hiệu ứng thật lên thời tiết (trung thực: mê tín là belief, không phải mechanic); nhưng cùng làm lễ tăng cohesion vì hoạt động tập thể.

### KHÔNG LÀM
Ma thuật có tác dụng thật; tôn giáo có tổ chức (priest class); cưới hỏi phức tạp (đã có marriage 6E).

### Tiêu chí nghiệm thu
- Tranh chấp di sản (2 claim) → court 7A phân xử, người thua chấp nhận hoặc grievance (có vết).
- Góa phụ dự tang lễ: grief tan nhanh hơn góa phụ không dự (đo số, bounded — xem 7C).
- Rain ritual 7 ngày hạn hán → lượng mưa không đổi (negative control) nhưng cohesion attendees tăng.

---

## 7C — Substrate 12 chemicals (rewrite sau interface)

### LÀM
- **Rewrite implementation** sau `FeelingSubstrate` interface (ADR-001): gom vào MỘT implementation mới, 3 accumulator cũ retired. KHÔNG hứa "swap êm" — Thợ cả đã cảnh báo: phân phối tín hiệu sẽ đổi, đây là rewrite có kiểm soát, không phải tráo đổi vô hình.
- **12 chất:** ghrelin, leptin (đói/no), cortisol, adrenaline (stress/sợ), dopamine, serotonin (thưởng/ổn định), oxytocin (xã hội), substanceP, endorphin (đau/giảm đau), adenosine, melatonin, histamine (ngủ/thức). Mỗi chất: production − decay riêng, dt-scaled, deterministic, bounded (không ratchet — bài học Hearth misery −100).
- **17 cặp cross-effects** (adrenaline→cortisol+, oxytocin→cortisol−, ...) + **feedback vòng kín** (yêu cầu của Nhà sinh thái): cortisol cao kéo dài đè serotonin; dopamine↑ củng cố habit loop. Không còn "toàn mũi tên một chiều".
- **Tham số tune từ hành vi quan sát được:** mỗi hằng số phải có comment "tune từ scenario X" — cấm bịa số rồi hy vọng (ADAPT_D1).
- **Grief bounded (trả lời Ông đồ):** chết người thân → serotonin↓/dopamine↓ kéo dài, hard cap N ngày, decay tự nhiên, tăng tốc hồi phục khi dự tang lễ (7B) + tiếp xúc xã hội (oxytocin). Không vòng lặp vĩnh viễn, không depression system.
- Output vẫn đúng **12 qualities** vocabulary; AI brain sau này vẫn chỉ đọc qualities (A4) — interface với AI không đổi.

### KHÔNG LÀM
Chất thứ 13; depression/PTSD system; organ simulation (D2 đã chốt vocabulary-only); dream narrative.

### Tiêu chí nghiệm thu
- 3 chuỗi nhân quả mẫu tái hiện được: đói→stress→cáu; yêu→bình an; sợ→kiệt sức (so từng bước với bảng ADAPT_D1).
- Grief bounded: góa phụ sau 14 ngày không còn dominant grief quality (đo số); không chất nào chạm cực trị trong soak 30 ngày (chống ratchet).
- **Parity:** mọi probe 6E (E1/E2/E3/eyeread) chạy lại xanh sau rewrite — qualities quan sát được không vỡ.
- Mỗi hằng số có comment nguồn tune; hằng số không nguồn = FAIL.

---

## 7D — Needs-from-body refactor + Labour allocation + Soak test

### LÀM
- **Needs-from-body refactor** (nợ từ Phase 6): utility deficits suy từ body sim (7 physiological states) thay vì số need chạy song song. Xóa trùng lặp; giữ highest-need-wins ở ngưỡng nguy cấp; mọi decision path vẫn qua `brainThink` (bài học 6C).
- **Labour allocation** (blind spot Hearth): mỗi sáng, điều phối (elder/reputation cao) gợi ý phân công ("2 người lo nước hôm nay") dựa trên skill + need + mùa. Villager có **quyền từ chối** (autonomy — tinh thần Phase 6); từ chối nhiều → gossip/reputation, không phạt cơ học.
- **Soak test 30 ngày game** tự động, đo: không chết hàng loạt; tài nguyên trong biên (không bùng nổ/cạn kiệt); không oscillation hành vi; labour coverage — mỗi ngày có người gánh nước/đốn củi (đo % ngày được cover).

### KHÔNG LÀM
Kinh tế kế hoạch tập trung; cưỡng bức lao động; phân công tối ưu toàn cục (không optimizer — chỉ gợi ý + tự nguyện).

### Tiêu chí nghiệm thu
- Refactor xong: full harness 0 FAIL; probe phân biệt — deficit đói phản ánh đúng body.satiety (không còn 2 nguồn số lệch nhau).
- Soak 30 ngày: 0 mass-death; grain/wood/water trong biên định trước; coverage nước ≥ 90% ngày.
- Villager từ chối phân công: không mất resource cơ học, chỉ xuất hiện trong gossip (test phân biệt).

---

## 7E — Trả nợ Phase 6D (5 món)

1. **child-harm/neglect/fire-refusal proto-norms:** đang là dead API (0 production caller). Hoặc wire caller thật trong production, hoặc **cắt khỏi spec một cách trung thực** (ghi rõ vào hồ sơ lý do) — cấm để API treo.
2. **Ostracism → local belief:** chỉ người nghe gossip/trực tiếp chứng kiến mới biết và xa lánh; người xa lạ vẫn đối xử bình thường (test phân biệt có negative control). Hết vi phạm nguyên tắc "villager chỉ biết qua giác quan trung thực".
3. **fillRoleVacancy():** gắn autonomous caller trong production (role trống quá N ngày → tự tìm người thay).
4. **Caravan salt:** muối phải được *tạo ra* ở đâu đó (mỏ muối/vùng khác trong lore trade) — không đẻ từ hư không (Nguyên tắc 4); `doSellStep` giữ nguyên chỉ chuyển hàng.
5. **getWeeklyConsumption:** filter tên `T27_`.
- **Regression:** peak-hold dedup đa nguồn lửa (NN1/E3) vẫn đúng — không triple-count.

### Tiêu chí nghiệm thu
Mỗi món có test phân biệt chạy production-path; món nào cắt phải có entry trung thực trong WORK_LOG ("cắt vì X", không phải "đã xong").

---

## KHÔNG LÀM (toàn Phase 7)

Tín dụng/lạm phát/mặc cả (Phase 8); dịch tễ tiếp xúc phức tạp (Phase 8); khí hậu khắc nghiệt (Phase 8); AI Brain (Phase 9); Bayes đầy đủ; mô hình hóa mọi thứ — chỉ mô hình hóa cái tạo ra câu chuyện (chỉ đạo EP).
