# SPEC PHASE 6E — "Cảm thấy" (feeling substrate)

_Ngày: 2026-09-16. Trạng thái: SPEC (user duyệt "Ok do it" 2026-09-16, bắt đầu implement)._
_Sub-phase cuối của Phase 6 "Con người không hoàn hảo". Thiết kế đã chốt: **1B / Beta / 3B** (EP + Lead, sau hội đồng 4 persona vòng 3)._

## Tài liệu gốc (đọc trước khi implement)

- `docs/adr/ADR-001-substrate-interface.md` — quyết định 1B (interface + lint rule).
- `docs/adr/ADR-002-smallest-6e-beta.md` — quyết định Beta (phạm vi gói).
- `docs/adr/ADR-003-stress-residue.md` — quyết định 3B (stressResidue + ceiling + recovery).
- `docs/thinking-process.md` **Phần 7** — Adaptation Master Document + biên bản hội đồng vòng 3 (bối cảnh đầy đủ: 12 chemicals, 9 organs, feeling-scape, voice, dream bị cắt/hòaãn vì sao).
- `docs/ADAPT_D1-D4_DETAIL.md` — so từng mục adaptation với code hiện tại (file:dòng).
- `SPEC_PHASE6.md` — ràng buộc bất biến của cả Phase 6 (vẫn hiệu lực toàn bộ).

## Ràng buộc bất biến (Phase 6 + 3 ADR)

1. **Mỗi tính năng phải tạo câu chuyện mà hệ cũ không tạo được** (điều kiện Ông đồ) — nếu không, cắt.
2. **Substrate là lối đi độc đạo bắt buộc.** Mọi code nhận thức đọc cảm giác qua `substrate.feel(v)` / `substrate.getLayers(v)` / `substrate.getFeelingScape(v)`. **Lint rule (CI fail): cấm `v.body.` trong `src/brain/**`.** Vi phạm = đồ trang trí (Nhà nhận thức luận).
3. **ADR-001 nói rõ: KHÔNG hứa "swap êm".** Interface tồn tại để gom rewrite Phase 7 vào một implementation, không phải vì "3 accumulator tuyến tính swap êm sang 12 chất phi tuyến" — đó là lời dối trá lịch thiệp, phân phối tín hiệu VẪN sẽ đảo lộn khi swap. Ghi trung thực, không oversell.
4. **Determinism tuyệt đối:** accumulator tích tụ + decay đều dt-scaled (`acc += rate*dtH; acc *= decay^dtH`), không `Math.random()` trong gameplay mới, không conditional bật/tắt đột ngột cho cross-effects.
5. **Không chất mới cho bệnh tâm lý** (tôn trọng 6C KHÔNG LÀM): không PTSD, không depression, không narrative giấc mơ.
6. **WHY HUD sau 6E thanh trừng số float** — qualities hiển thị bằng chữ (điều kiện Ông đồ).
7. Quy trình: Robin implement → Examiner Tier-3 audit → fix tối đa 2 lần → re-audit PASS → commit. Chỉ sửa modular `src/`, rebuild bundle.

---

## E1 — Substrate interface + A3 + D1 (làm trước: nền móng)

### LÀM

**S1. `FeelingSubstrate` interface** (module mới, ví dụ `src/brain/14_substrate.js`):
- Contract: `feel(v)` → scape hiện tại; `getLayers(v)` → các lớp đóng góp; `getFeelingScape(v)` → `{dominant, secondary, tone}` (dùng ở E2).
- Implementation hiện tại: delegate về C3 (body state) + couplings D1. **Không thêm state mới ngoài accumulators của D1.**
- WHY HUD và mọi decision code trong `src/brain/**` đọc qua interface (dọn dần các chỗ chọc `v.body` — lint rule bắt từ slice này).

**S2. Lint rule cấm `v.body.` trong `src/brain/**`** — implement như một check chạy trong harness/CI (fail build nếu vi phạm). Examiner verify bằng **bypass-test cố ý**: chèn một dòng `v.body.` lén vào brain code trong môi trường test, check phải báo fail.

**A3. Bảng world-event → signal** (nối tiếp D1-coupling table):
- Mọi world event (cháy, sói, bão, chết, sinh, gossip, price shock, mất đồ...) đi qua MỘT bảng chuẩn hóa thành signal `{kind, intensity, source, tick}` trước khi vào substrate.
- Ghi lại thành bảng trong code/docs để Examiner audit được từng mũi tên nhân quả.

**D1. 3 decay accumulators qua substrate** (đúng 3 coupling đã duyệt, mỗi cái là accumulator riêng trên villager, có test phân biệt riêng):
1. `hunger↑ → stress↑`: đói lâu stress tích tụ dần, ăn xong tan dần.
2. `fear↑↑ → exhaustion`: sau fear event, fatigue tăng nhanh trong vài giờ tiếp theo.
3. `pain↑ → patience↓`: nối vào social utility modifier (C2).
- Mỗi coupling là conditional显式 (kỷ luật C2: không trọng số mờ).

### Tiêu chí nghiệm thu (Examiner Tier-3)
- Bypass-test: `v.body.` lén trong `src/brain/**` → lint fail.
- Test phân biệt từng coupling: villager đói 6h không ăn → stress accumulator > 0 và tăng theo thời gian; ăn no → decay về ~0. Fear event → fatigue rate tăng trong 3h tiếp theo rồi hết. Villager đau (pain cao) → patience trong social utility giảm có đo được.
- Cùng seed + cùng dtH → cùng accumulator values (determinism, kể cả tick size khác nhau).

---

## E2 — A1/D2 feeling-scape 12 qualities

### LÀM

**A1/D2. Core feeling-scape — đúng 12 qualities** (cap là quyết định quota, thêm phải qua ADR mới):
`hollow, parched, heavy, burning, anxious, terrified, enraged, content, lonely, revered, confused, vigilant`
- Mỗi tick: A3 signals + D1 accumulators + body state → hợp nhất thành scape `{dominant, secondary, tone}`.
- **D2 vocabulary-only:** 0 state machine cơ quan mới, không 9 organs. Vocabulary **bắt buộc đọc `conditions[]`** (wounds/illnesses), không chỉ 6 fields — bài học phản ví dụ họng bỏng của hội đồng (uống nước trào ra vẫn "parched" nếu họng bỏng).
- **A1 eye-read probe:** devtools script in perception + scape của 1 villager theo từng tick trong 24h sim; **lead đọc bằng mắt người** (không phải unit test) — chống bug attention filter nuốt tín hiệu kiểu Hearth #16. Robin viết script, lead đọc.

**WHY HUD:** thanh trừng số float — hiển thị qualities bằng chữ (ví dụ "anxious · heavy", không "stress 0.62").

### Tiêu chí nghiệm thu
- Eye-read probe 24h: lead đọc và xác nhận không có tick nào scape "đóng băng" vô lý (ví dụ cháy nhà mà vẫn `content`).
- Villager họng bỏng uống nước → vẫn `parched` (vocabulary đọc `conditions[]`, test phân biệt).
- WHY HUD không còn số float nào cho cảm giác (grep).

---

## E3 — A2 hearing + 3B stressResidue

### LÀM

**A2. Hearing cơ bản (bỏ smell):**
- Âm thanh lan theo khoảng cách vật lý (tiếng thét, tiếng động lớn): event âm thanh có `amplitude`, nghe được trong bán kính tương ứng.
- D3 voice intensity → acoustic amplitude được ghi nhận là ý tưởng hay nhưng **vẫn hoãn** (quota) — A2 chỉ làm propagation + perception, không voice lines.
- Ví dụ kiểm chứng: tiếng thét 40m giật lính gác dậy (kịch bản hội đồng đã duyệt).

**3B. `stressResidue`** (theo ADR-003):
- Accumulator 0..1, **chỉ tích khi ngày có stress/suffering cực hạn** (ngưỡng do 6E định, có test phân biệt).
- **Ceiling cứng:** `stressResidue ≤ 0.35 × maxStress` — assert trong substrate.
- **Recovery:** ngày bình yên liên tiếp (không threat, không loss, mood > 0) → residue −8%/ngày. 2–3 ngày bình yên ≈ tan hết.
- Residue làm giảm workFactor nhẹ + tăng vigilance — nối vào D1 accumulators.
- Giấc ngủ không còn là nút reset; không depression loop (ceiling + recovery có điều kiện = negative feedback loop).

### Tiêu chí nghiệm thu
- Test: ngày trauma → sáng hôm sau residue > 0; 3 ngày bình yên liên tiếp → residue ≈ 0.
- Examiner dồn 5 ngày xấu liên tiếp → residue không vượt `0.35 × maxStress` (assert kích hoạt nếu vượt).
- Tiếng thét ở 40m → guard trong bán kính nghe được và phản ứng (wake/interrupt); ngoài bán kính → không.

---

## E4 — Test pass + tích hợp

### LÀM
- **Part 28** trong `src/tests/28_autotest.js` (đăng ký `src/_order.txt`, ghi `src/MANIFEST.md`): test phân biệt cho E1 couplings, E2 vocabulary-conditions, E3 residue lifecycle + hearing radius, lint rule, determinism khác tick-size.
- Full harness 0 FAIL. Bundle rebuild.
- Dọn temp entities (không test trong canonical settlement).

### Tiêu chí nghiệm thu
- Harness: 0 FAIL, Part 28 pass toàn bộ.
- Examiner Tier-3 audit PASS cho cả E1→E3 (một audit cuối hoặc theo slice — lead quyết khi chạy).

---

## KHÔNG LÀM (đã chốt, không mở lại trong 6E)

- Smell/khứu giác, vị giác.
- D3 voice lines / voice intensity (không consumer = bug #13).
- D4 dream narrative đầy đủ.
- Full 12 chemicals + 17 cặp cross-effects (Phase 7).
- 9 organs state machine.
- PTSD / bệnh tâm lý / depression loop.
- A5 code (chỉ giữ trên giấy).
- Expectation cho mọi thứ ngoài 3 nhóm 6A đã chốt.

---

## Enforcement tổng hợp

| # | Quy tắc | Ai verify |
|---|---|---|
| 1 | Lint cấm `v.body.` trong `src/brain/**` (CI fail) | Robin implement, Examiner bypass-test |
| 2 | A1 eye-read probe 24h, lead đọc bằng mắt | Robin viết script, lead đọc |
| 3 | Assert `stressResidue ≤ 0.35 × maxStress` trong substrate | Examiner test 5 ngày xấu |
| 4 | WHY HUD không còn float cho cảm giác | grep + Examiner |
| 5 | Determinism: cùng seed + dtH → cùng kết quả, mọi tick-size | test phân biệt |
| 6 | Không `Math.random()` trong gameplay mới | Examiner grep |

## Thứ tự implement (Robin, slice ≤20 phút, checkpoint file `.phase6e_progress.md`)

1. **E1**: substrate interface + lint rule + A3 table + D1 3 accumulators.
2. **E2**: 12 qualities scape + vocabulary conditions[] + WHY HUD chữ + eye-read probe script.
3. **E3**: hearing propagation + stressResidue + ceiling assert + recovery.
4. **E4**: Part 28 tests + full harness + rebuild + Examiner audit cuối.

Mỗi slice: tự verify bằng production-path probe thật, ghi checkpoint (files/lines đổi + contract cho slice tiếp + loose ends), kết thúc bằng `PROGRESS SAVED, CONTINUATION NEEDED` nếu bị cắt.
