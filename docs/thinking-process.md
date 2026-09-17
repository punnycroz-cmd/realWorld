# THINKING PROCESS — Willowbrook Natura: Từ bug đến triết lý "Con người không hoàn hảo"

> **Mục đích file này:** lưu lại toàn bộ quá trình suy nghĩ đằng sau các quyết định — 3 phần dưới đây — để mọi hành động sau này (đặc biệt Phase 6) đều có căn cứ đối chiếu.
> **Quy tắc:** trước khi làm bất kỳ task Phase 6 nào, đọc "Phần 4: Nguyên tắc dẫn đường" và kiểm tra task có vi phạm nguyên tắc nào không. Vi phạm → dừng, hỏi user.
> **Cách đọc:** Phần 1 là bản ghi sự kiện (đã xảy ra gì). Phần 2 là đánh giá realism của agy (tại sao nó "gamey"). Phần 3 là tranh luận hướng đi mới (nên làm gì tiếp). Phần 4 là kết tinh thành nguyên tắc hành động.
>
> Ngày tạo: 2026-09-16. Người quyết định cuối: user (executive producer). Lead tổng hợp: Friend.

---

## Phần 1 — Lịch sử lỗi (bản ghi gốc, chi tiết)

**File gốc:** `WORK_LOG.md` (623 dòng) — nhật ký theo từng phase. Dưới đây là bản chi tiết từng bug: ai phát hiện, bản chất, fix bằng cơ chế gì, kết quả nghiệm thu.

**Mẫu số chung đáng chú ý:** hầu hết defect nghiêm trọng KHÔNG bị test suite của Robin bắt được (suite xanh nhưng Examiner probe độc lập vẫn tìm ra lỗi). Bài học đã ghi vào quy trình: Tier-3 bắt buộc Examiner audit đối kháng, không tin worker tự báo xanh.

### Phase 1 — Modular hóa (tách monolith → 40 modules)

| # | Bug | Phát hiện bởi | Cơ chế fix |
|---|-----|---------------|------------|
| 1 | Test lửa flaky: người dập lửa kẹt ngoài tường chuồng gỗ, không tới được ô cháy | Dev (Robin) khi chạy suite | Làm test deterministic: seed RNG cố định, setup bản đồ kiểm soát được |
| 2 | Trùng khai báo `paBlob` khi gộp file renderer | Dev khi build | Xóa khai báo trùng, giữ 1 bản duy nhất |
| 3 | Baseline đếm sai 140 vs 70 (đếm lặp 2 vòng log) | Lead khi đối chiếu | Chuẩn hóa: 70 checks, 10/10 lần chạy xanh liên tiếp mới accept |

### Phase 2A — Recipe data-driven + provenance (43 modules, suite 80/80)

| # | Bug | Phát hiện bởi | Cơ chế fix |
|---|-----|---------------|------------|
| 4 | Provenance mất khi villager → pile → villager; ghost records (người vứt giữ "bản ghi ma") | Examiner audit round 1 (CONDITIONAL PASS, 2 defects) — probe hostile: mixed-kind piles, take nhiều hơn records | Viết helper chuyển provenance theo vật phẩm qua mọi đường chuyển tay; dọn ghost records khi vật phẩm rời tay |
| 5 | Workstation không tới được → hủy im lặng, inputs biến mất | Examiner (cùng round) | Thought giải thích lý do thất bại + giữ nguyên inputs, không nuốt |

*Re-audit: Examiner rebuild độc lập (427,497 bytes), probe 14/14 → PASS, Phase 2A accepted.*

### Phase 2B — Building entities + địa điểm mới (45 modules, suite 91/91)

| # | Bug | Phát hiện bởi | Cơ chế fix |
|---|-----|---------------|------------|
| 6 | Thuật toán sông `getRiverCenter` nhấn chìm toàn bộ bờ đông; cầu gỗ cụt giữa nước sâu (wx=30) | Dev/lead trong quá trình implement (trước audit) | Sinh hành lang đất khô 2 bên bờ; cầu tự kéo dài tới khi neo vào đất cao |
| 7 | `doDrinkStep`/`doFishStep` đòi `depth > 0` → phải lội cả người xuống nước mới uống/câu được | Dev/lead trong quá trình implement | Check tương tác nguồn nước trong bán kính bờ/cầu/giếng, không ép vào ô nước |
| 8 | `findBuildingTarget("the old hut")` không thấy → fallback phá công trình gần nhất = quán trọ Sleepy Stag Inn | Examiner audit (CONDITIONAL PASS, 1 defect) | Tên riêng không thấy → trả no-target + fail trung thực; fallback chỉ cho request chung chung (home/nearest) |

*Re-audit: rebuild độc lập 466,715 bytes, suite 91/91 ×3 runs, probe 21/21 → PASS.*

### Phase 2C — Utility AI (47 modules, suite 112/112)

| # | Bug | Phát hiện bởi | Cơ chế fix |
|---|-----|---------------|------------|
| 9 | `handleActionFailure` quét mảng `thoughts` cũ → mỗi tick re-trigger, blacklist vĩnh viễn mục tiêu hợp lệ (đống lửa, giường), churn plan | Examiner audit (CONDITIONAL PASS, 1 defect) — suite 18.5 chỉ cover single-shot path nên mù | Chụp identity mảng thoughts trước base tick; chỉ xử lý khi mảng bị replace trong tick hiện tại. Thêm regression test 18.13 (discrimination test chứng minh bắt được bug cũ) |

*Re-audit: rebuild 512,702 bytes, probe 12/12 → PASS.*

### Phase 2D — Knowledge/Belief/Memory (49 modules, suite 128/128)

| # | Bug | Phát hiện bởi | Cơ chế fix |
|---|-----|---------------|------------|
| 10 | `isContentConflicting` chỉ so 5 key cứng (`kind, where, owner, amount, status`) → thông tin mới về độ bền/giá âm thầm ghi đè, mất lịch sử niềm tin | Examiner audit (CONDITIONAL PASS, 2 defects) | Mọi key chung đổi giá trị → tạo superseding belief, giữ nguyên history |
| 11 | Shallow copy mảng evidence trong `observe` → bổ sung bằng chứng hôm nay đột biến luôn ký ức quá khứ | Examiner (cùng round) | Deep-clone toàn bộ evidence + content khi đóng băng vào `v.epistemic` |

*Re-audit: rebuild 556,720 bytes, part19 15/15 → PASS. Thêm observation dedup + bounded memory.*

### Phase 2E — Social life (51 modules, suite 155/155)

| # | Bug | Phát hiện bởi | Cơ chế fix |
|---|-----|---------------|------------|
| 12 | `doChildcareStep` tăng độ no của trẻ mà không trừ kho → tạo đồ ăn từ hư không | Examiner audit (FAIL, 6 fixes required) — suite 143/143 xanh nhưng probe độc lập mù | Bắt buộc lấy thức ăn từ túi/kho gia đình; kho cạn → fail trung thực |
| 13 | `calcOccupationBonus` (+25% hiệu suất nghề) là dead code, không hệ thống nào gọi | Examiner (cùng round FAIL) | Nối vào sản xuất thật; đo được fishing output ratio = 1.25 |
| 14 | Chưa cưới vẫn thụ thai (fallback sang nam gần nhất có bond > 0.7) | Examiner (cùng round FAIL) | Chỉ vợ chồng + adult/conscious/không starving |
| 15 | `Math.random()` unseeded trong pregnancy; già/bệnh vẫn thụ thai | Examiner (cùng round FAIL) | Seeded RNG (`RNGS.s`) + chặn tuổi/mãn kinh/suy dinh dưỡng/bệnh liệt giường |
| 16 | `marry` thất bại → lệnh lặng lẽ biến mất, không thought | Examiner (cùng round FAIL) | Thought giải thích + cảm xúc tiêu cực + giảm bond |
| 17 | `{verb:'go', person}` không resolve tọa độ → `undefined` vào `planMoveToward` → villager `(NaN, NaN)` rồi chết khát | Examiner (cùng round FAIL) | Resolve person → tọa độ thật trước khi đi; reject non-finite |
| 18 | Marta (player pawn, `isNPC:false`) chết khát trong headless run vì không có `survivalGuard` | Lead khi test headless (hồi quy sau fix) | Player pawn nhận survival instincts trước khi xử lý input người chơi |

*Re-audit: rebuild 626,807 bytes, part20 26/26 → PASS, Phase 2E accepted.*

### Phase 2F — Ownership & provenance (53 modules, suite 178/178)

| # | Bug | Phát hiện bởi | Cơ chế fix |
|---|-----|---------------|------------|
| 19 | Dispute cố định 2 đương sự lúc mở đơn → nguyên đơn thứ ba mang bằng chứng gốc bị phớt lờ | Examiner audit (FAIL, 2 blocking) | Late claimant thành bên đầy đủ; claim mới sau xử → dispute mới, không viết lại kết quả cũ |
| 20 | `summarizeItem` trả `actualOwner` thật cho mọi truy vấn ngoài qua `__aiBridge` | Examiner (cùng round FAIL) | Getter viewer-scoped: chỉ trả belief-level ownership + confidence |
| 21 | Transfer log ghi "ownership stays Y" → lộ chủ thật trong vụ trộm không nhân chứng | Rà soát bổ sung trong đợt fix (lead) | Bridge sanitize copy cho steal/find/abandon; world history nội bộ giữ nguyên |
| — | Claimant mayor được xử chính vụ của mình | Rà soát bổ sung | Loại claimant mayor khỏi ghế xét xử |
| — | Dead input guard sinh borrow/steal candidates vô nghĩa | Rà soát bổ sung | Thay bằng real craft-input check |

*Re-audit → PASS, Phase 2F accepted.*

### Phase 3 — Save/load, why-inspector, overlays (57 modules, suite 206/206) — lead implement trực tiếp, Examiner 4 vòng audit

| # | Bug | Phát hiện bởi | Cơ chế fix |
|---|-----|---------------|------------|
| 22 | `WeakSet` chống đệ quy trong clone save → dân làng đang bị `otherPerson` nhìn bị null khi lưu | Examiner round 1–3 | Tách transient action refs khỏi entity bền vững trước khi serialize |
| 23 | Load xong tự tính lại `_ci` → lệch màu da/tóc villager | Examiner | Lưu/khôi phục nguyên vẹn seed + chỉ số visual đã bake |
| 24 | Feed overlay bật độc lập thì chết (renderer chặn DOM update khi không có canvas overlay nào bật) | Examiner | Tách DOM update thành tiến trình độc lập |
| 25 | Load không atomic: file lỗi (`chunks:[42]`, `villagers:[null]`, `items:{x:null}`) nhưng đã xóa world trước khi báo lỗi | Examiner (3 mức: field → element → object-map-value) | Atomic: validate trên bản tạm, toàn bộ hợp lệ mới ghi đè |
| 26 | `__proto__` smuggling 2 lớp → giả mạo stock/phantom records hoặc crash | Examiner | Từ chối `__proto__`/`constructor` ở parser |
| 27 | Payload lồng sâu 30k → recursive RangeError | Examiner | Giới hạn độ sâu + try/catch ở tầng tiếp nhận |

*Round 4: PASS + 1 minor hardening. Tất cả rejection paths fail sạch, không mutate world.*

### Phase 4 — Long-run balance (30-day deterministic run) — 2 implementation passes, Examiner audit

| # | Bug | Phát hiện bởi | Cơ chế fix |
|---|-----|---------------|------------|
| 28 | SurvivalGuard death spiral: đói → ép mua ở inn → inn hết bánh → tick sau lại ép mua → chết đói trước quầy rỗng (11/11 chết ở pass 1) | Lead khi chạy 30-day run (pass 1) | Khi nguồn chính thất bại → fallback forage tự nhiên |
| 29 | Mọi động vật (kể cả thỏ/hươu/chim) trigger flee → cắt ngang survival plan | Lead (pass 1) | Chỉ hostile predator mới gây hoảng |
| 30 | Bụi berry hái 1 lần biến mất vĩnh viễn → cạn tài nguyên sau vài ngày | Lead (pass 1) | Giữ gốc bụi, tái sinh sau 3–4 ngày mùa ấm |
| 31 | Drink timeout cứng 1.5h → đang chết khát cũng bỏ cuộc quay đầu | Lead (pass 1) | Bỏ timeout cứng; chỉ hủy khi nguồn bị phá/bị tấn công |
| 32 | Máu thấp ngất → vết thương đã cầm máu nên tỉnh ngay → máu vẫn thấp lại ngất → mỗi lần ngất xóa plan (co giật tại chỗ) | Lead khi phân tích root cause (pass 2) | `isActivelyBleeding`: chỉ down lại khi vết thương đang thực sự chảy máu; ngất sâu kéo dài nhiều giờ |
| 33 | Wall-following coi chính cái giếng-đích là chướng ngại → đi vòng tròn bán kính 70–90px quanh giếng tới chết khát | Lead (pass 2) | Bỏ qua va chạm của vật đích trong tầm tương tác 1–1.5 ô |
| 34 | Triage thứ tự cứng uống→ăn→ngủ → người còn 2h chết kiệt sức vẫn bị ép đi uống nước đầu làng xa | Lead (pass 2) | Ưu tiên theo time-to-death: kiệt 14h / khát 20h / đói 30h |
| 35 | Sói overtuned: hồi đòn 0.4h, 4 con/đêm đông → thảm sát cả làng trong vài đêm | Lead (pass 2) | Giảm spawn/night cap/tần suất tấn công; cắn 1–2 phát rồi rút |

*Kết quả cuối (verified): 11 → 8 sống, 3 births, 6 deaths (toàn chảy máu sau thú tấn công), 0 chết đói/khát/kiệt sau ngày 3. Examiner PASS. Release tag `v0.4.0-phase4` tại commit `1aded9c` — SHA-256 artifact `5d0ce53a4344f3f82fa7d1983b34dab18470af9dadd9bbe9cc22b28c34b96781` — **chưa push** (cần token GitHub mới, one-time, không lưu). Warren conditional sign-off: chưa coi là shipped cho tới khi push + reverify.*

---

## Phần 2 — Báo cáo realism của agy (2026-09-16, đầy đủ)

**Người review:** Robin (agy). **Tài liệu đối chiếu:** `WORK_LOG.md`, `SPEC_BUILD_PLAN.md`, code `src/`. **Chế độ:** REVIEW ONLY.
**Phương pháp:** mỗi bug đánh giá 3 điểm — (1) logic đằng sau mô phỏng đời thật mấy điểm (1–10) + giải thích, (2) chỗ phi thực tế, (3) gợi ý cải thiện. Trung thực, sắc bén, không nịnh.

**Điểm trung bình: 1.7/10.** Đính chính của lead: điểm này chấm **hành vi lúc còn bug** — đo độ "gamey" của logic gốc, không phải chất lượng game sau fix. Nhận xét gốc của agy: *"Dân làng không hành xử như những con người thời trung cổ có bản năng và sự khôn ngoan sinh tồn, mà hoạt động như những cỗ máy trạng thái mong manh, cứng nhắc và ngớ ngẩn. Họ sẵn sàng chết đói cạnh bụi cây chỉ vì cửa tiệm hết bánh mì, chết khát khi đang đứng ngắm miệng giếng, hoảng sợ tháo chạy trước một chú thỏ con, và bốc hơi khỏi thế giới chỉ vì có người khác nhìn vào mình khi lưu game."*

### Phase 1

**Bug 1 — Test lửa flaky (4/10).** (1) Logic dập lửa có tính nước tạt lan ngẫu nhiên sang ô lân cận (`srand() < 0.5`) và mức nguy hại tới công trình — có ý mô phỏng. (2) Phi thực tế: thuật toán va chạm coi chân tường chuồng là vật cản tuyệt đối, người dập lửa bị kẹt ngoài tầm với; ngoài đời người ta đứng ngoài tạt xô nước vào vách từ 2–3 mét, không ai bắt buộc áp sát tâm ô cháy. (3) Cho phép dội nước tầm xa dạng cung tròn (bán kính 2–3 ô) tạt qua vật cản thấp.

**Bug 2 — Trùng `paBlob` (1/10).** (1) Lỗi kỹ thuật gộp file renderer pixel-art, không mô phỏng quy luật tự nhiên/xã hội nào. (2) Khai báo đè hàm toàn cục JS — phản ánh sự chắp vá của hệ thống build ban đầu. (3) Đóng gói primitives đồ họa vào namespace cô lập, tách pipeline vẽ khỏi core simulation.

**Bug 3 — Baseline 140 vs 70 (1/10).** (1) Lỗi đo lường của dev: đếm dòng log / đếm lặp 2 vòng thay vì đếm assertion (70 tests). (2) Như quan kho trung cổ kiểm 70 bao lúa, đi đi lại lại đếm 2 lượt rồi báo 140 bao. (3) Harness bóc tách rõ suite/case/assertion, không parse text thô trên DOM.

### Phase 2A

**Bug 4 — Provenance mất + ghost records (2/10).** (1) Định hướng lai lịch vật phẩm (ai chặt cây, ai đóng bàn, chất lượng bao nhiêu) rất tốt, nhưng `doDropStep` làm đống đồ mất sạch lý lịch khi chạm đất, còn người vứt giữ "bản ghi ma". (2) Cái ghế khắc dấu thợ mộc không thể bay mất vết khắc khi chạm đất; người bán không thể giữ "vong hồn" món đồ đã trao tay. (3) Gắn metadata provenance vào item entity; rơi đất hay đổi chủ thì lý lịch đi theo nguyên vẹn.

**Bug 5 — Workstation kẹt → im lặng (2/10).** (1) Hành vi NPC gamey kinh điển: đường tới bàn thợ kẹt là hủy ngang không phản ứng. (2) Con người thấy đường vào xưởng bị chắn sẽ đứng nhìn, bực bội, tìm cách dọn chướng ngại hoặc đổi việc — không ai "mất trí nhớ" đứng đơ. (3) Chuỗi: thất bại di chuyển → thought ("Cửa xưởng bị chặn") → hạ ưu tiên chế tác, tìm cách dọn đường hoặc làm việc khác.

### Phase 2B

**Bug 6 — Sông nhấn chìm + cầu cụt (1/10).** (1) `getRiverCenter` làm trũng toàn bộ bờ đông dưới mực nước, cầu gỗ kết thúc giữa dòng sâu ở wx=30. (2) Dân làng trung cổ không bao giờ đốn gỗ dựng cầu để nó đâm thẳng xuống nước xiết làm bẫy chết người. (3) Sinh lòng sông kèm hành lang đất khô 2 bờ; nhịp cầu tự kéo dài tới khi neo vào đất cao.

**Bug 7 — Uống/câu phải đứng trong nước (2/10).** (1) `doDrinkStep`/`doFishStep` đòi `depth > 0` — phải lội cả người xuống nước mới vục uống/quăng cần. (2) Không ai nhảy xuống sông lạnh buốt ướt sũng (nguy cơ sốc nhiệt, chết cóng) chỉ để uống ngụm nước; người ta cúi từ bờ kè hoặc đứng trên cầu. (3) Check tương tác nguồn nước trong bán kính 1–1.5 ô quanh bờ/mép hồ/mặt cầu/thành giếng.

**Bug 8 — Phá nhầm quán trọ (1/10).** (1) `findBuildingTarget` không thấy "the old hut" → fallback phá công trình gần nhất = quán Sleepy Stag Inn lớn nhất làng. (2) Không thợ xây/dân tỉnh táo nào đập nát quán rượu giữa làng chỉ vì không tìm thấy cái chòi được bảo phá. (3) Hủy lệnh + báo lỗi rõ ràng; bỏ hoàn toàn fallback khi chỉ định tên riêng.

### Phase 2C

**Bug 9 — Stale-thought blacklist vĩnh viễn (2/10).** (1) `handleActionFailure` quét mảng `thoughts` cũ; mỗi tick re-trigger khiến mục tiêu hợp lệ (đống lửa, giường) bị blacklist vĩnh viễn, nhân vật rối loạn. (2) Vấp ngón chân một lần ở cửa không khiến người bình thường từ chối bước qua cửa đó đến hết đời. (3) Blacklist có cooldown (vài chục phút sim); cờ thất bại chỉ đánh giá tại tick hành động vừa xảy ra.

### Phase 2D

**Bug 10 — Conflict detection 5 key cứng (3/10).** (1) `isContentConflicting` chỉ so 5 trường cố định; thông tin mới về độ bền/giá bị ghi đè âm thầm, không lưu vết niềm tin cũ. (2) Xóa sạch lịch sử nhận thức; con người luôn nhớ mình từng nghĩ món đồ còn nguyên trước khi thấy nó vỡ. (3) Mọi thuộc tính đổi giá trị mâu thuẫn → nhánh `superseded`, lưu niềm tin cũ vào lịch sử.

**Bug 11 — Shallow copy evidence (1/10).** (1) Copy nông mảng bằng chứng trong `observe` khiến bổ sung hôm nay đột biến luôn nhật ký quá khứ. (2) Vi phạm nhân quả thời gian; bằng chứng hôm nay không thể chui ngược vào trang nhật ký tuần trước. (3) Deep-clone evidence + content khi đóng băng vào `v.epistemic`.

### Phase 2E

**Bug 12 — Childcare tạo đồ ăn (1/10).** (1) `doChildcareStep` tăng độ no của trẻ mà không trừ mẩu bánh/ngụm sữa nào trong kho. (2) "Pháp thuật thời trung cổ"; nuôi trẻ là gánh nặng bột/sữa/cháo lớn nhất của mái nhà. (3) Bắt buộc lấy thức ăn từ túi/kho gia đình (`HOUSEHOLDS`); kho cạn → trẻ quấy khóc, người chăm bế tắc.

**Bug 13 — Bonus nghề dead code (2/10).** (1) `calcOccupationBonus` phong danh hiệu thợ săn/nông dân/đầu bếp nhưng không hệ thống sản xuất nào gọi. (2) Danh hiệu hư danh kiểu RPG; thợ rèn bậc thầy phường hội phong kiến làm việc chẳng khác kẻ học việc. (3) Nối hệ số nghề vào thời gian thao tác và tỷ lệ phẩm hoàn hảo.

**Bug 14 — Chửa ngoài hôn nhân (3/10).** (1) Về sinh học là tự nhiên, nhưng ghép đôi fallback sang nam gần nhất có bond > 0.7 mà không cần hôn thú. (2) Làng quê trung cổ dưới mắt giáo xứ/dòng họ không thể có chuyện chửa bừa mà không tai tiếng, phạt vạ, phán quyết hương làng. (3) Mặc định thụ thai chỉ giữa vợ chồng cùng hộ; con ngoài giá thú → chuỗi scandal tụt danh dự nặng.

**Bug 15 — Math.random trong pregnancy (2/10).** (1) `Math.random` unseeded; phụ nữ già (elder), kiệt sức/hấp hối vẫn thụ thai bình thường. (2) Bỏ qua mãn kinh và cơ chế tự vệ cơ thể (suy dinh dưỡng nặng/bệnh tật → tự đình chỉ rụng trứng). (3) Chặn >45 tuổi và người suy dinh dưỡng/liệt giường; dùng seeded RNG (`RNGS.s`).

**Bug 16 — Cầu hôn thất bại im lặng (1/10).** (1) Điều kiện cưới không thỏa → lệnh `marry` lặng lẽ biến mất, không dòng trạng thái. (2) Bị từ chối kết hôn là cú sốc tâm lý lớn; người thật không thể thản nhiên quay lưng đi bửa củi như chưa từng mở lời. (3) Ghi sự kiện vào memory với cảm xúc tiêu cực, giảm bond, nhân vật ngượng ngùng/buồn bã vài ngày sim.

**Bug 17 — NaN position (0/10).** (1) `{verb:'go', person}` không resolve tọa độ → `undefined` vào `planMoveToward` → `(NaN, NaN)`, nhân vật bốc hơi khỏi thế giới vật lý rồi chết khát. (2) Lỗi toán học làm sập thực tại; con người không thể phân rã tọa độ cơ thể vào hư không chỉ vì không biết bạn ở đâu. (3) Resolve tên → tọa độ thật trước khi bước; không biết thì thought thất bại + hủy lệnh an toàn.

**Bug 18 — Marta chết khát thiếu survivalGuard (1/10).** (1) Marta `isNPC:false`; người chơi thả tay khỏi bàn phím → game trừ nước tới cạn mà không kích hoạt `survivalGuard`, cô đứng chết khát cạnh giếng. (2) Con người có bản năng sinh tồn; không ai mở mắt chịu chết khô trước nguồn nước chỉ vì "chưa nhận lệnh từ thượng đế". (3) Chỉ số sinh học chạm báo động → bản năng vô điều kiện ghi đè, tự uống/tìm thức ăn.

### Phase 2F

**Bug 19 — Loại nguyên đơn thứ ba (3/10).** (1) Dispute cố định 2 đương sự lúc mở đơn; người thứ ba mang bằng chứng gốc bị phớt lờ. (2) Tòa thôn dã xử theo sự thật; từ chối thụ lý người có quyền lợi chỉ vì "đã đủ 2 người" là tư duy cứng của mảng lập trình. (3) Giữ vụ kiện mở cho bên liên quan đệ trình thêm trước phiên xử trưởng làng.

**Bug 20 — actualOwner leak (1/10).** (1) `summarizeItem` trả chủ thật trong database cho mọi thực thể ngoài truy vấn. (2) "Vầng hào quang toàn tri"; không ai thời trung cổ nhìn cái rìu trong rừng mà biết ngay chủ hợp pháp nếu thiếu dấu hiệu. (3) Bridge lọc theo góc nhìn từng nhân vật: chỉ `believedOwner` + `confidence`.

**Bug 21 — Log "ownership stays Y" (2/10).** (1) Trộm lén lút giữa đêm không ai hay, nhưng log ghi thẳng tên nạn nhân + khẳng định quyền sở hữu không đổi. (2) "Biên niên sử toàn tri": không nhân chứng mà cả làng đọc rành rọt chân tướng trên bảng tin. (3) Nhật ký công khai chỉ ghi cái có người chứng kiến; trộm trót lọt chỉ vào tâm trí kẻ trộm — người mất chỉ biết đồ biến mất.

### Phase 3

**Bug 22 — Clone null dân làng (0/10).** (1) `WeakSet` chống đệ quy khiến dân làng đang bị `otherPerson` nhìn thành `null` khi lưu game. (2) Lỗi kỹ thuật thuần túy; ghi sổ bộ làng làm bốc hơi con người đang thở ngoài trời. (3) Tách transient action refs khỏi entity bền vững trước khi serialize.

**Bug 23 — _ci lệch sau load (1/10).** (1) Nạp save tự tính lại `_ci` cho dân làng, sai lệch visual gốc. (2) Đi ngủ thức dậy thấy màu da/tóc cư dân bị tráo do vũ trụ "quên" thông số. (3) Lưu/khôi phục nguyên vẹn seed + chỉ số visual đã bake, không tính lại.

**Bug 24 — Feed overlay chết độc lập (2/10).** (1) Renderer chặn DOM update nếu không có canvas overlay nào khác bật. (2) Muốn đọc tin làng bắt buộc bật bản đồ nhiệt hoặc ranh giới phân lô. (3) Tách DOM update thành tiến trình độc lập khỏi canvas cycle.

**Bug 25 — Load không atomic (0/10).** (1) File lỗi (`chunks:[42]`) nhưng đã xóa sạch world đang chạy trước khi crash. (2) "Thảm họa hành chính": thư lại đốt trụi làng trước khi kiểm tra sổ hộ tịch mới có đọc được không. (3) Atomic: validate trên bộ nhớ tạm; toàn bộ hợp lệ mới ghi đè.

**Bug 26 — __proto__ smuggling (1/10).** (1) Chèn prototype key giả mạo dữ liệu kho/crash engine. (2) Lỗ hổng JS hiện đại, không có tương đương trung cổ. (3) Từ chối `__proto__`/`constructor` ở parser trước khi gán.

**Bug 27 — Payload sâu 30k (1/10).** (1) Đệ quy quét cấu trúc lồng 30.000 tầng → `RangeError`. (2) Giới hạn stack máy tính, không liên quan mô phỏng. (3) Giới hạn độ sâu + try/catch ở tầng tiếp nhận.

### Phase 4

**Bug 28 — SurvivalGuard death spiral (2/10).** (1) Đói lả → guard ép mua ở quán → quán hết bánh → tick sau lại ép mua → vòng lặp chết đói trước quầy rỗng. (2) Nông dân trung cổ thấy quán hết đồ sẽ ra rừng đào củ, hái quả dại, sang hàng xóm xin ăn — không ai xếp hàng chịu chết đói ở tiệm trống. (3) Nguồn chính thất bại → fallback hành vi kiếm ăn tự nhiên (`forage`).

**Bug 29 — Thú hiền gây flee (2/10).** (1) Mọi con thú (thỏ, hươu, chim) đều kích hoạt hoảng loạn bỏ chạy, cắt đứt công việc. (2) Người làm nông sống giữa thiên nhiên; người trưởng thành chạy thục mạng vì thỏ gặm cỏ là cực kỳ lố bịch. (3) Chỉ trigger khi thú thuộc nhóm ăn thịt nguy hiểm + đang hung hăng/săn mồi (`hostile:true`).

**Bug 30 — Bụi quả một lần (2/10).** (1) Bụi dâu hái 1 lần biến mất vĩnh viễn, cạn tài nguyên sau vài ngày. (2) Bụi ăn quả trung cổ là thực vật lâu năm: rụng lá, ra quả theo chu kỳ thời tiết — không phải quặng mỏ đào 1 lần là tan. (3) Giữ gốc bụi, trạng thái "hết quả", mọc lại sau 3–4 ngày mùa ấm.

**Bug 31 — Drink timeout 1.5h (2/10).** (1) Uống nước đặt hạn cứng 1.5h sim; quá giờ tự hủy bước đi dù đang chết khát. (2) Người chết khát giữa trưa hè chỉ có một mục tiêu tối thượng là vục mặt vào nước; không ai bỏ cuộc vì "hết 90 phút bấm giờ". (3) Bỏ countdown cứng; chỉ hủy khi nguồn bị phá hoặc bị tấn công đe dọa mạng sống.

**Bug 32 — Ngất-tỉnh xóa plan (2/10).** (1) Máu thấp ngất (`downedTick`), vết thương đã cầm máu nên tick sau tỉnh ngay; tỉnh máu vẫn thấp lại ngất; mỗi lần ngất xóa survival plan → co giật tại chỗ. (2) Người mất máu nhiều ngoài đời hôn mê li bì hoặc nằm bất động thở dốc; không ai bật dậy như lò xo rồi lăn đùng ngất hàng trăm lần một giờ. (3) Ngất vì thiếu máu → bất tỉnh sâu nhiều giờ; tỉnh dậy duy trì ý thức bò về giường tĩnh dưỡng.

**Bug 33 — Vệ tinh quanh giếng (1/10).** (1) Tia dò chướng ngại chiếu thẳng tâm giếng; wall-following coi giếng-đích là vật cản → quay vòng bán kính 70–90px tới chết khát. (2) "Cảnh tượng khôi hài": muốn múc nước mà thành vệ tinh quay quanh miệng giếng vì sợ đâm thành giếng. (3) Bỏ qua va chạm của chính vật đích trong tầm tương tác (1–1.5 ô), cho áp sát mép giếng múc nước.

**Bug 34 — Triage sai thứ tự (3/10).** (1) Thứ tự cứng uống→ăn→ngủ; người còn 2h chết kiệt sức nhưng còn 15h mới chết khát vẫn bị ép lết sang đầu làng uống nước → gục chết kiệt dọc đường. (2) Bác sĩ/người bình thường ưu tiên mối nguy gần cái chết nhất, không tuân danh mục hành chính cố định. (3) Triage theo time-to-death: nhu cầu nào cán mốc tử vong sớm nhất xử lý trước.

**Bug 35 — Sói thảm sát (3/10).** (1) Hồi đòn 0.4h, 4 con/đêm đông, độ no sau cắn quá ít → cỗ máy đồ sát cả làng trong vài đêm. (2) Sói trung cổ rất sợ lửa, đuốc, tiếng người hô hoán; chủ yếu săn cừu/gà hoặc người lạc đơn độc mùa đông — không bao giờ liều mạng diệt chủng khu định cư có canh gác. (3) Giảm tần suất tràn làng; tăng răn đe của lửa/đèn; sói cắn bị thương 1 mục tiêu hoặc tha được xác → rút về hang.

### 3 điểm yếu lớn nhất (agy) — tiền đề của Phần 3
1. **Giòn gãy khi thất bại, thiếu thích ứng sinh tồn:** death loop mọi trục trặc nhỏ (quán hết bánh → lặp mua tới chết; vấp 1 lần → blacklist cả đời; giếng xa 90 phút → bỏ cuộc). Cần degradation ladder: A thất bại → B → C → D.
2. **Toàn tri vs cô lập nhận thức:** spec đòi phân tầng nghiêm ngặt nhưng code tuồn sự thật (bridge lộ `actualOwner`, log trộm toàn tri, childcare tạo đồ ăn, provenance mất khi rời tay). Cần triệt để epistemic isolation + bảo toàn vật chất.
3. **Sinh thái kiểu RPG thô sơ:** thỏ gây hoảng, sói như quái dungeon, bụi một lần, uống phải lội sông, nghề chỉ là mác. Cần quy luật sinh học/xã hội thật: thú sợ lửa/người, thảo mộc tái sinh theo mùa, nghề ảnh hưởng năng suất, hôn nhân chịu ràng buộc cộng đồng.

---

## Phần 3 — Thảo luận hội đồng 4 persona (2026-09-16, đầy đủ)

**Bối cảnh user đặt ra:** hướng đề xuất của agy "có 1 phần hợp lý", nhưng đời sống còn nhiều trường hợp khác — thảo luận thêm để không bỏ sót case. Quyết định quan trọng nhất của user: **"đời thật không hoàn hảo, nên đừng cố làm mọi thứ hoàn hảo"** → mỗi đề xuất phải có ĐIỂM DỪNG cụ thể: tới đâu là đủ, cái gì KHÔNG làm.

**Thành phần:** "Thợ cả" + "Ông đồ" (2 persona của lead Friend) vs "Nhà sinh thái" + "Nhà nhận thức luận" (2 persona của agy/Robin).

**3 đề xuất gốc đem ra mổ xẻ:** (1) Degradation ladder — plan A thất bại thì tụt sang B, C, D; (2) Epistemic isolation triệt để — villager chỉ hành động trên mắt thấy/tai nghe/ký ức; (3) Sinh thái hữu cơ — sói sợ lửa, cây tái sinh theo mùa, thú hiền không gây hoảng.

### 3.1. Lập trường 4 bên

**"Thợ cả" (lead, thực dụng):** Đồng ý 80% nhưng mọi cải tiến phải RẺ, TEST ĐƯỢC, DETERMINISTIC. Ba cái bẫy: (1) Ladder quá sâu thành cây quyết định khổng lồ — mỗi bậc fallback nhân đôi case test. Tối đa 3 bậc, bậc cuối luôn là hành vi bản năng rẻ nhất (đói → forage tại chỗ, không pathfinding xa). (2) Isolation 100% là ảo tưởng — có chỗ "toàn tri" vô hại (log kỹ thuật nội bộ, render). Chỉ isolate đúng 2 nơi: đầu vào quyết định của villager, và những gì villager "nói/biết" ra ngoài. Đừng refactor cả engine vì một dòng log. (3) Sinh thái: làm cái rẻ hiệu quả cao trước — sói sợ lửa/đuốc/tiếng động (vài dòng), cây tái sinh theo mùa. Đừng mô phỏng quần thể động vật đầy đủ. Cases hay bị sót: người ta LƯỜI (thà ăn đồ dự trữ dở còn hơn đi xa hái quả ngon); người ta có THÓI QUEN (vẫn ra quán quen dù hôm qua hết bánh — habit thắng optimal).

**"Ông đồ" (lead, nhân văn):** Nguy hiểm lớn nhất của hướng đề xuất là tạo ra dân làng "TỐI ƯU HOÀN HẢO" — cũng phi thực tế như cũ, chỉ khác chiều. Người thật đầy khuyết tật: HOẢNG LOẠN (quên hết ladder, chạy sai hướng, đứng đờ); BƯỚNG/SĨ DIỆN (thà nhịn đói không sang nhà kẻ thù xin ăn); BUỒN ĐAU (có tang bỏ ăn, làm cầm chừng); MÊ TÍN (không dám qua chỗ có người chết đuối); SAY RƯỢU (giảm judgment, ẩu đả); TRẺ CON tò mò (sờ lửa, đuổi bướm đi xa). Đề xuất: ladder phải có ĐIỀU KIỆN TÂM LÝ — không phải lúc nào cũng chạy full. Và cho phép một tỷ lệ nhỏ cái chết "ngu ngốc" xảy ra — đời thật vốn thế, cấm tuyệt đối thì thành thiên đường nhân tạo.

**"Nhà sinh thái" (agy) — lập trường chung:** Đồng ý có fallback, nhưng phản đối coi tự nhiên là "kho vô tận" — bậc cuối của Thợ cả ("forage tại chỗ") là bẫy chết người nếu không tính sức chứa sinh thái (carrying capacity). Về epistemic: tự nhiên không quan tâm dân làng biết gì, nhưng gửi tín hiệu vật lý — mùi khói, vết chân bùn, màu mây, tiếng sấm; villager không "biết" sói ở đâu nhưng ngửi được mùi bầy thú, thấy đàn chim hoảng bay lên. Về sinh thái hữu cơ: hoan nghênh, nhưng "hữu cơ" = tương tác hai chiều — con người kiệt quệ tự nhiên, tự nhiên phản đòn bóp nghẹt làng.

**"Nhà nhận thức luận" (agy) — lập trường chung:** Con người không bao giờ fallback dựa trên sự thật khách quan; họ fallback dựa trên MENTAL MODEL — thứ thường xuyên méo mó, lỗi thời, sai bét. Về epistemic: chặn rò rỉ toàn tri chỉ là bước 1; bước 2 quan trọng hơn — CHO PHÉP DÂN LÀNG CÓ NIỀM TIN SAI. Thế giới mà dân làng chỉ hành động khi thông tin đúng 100% mắt thấy tai nghe vẫn là "toàn tri thu nhỏ" vô hồn. Về sinh thái: con người nhìn tự nhiên qua lăng kính mê tín — sét đánh không phải tĩnh điện mà là "thần linh nổi giận vì tay đồ tể đầu làng ăn cắp".

### 3.2. 10 case đời thật mới (chưa ai nhắc trước đó)

**Nhà sinh thái — 5 case:**

1. **"Sói đói liều mạng" (ngưỡng sinh tồn bẻ gãy nỗi sợ).** Thực tế: sói sợ lửa chỉ đúng khi no/bình thường. Cuối đông tuyết phủ, mồi cạn, bản năng sinh tồn đè bẹp nỗi sợ — sói đói sẵn sàng lao qua đống lửa cắn trộm cừu, thậm chí xé đứa trẻ trước mặt người cầm đuốc. Hệ quả gameplay: đói >90% → lửa chỉ làm sói ngập ngừng ~2 giây rồi tấn công điên cuồng.
2. **"Mục nát kho lương & chuột bọ".** Thực tế: đồ ăn không nằm nguyên vẹn chờ fallback. Ẩm mùa mưa làm mốc lúa mạch; chuột kho ăn vụng + ô nhiễm lương thực. Hệ quả: dân làng ung dung về nhà kích hoạt bậc dự trữ, mở rương thấy 40% thành nấm mốc/chuột cắn → rơi tự do xuống bậc tiếp theo trong hoảng loạn.
3. **"Ô nhiễm nguồn nước & dịch".** Thực tế: hươu chết thối ở thượng nguồn, hạn hán giếng trơ đáy bùn đặc. Khát uống bừa → tiêu chảy/thổ tả. Hệ quả: nguồn nước cạn không chỉ gây khát mà gây ngộ độc — mất sức lao động dây chuyền, tê liệt sản xuất lúa mì.
4. **"Bi kịch bãi hoang" (khai thác cạn cục bộ).** Thực tế: 10 villager cùng chuyển sang hái nấm/củ dại ở bìa rừng phía Tây → sau 1 ngày trơ trọi; người thứ 11 tới nơi chẳng còn gì, vừa tốn calo di chuyển vừa đối mặt cái chết. Hệ quả: bụi/nấm phải có chỉ số depletion — không coi hái lượm là phao cứu sinh ma thuật luôn sẵn.
5. **"Thời tiết nghẽn đường & gió tạt đuốc".** Thực tế: mưa rào mùa thu tắt đuốc (mất lá chắn đêm); đường đất thành sình lầy, tốc độ di chuyển giảm 70%. Hệ quả: ra ngoài kiếm ăn ngày mưa mất gấp đôi thời gian, hạ thân nhiệt, đuốc tắt giữa đường thành mồi cho dã thú.

**Nhà nhận thức luận — 5 case:**

1. **"Tam sao thất bản & đóng băng kinh tế".** Thực tế: thợ săn A thấy 1 vết chân sói cũ → kể B "có vết sói ở bìa rừng" → B kể C "đàn sói đang rình" → C loan chợ "sói sắp tràn vào cắn chết cả làng!". Hệ quả: dân làng hoảng khóa cửa ở nhà, không ai cày/nướng bánh — kinh tế tê liệt 2 ngày chỉ vì một vết chân cũ rích.
2. **"Thầy lang mù quáng & liệu pháp chết người".** Thực tế: trung cổ tin sốt do "thừa máu" → trích máu, bắt người ốm nhịn nước. Thầy lang tốt bụng nhưng tri thức sai hoàn toàn. Hệ quả: gia đình gọi thầy lang là fallback khi ốm; thầy bôi bùn/trích máu làm villager kiệt sức chết nhanh gấp đôi — cái chết do niềm tin sai, không phải thiên tai.
3. **"Ký ức lỗi thời & cái chết vì tự tin".** Thực tế: bác nông dân nhớ như in 10 năm trước ven suối có bụi mâm xôi khổng lồ; đói dẫn cả nhà đi bộ 3 dặm tới nơi đã cháy rụi 2 mùa trước. Hệ quả: memory không tự update nếu chưa quay lại nhìn — hành động trên "dữ liệu cũ" dẫn tới quyết định tai hại.
4. **"Dán nhãn định kiến & dê tế thần".** Thực tế: mất trộm bao bột mì, không ai thấy thủ phạm, cả làng đồng loạt nghi bà góa ven rừng ("phù thủy") hoặc gã ngoại lai. Hệ quả: trust sụt vô căn cứ, từ chối giao thương/cô lập người bị nghi — dù thực tế bao bột bị chuột tha.
5. **"Ảo tưởng bình yên & mù rủi ro".** Thực tế: 3 năm không cướp/thú tấn công → quên nguy cơ: không thắp đuốc tuần tra, then chuồng cừu cài lỏng. Hệ quả: càng yên bình lâu, chỉ số cảnh giác càng tụt; biến cố ập đến thì không kịp trở tay.

### 3.3. Các màn phản biện (nguyên văn ý chính)

**Nhà sinh thái vả Thợ cả về "forage tại chỗ giá rẻ":** *"Thợ cả, anh bảo bậc cuối cùng cứ cho forage tại chỗ để đỡ tốn pathfinding và rẻ test. Nhưng đó chính là trò lừa đảo kiểu cũ! Nếu anh cho villager cứ cắm mặt xuống đất là đào ra củ ăn mà không trừ tài nguyên của tile đất đó, anh vừa lén lút tuồn 'đồ ăn từ hư không' vào game qua cửa sau! Đời thật làm gì có chuyện đó? Nếu 5 thằng cùng cắm mặt forage ở 1 góc sân, góc sân đó phải trơ trụi sỏi đá, và thằng thứ 6 phải chết đói. Anh muốn rẻ thuật toán, nhưng không được phép phá vỡ định luật bảo toàn vật chất!"*

**Nhà nhận thức luận vả Thợ cả về "chỉ isolate input/output":** *"Anh Thợ cả rất khôn ngoan khi sợ refactor, nhưng anh đang ngây thơ về mặt nhận thức. Nếu trong bộ nhớ, villager vẫn trỏ thẳng vào con trỏ `actualThief_ID` rồi anh chỉ dùng một hàm `mask()` để che đi khi in log, thì sớm muộn logic AI cũng bị 'nhiễm độc ngầm' (implicit leakage). Villager không được phép chứa con trỏ tới sự thật. Villager chỉ được chứa một bảng `Beliefs` — tức là những gì nó TIN. Nếu nó tin anh A ăn trộm (dù anh B trộm thật), toàn bộ hành vi sau đó của nó phải nhắm vào anh A. Không có chuyện 'isolate nửa vời' ở đầu vào mà đòi hành vi có chiều sâu!"*

**Cả hai vả Thợ cả về "sói sợ lửa vài dòng if/else":** *"Viết `if (hasTorch) flee()` là kiểu lập trình lười biếng thập niên 90. Nó biến con sói thành cỗ máy ngớ ngẩn. Sói sợ lửa chỉ cần thêm đúng 1 phép trừ: `Mức_sợ = Nỗi_sợ_gốc − Mức_đói`. Khi đói vượt ngưỡng, sói lao vào xé xác kẻ cầm đuốc. Cực rẻ, chỉ tốn 1 phép toán số học, nhưng chân thực tăng gấp 10 lần mà anh không chịu làm à Thợ cả?"*

**Nhà sinh thái chỉnh Ông đồ về "tâm lý lấn át sinh học":** *"Thưa Ông đồ, ông đang lãng mạn hóa cái nghèo và sự bướng bỉnh của con người! Ông bảo người ta 'thà nhịn đói không sang nhà kẻ thù xin ăn' hay 'có tang bỏ ăn đến kiệt sức'. Đúng, nhưng chỉ đúng khi họ đói ở mức 30–50%! Khi chỉ số đói chạm mức 90%, khi các cơ quan nội tạng bắt đầu tự tiêu hóa chính mình, thì sĩ diện, thù hận dòng họ hay nỗi đau mất người thân đều bị dẹp sang một bên. Lịch sử nạn đói trung cổ chứng minh: con người sẵn sàng quỳ lạy kẻ thù, ăn rễ cây thối, thậm chí ăn thịt đồng loại. Đừng biến villager thành những thi sĩ ủy mị. Sinh học luôn là ông chủ tối cao khi mạng sống bị đe dọa."*

**Nhà nhận thức luận chỉnh Ông đồ về "cái chết ngu ngốc":** *"Tôi đồng ý với Ông đồ là đời thật đầy cái chết ngu ngốc. Nhưng NGỤY BIỆN lớn nhất của người làm game là nhầm lẫn giữa 'cái chết ngu ngốc có nguyên nhân nhận thức' với 'cái chết ngẫu nhiên do xúc xắc (RNG bullshit)'. Nếu một villager chết vì tin lời thầy lang lang băm uống thuốc độc, người chơi sẽ vỗ đùi khóc thương vì bi kịch quá thật. Nhưng nếu villager đang chạy sói tự nhiên đứng đờ ra chết vì ông quăng một cái roll `panic == true`, người chơi sẽ chửi là game lỗi và rage-quit! Ngu ngốc phải có logic nội tâm của sự ngu ngốc, không phải là sự ngẫu nhiên vô nghĩa."*

**Va chạm nội bộ — Nhà sinh thái công kích Nhà nhận thức luận:** *"Ông nhận thức luận toàn vẽ ra mê cung niềm tin, tin đồn tam sao thất bản, nghe thì hay đấy nhưng quá tốn bộ nhớ. Một ngôi làng 50 người, nếu mỗi người nhớ 20 niềm tin sai về nhau thì ma trận quan hệ sẽ bùng nổ theo cấp số nhân (O(N²)). Con người ở làng quê trung cổ thực dụng lắm: sáng dậy vác cuốc ra đồng, tối về ngủ. Đói thì đi tìm ăn. Đừng biến họ thành những triết gia thành Rome ngồi soi xét niềm tin của nhau!"*

**Nhà nhận thức luận phản pháo:** *"Nếu chỉ có ăn và ngủ thì đó là đàn bò, không phải làng người! Chính những điều vô lý — như kiêng kỵ không dám bước qua cây cầu có người chết đuối, hay chia phe ghét nhau vì tin đồn mất trộm gà — mới tạo nên cái hồn của một ngôi làng. Sinh thái của ông chỉ tạo ra một cái chuồng gia súc vận hành trơn tru. Nhận thức của tôi mới biến nó thành một xã hội loài người!"*

### 3.4. Điểm dừng đã chốt (chống hoàn hảo hóa)

**Nhà sinh thái (phụ trách đề xuất 3):**
- LÀM: (1) 4 mùa tác động trực tiếp 3 tài nguyên cốt lõi (ngũ cốc, hái lượm/gỗ, thú săn) — đông tái sinh = 0; (2) sói 2 ngưỡng tâm lý sinh học (bình thường sợ đuốc/lửa bán kính 5 ô; chết đói bỏ qua lửa tấn công người yếu/cừu); (3) tile depletion — bụi cây 3 lượt hái → trơ trụi 5 ngày.
- KHÔNG LÀM: chuỗi thức ăn đa tầng (cỏ→thỏ→cáo→sói); vi khí hậu phức tạp; dịch tễ học phức tạp (dịch chỉ là 1 status effect: uống nước bẩn → −50% tốc độ & đói nhanh gấp đôi trong 3 ngày).

**Nhà nhận thức luận (phụ trách đề xuất 1 & 2):**
- LÀM: (1) Ladder 3 bậc — B1 kế hoạch tối ưu (mua/làm theo thói quen), B2 tự thân (ăn dự trữ nhà / forage bụi gần nhất trong ký ức), B3 liều lĩnh/cầu cứu (trộm / xin hàng xóm thân / ăn đồ ôi thiu); (2) belief tuple tối giản — villager chỉ lưu 3–5 mẩu `[Ai/Cái gì, Thuộc tính, Vị trí/Giá trị, Thời gian biết]`, tới nơi không thấy → update ngay; (3) tin đồn single-hop — A thấy sói kể B, B tin, B KHÔNG buôn tiếp với C (tránh bùng nổ vòng lặp).
- KHÔNG LÀM: tâm lý phân tâm học đa tầng; tin đồn sinh văn bản tự nhiên (chỉ enum `RUMOR_DANGER/THIEF/SCARCITY`); hận thù truyền kiếp (trust chỉ là int −10…+10; đói <10% bỏ qua luôn trust).

### 3.5. Đối sách cuối cùng của lead (phán quyết sau tranh luận)

1. **Nhà sinh thái thắng Thợ cả** ở forage: bậc cuối ladder không miễn định luật bảo toàn → tile/bụi có lượt hái.
2. **Tổng hợp Ông đồ + Nhà sinh thái** (mảnh ghép quan trọng nhất): khuyết tật tâm lý chỉ hiệu lực khi nhu cầu vừa (30–70%); >90% bản năng sinh học override tất cả → ladder có 2 chế độ.
3. **Đồng ý tuyệt đối với Nhà nhận thức luận** về cái chết ngu ngốc: phải có logic nội tâm (niềm tin sai), cấm RNG bullshit.
4. **Hòa giữa Thợ cả và Nhà nhận thức luận** về isolation: nguyên tắc thuộc nhận thức luận (villager chứa beliefs, không chứa con trỏ sự thật), ngân sách thuộc Thợ cả (belief tuple 3–5 mẩu, rẻ, deterministic); log kỹ thuật nội bộ giữ nguyên.

**Thứ tự LÀM:** (1) ladder 3 bậc + 2 ngưỡng tâm lý/sinh học → (2) tile depletion + 4 mùa → (3) sói 2 ngưỡng (1 phép trừ) → (4) belief tuple + rumor single-hop + trust → (5) cases mới đáng lấy: kho mốc/chuột, ký ức lỗi thời, dê tế thần, ảo tưởng bình yên, thầy lang dỏm.
**KHÔNG LÀM:** như điểm dừng 3.4. **Tên phase:** Phase 6 — "Con người không hoàn hảo" (Phase 5 theo spec là Release: push `v0.4.0-phase4`, còn 1 bước token — làm trước).

---

## Phần 4 — Nguyên tắc dẫn đường cho mọi hành động sau này

> Đọc trước khi làm bất kỳ task Phase 6 nào. Vi phạm → dừng, hỏi user. Mỗi nguyên tắc ghi kèm "vì sao" — lý do đằng sau, đúc kết từ 3 phần trên.

1. **Đời thật không hoàn hảo → cấm hoàn hảo hóa.** *Vì sao:* quyết định trực tiếp của user (2026-09-16). Mỗi đề xuất phải có điểm dừng viết sẵn. Không mô phỏng cái gì chỉ vì "cho thật hơn" mà không tạo gameplay/câu chuyện. Hệ quả: mọi spec Phase 6 phải có mục "KHÔNG LÀM" rõ ràng như 3.4.

2. **Hai ngưỡng, không phải một.** Khuyết tật tâm lý (bướng, sĩ diện, mê tín, hoảng, lười, thói quen) chỉ hiệu lực khi nhu cầu ở mức vừa (30–70%). Chạm ngưỡng sinh tử (>90%) → bản năng sinh học override tất cả. *Vì sao:* cú chỉnh của Nhà sinh thái với Ông đồ — lịch sử nạn đói trung cổ chứng minh con người quỳ lạy kẻ thù, ăn rễ thối khi đói cực hạn. Ông đồ đúng ở mức vừa, sinh thái đúng ở mức sinh tử; gộp lại mới thành người thật.

3. **Cái chết ngu ngốc phải có logic nội tâm.** Được chết vì niềm tin sai (thầy lang dỏm, ký ức 10 năm cũ, tin đồn), vì bướng, vì hoảng. Cấm chết vì RNG thuần túy. *Vì sao:* Nhà nhận thức luận chỉnh Ông đồ — người chơi khóc vì bi kịch có nguyên nhân nhận thức, nhưng chửi game lỗi và rage-quit nếu chết vì roll xúc xắc. "Ngu ngốc phải có logic nội tâm của sự ngu ngốc."

4. **Bảo toàn vật chất tuyệt đối.** Không đồ ăn/vật phẩm từ hư không — kể cả qua cửa sau như "forage tại chỗ không trừ tile". Mọi fallback sinh tồn đều trừ tài nguyên thật của world. *Vì sao:* Nhà sinh thái vả Thợ cả — 5 người cùng forage 1 góc sân thì góc sân phải trơ sỏi đá, người thứ 6 phải chết đói. Vi phạm nguyên tắc này chính là bug #12 (childcare) tái sinh dưới dạng khác.

5. **Villager chứa beliefs, không chứa con trỏ tới sự thật.** Tối đa 3–5 mẩu `[ai/cái gì, thuộc tính, ở đâu, khi nào]`. Quyết định chỉ đọc từ beliefs + senses + memory. *Vì sao:* Nhà nhận thức luận vả Thợ cả — isolate nửa vời (mask lúc log nhưng memory vẫn trỏ `actualThief_ID`) gây "nhiễm độc ngầm"; villager tin A trộm (dù B trộm thật) thì hành vi phải nhắm vào A. Nhưng ngân sách thuộc Thợ cả: tuple tối giản, không ma trận O(N²).

6. **Ngân sách của Thợ cả: rẻ, deterministic, test được.** Ladder ≤ 3 bậc. Tin đồn single-hop, enum. Trust là int −10…+10. Mọi RNG phải seeded. *Vì sao:* mỗi bậc fallback nhân đôi case test; hệ thống niềm tin phình to sẽ giết hiệu năng ở 50+ villagers (mục tiêu kiến trúc đã đặt). Bài học Phần 1: suite xanh không có nghĩa là đúng — nên càng ít case càng dễ probe.

7. **Habit và lười là bản chất, không phải bug.** Con người không phải máy tối ưu: vẫn ra quán quen dù hôm qua hết bánh, thà ăn đồ dự trữ dở còn hơn đi xa. *Vì sao:* Thợ cả nhắc — "fix" cái này thành tối ưu hoàn hảo chính là tạo ra dân làng "máy tối ưu", cái mà Ông đồ cảnh báo cũng phi thực tế như cũ, chỉ khác chiều.

8. **Tin đồn méo mó là tính năng, không phải bug — nhưng có giới hạn.** Single-hop, sai lệch dần, đó là cách làng người vận hành. *Vì sao:* Nhà nhận thức luận — tin đồn tạo ra "hồn làng" (kiêng kỵ, chia phe, dê tế thần). Nhưng cấm bùng nổ: mỗi villager chỉ giữ vài mẩu tin, không buôn tiếp quá 1 hop (lý do hiệu năng của Nhà sinh thái).

9. **Thứ tự thực hiện: Release trước, Phase 6 sau.** Phase 5 (theo spec) = push tag `v0.4.0-phase4` + reverify checksum. Không trộn release với feature mới. *Vì sao:* release đã nghiệm thu xong, chỉ còn 1 bước token; trộn feature mới vào sẽ làm mất tính "clean tagged source" mà Warren đã sign-off có điều kiện.

---

## Trạng thái hiện tại (2026-09-16)

- Phase 1–4: HOÀN THÀNH, Examiner PASS. Tag `v0.4.0-phase4` tại commit `1aded9c`, **chưa push** (cần token GitHub mới, one-time, không lưu).
- Phase 5 (Release): treo ở bước push + verify checksum/tag.
- Phase 6 ("Con người không hoàn hảo"): đã có đối sách (Phần 3.5), **chưa có spec chi tiết**.
- agy: đã bỏ jail, chạy trực tiếp unjailed (`~/workspace/agents/agy.sh`); giữ Examiner review cho mọi output Tier-3.
- File này + `WORK_LOG.md` là 2 tài liệu gốc của project. Mọi tranh luận sau này về "nên làm gì" đều phải đối chiếu với Phần 4 trước.

---

## Phần 5 — Đánh giá của Executive Producer (2026-09-16, nguyên văn)

> Đánh giá độc lập của user sau khi đọc `WORK_LOG.md` + thinking-process (Phần 1–4). Được lưu nguyên văn vì đây là định hướng chiến lược cho mọi phase sau.

Dựa trên hai file bạn vừa đưa, mình đánh giá khá khác so với việc chỉ nhìn vào master prompt. Hiện tại Willowbrook Natura đã có một nền tảng simulation đáng kể; phần cần cải thiện chủ yếu là **độ đúng của mô hình đời thực**, chứ không phải thiếu thật nhiều feature.

Các phase hiện tại đã cho thấy game đã đi khá xa: recipe/provenance, building, utility AI, perception/knowledge/belief/memory, ownership, family/birth và các hoạt động đời thường đã được triển khai; các phase này cũng đã được Examiner audit và chấp nhận sau khi sửa lỗi.

Nhưng nếu tiêu chuẩn là **"Cố gắng mô phỏng đời thật tốt nhất có thể, nhưng không cần mô phỏng mọi thứ"** thì đánh giá hiện tại như sau.

### 1. Nền tảng hiện tại: đúng hướng

Điểm đánh giá cao nhất là đã chuyển từ `NPC → task → execute` sang **world state → perception → belief/memory → decision → action → consequence**. Việc tách `REALITY / PERCEPTION / MEMORY / KNOWLEDGE / BELIEF / CLAIM / EVIDENCE / UNCERTAINTY / CONTEXT` đã được ghi rõ trong design và đưa vào implementation — nền tảng rất quan trọng nếu sau này đưa AI Brain vào. Tương tự, provenance thành persistent history thay vì item mất nguồn gốc khi đổi tay cũng là hướng đúng.

### 2. Nhưng hiện tại vẫn chưa phải "real-world simulation"

Không phải vì thiếu vài feature như bia/rượu, kiếm hay áo giáp. Điểm yếu lớn nhất đúng với kết luận trong thinking process: **(a)** con người còn quá "giỏi thích nghi"; **(b)** cognition vẫn còn khá nông; **(c)** sinh thái vẫn còn đơn giản. Và thêm điểm thứ tư: **(d)** xã hội và thể chế chưa thực sự tự hình thành.

### 3. "Đừng làm NPC tối ưu hoàn hảo" — hoàn toàn đồng ý

Nếu mục tiêu là realism, NPC `always chooses mathematically best action` không thực tế — nhưng cũng không nên chuyển sang `random stupidity`. Nguyên tắc đã chốt là đúng: **"Ngu ngốc phải có logic nội tâm của sự ngu ngốc"** — ví dụ `belief sai + habit + fear + bad memory + social pressure → quyết định ngu ngốc`, đó mới là realism tốt.

### 4. Thay đổi khái niệm "ladder"

Ladder 3 bước `A ↓ fail → B ↓ fail → C` là quyết định hợp lý về engineering/performance — nhưng về đời thực, **ladder không nên là bản chất của cognition, chỉ là implementation approximation hiện tại**. Sau này nên nghĩ: *character không có "fallback ladder"; character có một tập mục tiêu + beliefs + khả năng + cảm xúc và liên tục tái đánh giá tình hình.* Ví dụ Bram không tới được workshop: bản chất là `goal = make table` + `new observation: workshop unreachable` → diễn giải nguyên nhân → các plans khả dĩ (clear door / ask for help / find another workshop / do something else / wait) → tùy personality/knowledge/habit mà chọn khác nhau. Đó chính là cầu nối tự nhiên tới AI Brain sau này.

### 5. Ownership đã đi đúng hướng — và mức sâu hơn

Work log đã có: actual owner, current holder, ownership belief, confidence, evidence, claims, witnesses, disputed ownership, historical transfer, belief riêng từng villager — và utility AI đã hành động dựa trên **belief cá nhân** thay vì global truth. Đây là architecture cần giữ. Mức sâu hơn: **ownership nên là "social fact", không chỉ là property** — WORLD TRUTH (Bram owns axe) / LEGAL-SOCIAL NORM (village recognizes it) / OBSERVED EVIDENCE (Bram's mark) / BELIEF (Finn believes) / CLAIM (Tobin claims) / DISPUTE (Alden resolves). Khi xã hội lớn, "owner" có thể phụ thuộc custom/law/institution. Bước sau, chưa cần ngay.

### 6. Thiếu sót: perception có, nhưng "attention" thiếu

Đời thật không phải "thấy mọi thứ trong sight range đều nhận thức như nhau" — con người có **selective attention**. Marta rất đói + đang tìm thức ăn có thể đi ngang con chim mà không chú ý; nhưng nghe tiếng trẻ khóc thì attention chuyển sang đứa trẻ. Về lâu dài nên có `sensation → attention → interpretation → memory` thay vì `everything visible → knowledge`. Nền tảng quan trọng cho AI Brain.

### 7. Thiếu sót: motivation chưa đủ sâu

Utility AI đã xét hunger/thirst/fatigue/warmth/comfort/social/health/safety + personality/distance/risk/opportunities — nhưng con người còn hành động vì identity, pride, status, duty, attachment, fear, curiosity, long-term goals, responsibility, meaning. Ví dụ Alden biết ngủ tốt hơn nhưng vẫn thức chăm người bị thương — đó không phải bug, đó là **conflicting motivations**. Hướng tới `multiple competing motives → trade-off → decision`, không phải `highest need wins`.

### 8. Memory tốt, nhưng thiếu "autobiographical identity"

Memory đã có confidence/salience/decay/superseding/evidence/source/teaching — nền rất tốt. Nhưng con người dần hình thành **"Tôi là ai"**: "I am a farmer. I am Pip's mother. I survived the fire. I am bad at fishing. Bram saved me once." — self-model/identity mà AI Brain sau này rất cần. Không cần full psychology ngay, nhưng data architecture nên chừa chỗ.

### 9. Thiếu sót lớn: expectation

Con người không chỉ nhớ quá khứ — họ **dự đoán tương lai**: "It usually rains in autumn", "Shop normally has bread", "The caravan comes every winter", "My husband usually comes home before sunset." Expectation bị vi phạm → `expectation → prediction → reality differs → surprise → update belief/emotion`. Hệ thống rất mạnh để làm người thật hơn, kết nối trực tiếp learning/belief/disappointment/trust/planning.

### 10. Economy còn khá "game"

Đã có individual money, shop, caravan, inventory, occupations, dynamic occupations — nhưng kinh tế thật còn scarcity/expectations/credit/debt/risk/ownership/specialization/bargaining/future planning. Chưa cần tất cả — **đừng thêm tất cả ngay**. Ưu tiên: **scarcity + price + expectations + ownership + specialization** trước. Ví dụ muối khan hiếm → giá tăng → ướp thịt ít đi → thực phẩm mùa đông đổi → demand đổi → caravan mang nhiều muối hơn chuyến sau. Đó mới là economy emergent.

### 11. Sinh thái: đồng ý điểm dừng hiện tại, quay lại về sau

Đồng ý không làm food-chain phức tạp/microclimate/dịch tễ phức tạp ở phase hiện tại. Nhưng nếu mục tiêu cuối là best possible real-world simulation, sinh thái sẽ cần quay lại: ít nhất `resource regeneration + season + harvest pressure + population + weather → resource availability` — **nature phải có carrying capacity** (đã được document đúng ở "bảo toàn vật chất" và tile depletion).

### 12. Thiếu sót lớn nhất sau cognition: SOCIETY

Hiện đã có friendship/marriage/family/household/claims/teaching/reputation — nhưng xã hội thật tạo norm/tradition/custom/role/authority/institution/law/collective memory. Ví dụ: người cứu trẻ trong đám cháy → mọi người biết → reputation tăng → được tin hơn → được mời làm village guard → vai trò xã hội thay đổi. Không cần lập trình "Bram trở thành người hùng" — chỉ cần `action → witnessed → remembered → reputation → social trust → opportunity` là nó có thể xảy ra. **Đây là nơi Willowbrook có thể thực sự vượt khỏi RimWorld.**

### 13. Realism không đồng nghĩa với "accuracy"

Các con số cụ thể (memory decay, 30 sim-day pregnancy cooldown, bond +0.05, elder speed 0.75x, fatigue 1.35x) tốt để game vận hành — nhưng đừng tự đánh lừa rằng "có con số = khoa học". Đó chỉ là **model parameters**. Realism đến từ **parameter + relationship + feedback loop + consequence**, không phải số càng chi tiết càng thật.

### 14. "Cấm hoàn hảo hóa" nên thành luật tối cao của project

Nếu không, project dễ đi vào: thêm realism → thêm system → thêm exception → thêm AI → thêm edge case → code khổng lồ mà không chắc thật hơn. **Một simulator tốt cần biết mình cố tình không mô phỏng cái gì** — file hiện tại đã làm đúng (không food-chain đa tầng, microclimate, dịch tễ phức tạp, phân tâm học, rumor vô hạn).

### Đánh giá tổng thể

Về **kiến trúc simulation**: đã đi đúng hướng rõ ràng. Về **mức độ mô phỏng đời thực**: vẫn đang ở `FOUNDATION OF A LIVING WORLD`, chưa phải `REALISTIC SOCIETY SIMULATOR`. Không cần lao vào thêm 50 system. Thứ tự ưu tiên:

```
1. Physical causality → 2. Human needs/body → 3. Perception → 4. Belief + uncertainty
→ 5. Memory → 6. Conflicting motivations → 7. Adaptive behavior → 8. Relationships/family
→ 9. Economy → 10. Knowledge/learning → 11. Social norms/reputation → 12. Institutions/law
→ 13. Ecology → 14. Generational/cultural evolution → 15. AI Brain
```

**AI Brain nên gần cuối, chứ không phải đầu.** Foundation đã đúng: epistemic store riêng, belief sai được supersede, ownership belief tách world truth, utility AI tránh omniscience. Và đi xa hơn một bước: **Đừng xây AI Brain để "làm NPC thông minh". Hãy xây simulation đủ tốt để một AI Brain có một thế giới thực sự đáng để suy nghĩ trong đó.** Đó là khác biệt giữa NPC dùng LLM và **AI character sống trong một simulated world**.

*Lưu ý thực tế: theo chính tiêu chuẩn project, không gọi game hiện tại là "đã đạt realism" — đây là **một nền móng khá tốt đang chuyển từ game simulation sang world simulation**. Phase 5 release còn pending, Phase 6 mới có nguyên tắc, chưa có spec chi tiết.*

### Ghi chú của lead (đối chiếu sau khi lưu)

1. **Ladder:** đồng ý "ladder chỉ là approximation" — nhưng lưu ý kiến trúc hiện tại vốn đã re-evaluate mỗi tick (utility AI); ladder chỉ là nhánh xử lý thất bại. Delta để đạt "goals + beliefs + capabilities + emotions tái đánh giá liên tục" nhỏ hơn vẻ ngoài — chủ yếu là đừng hardcode chuỗi fallback, mà sinh candidate plans từ goals/beliefs.
2. **Thứ tự ưu tiên:** đồng ý khung 15 tầng; đề xuất nhấc **expectation** và **attention** lên sớm (ngay sau belief/memory) vì cả hai rẻ (attention = perception có cổng salience; expectation = expected-value records + violation detector) mà là đầu vào của mọi quyết định có hồn.
3. **Society (d):** đúng một nửa — project đã có proto-institution (mayor xử dispute, trust −10…+10, claims/witnesses, teaching); cái thiếu thật là **norm bottom-up** tự nổi lên từ hành vi lặp lại.
4. Hai câu nên thành luật khắc đá: **"Realism ≠ accuracy"** và **"Cấm hoàn hảo hóa là luật tối cao"**.

---

## Phần 6 — Biên bản hội đồng vòng 2: mổ xẻ đánh giá của Executive Producer (2026-09-16)

> Vòng 2: 4 persona (Thợ cả, Ông đồ của lead + Nhà sinh thái, Nhà nhận thức luận của Robin/agy) thảo luận Phần 5 và chốt **phương án giống real life nhất** cho 7 chủ đề. Nguyên văn ý chính, đã biên tập gọn.

### 6.1. Các cú phản biện đáng nhớ nhất

**Nhà sinh thái vả Ông đồ — về Alden thức chăm người bệnh:** "Ông đang mang thơ ca vào sinh lý học! Fatigue chạm 95% thì cơ thể kích hoạt microsleep — không có ý chí hay day dứt nào cưỡng được sự sụp đổ của tế bào thần kinh. Để Alden thức đến 100% rồi lăn ra chết vì 'nghĩa vụ' là tự sát lãng nhách, phản khoa học." → Ông đồ nhượng bộ: chấp nhận sinh học cưỡng chế override ở ngưỡng nguy cấp.

**Nhà nhận thức luận vả Ông đồ — về cảnh báo 15 tầng:** "Ông nhầm giữa cấu trúc và tính năng. 15 tầng không phải 15 hệ thống nhồi thêm — mà là làm sâu pipeline vốn có. Có Expectation Engine, ta vứt bỏ được hàng trăm dòng code kiểm tra trạng thái cứng nhắc!" → Phản biện được lead đánh giá đúng nhất buổi họp.

**Cả hai vả Thợ cả — về identity "chừa chỗ nhưng không cho ảnh hưởng decision":** "Anh muốn lặp lại thảm họa bug #13 (`calcOccupationBonus` dead code suốt bao phase) à? Lưu 'I am Pip's mother' để ngắm mà không cho tác động thì chừa chỗ làm gì cho rác bộ nhớ? 'Tôi là mẹ Pip' thì tiếng khóc của Pip phải có salience x5!"

**Nhà nhận thức luận vả Thợ cả — về attention cổng salience:** "Anh biến nhận thức con người thành bẫy rập chuột! Người mẹ lo tìm con lạc thì đi ngang đống lửa hay mẩu bánh mì cũng đui mù không thấy. Chỉ lọc theo dominant need sinh học thì tạo ra kẻ sống theo bản năng động vật cấp thấp!"

**Nhà sinh thái vả Thợ cả — về giá = f(tồn kho):** "Đó là tư duy ăn gian kiểu RPG thập niên 2000! Nếu kho không nối chuỗi vận chuyển vật lý, kinh tế đó là đồ giả. Vụ đông lúa chết rét mà thợ bánh vẫn tăng giá bán bánh từ bột 'tự sinh' là phá vỡ bảo toàn vật chất."

### 6.2. Ba quan ngại thẳng thắn với đánh giá của Executive Producer

Hội đồng được phép nêu quan ngại (quyết định cuối vẫn thuộc user):

1. **Bẫy waterfall 15 tầng:** Sơ đồ 15 tầng đẹp về nhận thức luận nhưng nguy hiểm nếu xem là lộ trình tuần tự — sẽ chết chìm như Dwarf Fortress 20 năm chưa xong. Đề xuất: xem 15 tầng là **các chiều kích nâng song song theo lát cắt mỏng (vertical slices)**, không phải bậc thang xây tuần tự.
2. **Ngây thơ về "chuẩn mực tự nổi lên 100%":** Complexity Science chứng minh quần thể 10–50 agent không có cultural priors sẽ hội tụ về deadlock bệnh lý, không tự mọc ra văn hóa làng trung cổ. Phải **"gieo mầm" khung văn hóa tối thiểu** (hôn nhân, tư hữu, sợ bóng đêm/người chết).
3. **Nguy cơ xóa highest-need-wins:** Đúng ở tầng xã hội, nhưng nếu xóa ưu tiên sinh học tuyệt đối ở mức nguy cấp, cân bằng sinh tồn Phase 4 đổ máu mới đạt được sẽ sụp. Tuyệt đối trung thành với **Nguyên tắc 2 (Hai ngưỡng)**: dưới 80% là đất trade-off/tâm lý; trên 85–90% là vương quốc độc tài của sinh học.

### 6.3. Bảy phương án được chốt

**1. Ladder → Dynamic Candidate Generation (tối đa 3).**
- Phương án: Bỏ chuỗi fallback hardcoded `A → B → C`. Khi hành động nghẽn, truy vấn Epistemic Beliefs sinh tối đa 2–3 phương án thay thế dựa trên tính cách + habit. Chỉ re-plan khi có "cú sốc nhận thức" (surprise/interruption), không re-evaluate mỗi tick để tránh rung giật.
- Vì sao thật nhất: Con người không theo kịch bản dự phòng vô hồn, cũng không tính toán toàn năng — họ dựa vào thói quen và những gì họ *tin* là có sẵn.
- Điểm dừng: KHÔNG làm GOAP đầy đủ; không quét toàn bản đồ tìm path; không quá 3 candidates.
- Ai nhượng bộ: Thợ cả (bỏ chuỗi tĩnh) ↔ Nhà nhận thức luận (chấp nhận giới hạn 3 candidates từ template có sẵn).

**2. Selective Attention — bộ lọc 3 cổng.**
- Phương án: (1) Cổng cảm giác đột biến — lửa/tiếng thét/sói cướp quyền chú ý ngay; (2) Cổng trạng thái khẩn cấp — chỉ số sinh học >75% tạo tunnel vision, lọc bỏ mọi thứ không giải quyết cơn đói/khát; (3) Cổng mục tiêu hiện tại — chỉ thứ liên quan việc đang làm dở mới vào interpretation/memory, còn lại là "nhiễu nền".
- Vì sao thật nhất: Tái hiện cơ chế sinh học mắt + não: tiết kiệm năng lượng, phản xạ tự vệ tức thời, vẫn duy trì tập trung làm việc.
- Điểm dừng: KHÔNG FOV chi tiết, không thính giác theo bước sóng, không khứu giác/vị giác.
- Ai nhượng bộ: Thợ cả (thêm cổng top-down relevance) ↔ Ông đồ (chấp nhận cổng đột biến đè bẹp mọi "trạng thái mải nghĩ").

**3. Conflicting Motivations — kiến trúc 2 tầng + cái giá cảm xúc.**
- Phương án: Tầng 1 (dưới 80%): duty/attachment/pride/habit cạnh tranh với needs qua utility có ngữ cảnh; khi motive tâm lý thắng need cơ thể (Alden nhịn ngủ chăm người ốm) → chịu **suppression stress** + ghi **emotion tag** (mệt nhưng tự hào). Tầng 2 (trên 85%): sinh học override 100%, ngất lịm/hoảng loạn tự kích hoạt.
- Vì sao thật nhất: Con người có thể anh hùng trong ngắn hạn, nhưng vẫn là tù nhân của thể xác khi sinh mệnh cạn kiệt.
- Điểm dừng: KHÔNG lý thuyết đạo đức phức tạp; KHÔNG bệnh tâm thần lâm sàng.
- Ai nhượng bộ: Ông đồ (chấp nhận override sinh học) ↔ Thợ cả (chấp nhận thêm stress + emotion tag).

**4. Autobiographical Identity — tự kết tinh, tối đa 3–5 tags.**
- Phương án: `v.identity` gồm 3–5 self-beliefs cốt lõi, KHÔNG config tay — tự hình thành khi sự kiện đạt salience cực hạn (suýt chết đuối, cứu làng khỏi cháy, bị phản bội, tay nghề đạt Master). Các tag này là bias vĩnh viễn lên attention và goal selection (vd "mẹ Pip" → tiếng khóc Pip salience x5).
- Vì sao thật nhất: Con người là sản phẩm của những vết sẹo và chiến tích lớn nhất trong quá khứ của chính mình.
- Điểm dừng: KHÔNG tự truyện văn học; KHÔNG quá 5 tags (cũ rụng khi có biến cố mới); KHÔNG identity crisis.
- Ai nhượng bộ: Thợ cả (cho identity ảnh hưởng decision) ↔ Ông đồ (chấp nhận identity chỉ là tag enum + hệ số, không văn bản văn học).

**5. Expectation / Prediction Engine — Anchored Expectations (đồng thuận nhanh nhất).**
- Phương án: Mỗi villager giữ vài kỳ vọng `[đối tượng, thuộc tính, giá trị dự đoán, độ tin cậy]`. Khớp dự đoán → củng cố niềm tin, tốn 0 calo. Lệch quá ngưỡng → sự kiện `SURPRISE` = chênh lệch × độ tin cậy → sinh cảm xúc (thất vọng/kinh ngạc/tức giận) → ép update Epistemic Store + re-plan nếu cần.
- Vì sao thật nhất: Thất vọng chỉ sinh ra khi kỳ vọng bị phản bội; não tiết kiệm năng lượng tối đa khi mọi thứ bình thường.
- Điểm dừng: KHÔNG dự báo chuỗi thời gian/Bayes đầy đủ; chỉ 3 nhóm: giá quán, vị trí đồ đạc, người thân.
- Ai nhượng bộ: Cả 4 đồng thuận ngay — thỏa mãn chân thực nhận thức, kịch tính tâm lý, chi phí rẻ nhất, thích nghi môi trường.

**6. Economy — Biophysical Scarcity.**
- Phương án: Giá = giá sàn × hệ số khan hiếm (tồn kho thực / tiêu thụ dự kiến tuần). Bảo toàn vật chất tuyệt đối: hết muối là hết thật đến khi caravan tới. Giá sốc → expectation violation → hủy mua/chuyển giải pháp thay thế. Caravan ghi demand signal, chuyến sau mang nhiều hơn theo cung cầu đơn giản.
- Vì sao thật nhất: Giá thành tín hiệu truyền khan hiếm thực từ tự nhiên đến quyết định sinh tồn, không cần bàn tay vô hình ảo thuật.
- Điểm dừng: KHÔNG mặc cả qua lại; KHÔNG lạm phát/tín dụng phức tạp.
- Ai nhượng bộ: Thợ cả (ràng buộc vật chất tuyệt đối) ↔ Nhà nhận thức luận (mua bán take-it-or-leave-it, không đấu giá).

**7. Society — Reputation-Opportunity Pipeline + 3 proto-norms gieo mầm.**
- Phương án: Hành động xã hội có nhân chứng → ký ức salience cao → tin đồn méo mó 1-hop → trust/reputation → khi có role vacancy (trưởng thôn, lính gác, thầy thuốc) chọn người uy tín cao nhất trong niềm tin tập thể. Gieo 3 proto-norms: (1) cấm trộm (bị bắt quả tang → mất sạch trust); (2) bảo vệ trẻ nhỏ; (3) tương trợ hỏa hoạn. Vi phạm → tẩy chay xã hội. Reputation có mặt tối: tin đồn sai tạo reputation sai (nối dê tế thần).
- Vì sao thật nhất: Tái hiện cách trật tự làng trung cổ hình thành: hành vi thật → tin đồn → uy tín tập thể → thừa nhận vai trò, kèm mặt tối định kiến.
- Điểm dừng: KHÔNG lập pháp dân chủ hiện đại; KHÔNG xung đột giai cấp vĩ mô; KHÔNG luật văn bản phức tạp.
- Ai nhượng bộ: Thợ cả (để tin đồn méo mó chi phối uy tín) ↔ Nhà nhận thức luận (chấp nhận hardcode 3 proto-norms làm hạt nhân thay vì đòi 100% tự phát).

### 6.4. Thứ tự triển khai đề xuất (tiêu chí: rẻ + leverage cao + tạo câu chuyện)

```
[Phase 5: Release v0.4.0-phase4 — hoàn tất push token, điều kiện tiên quyết]
        ↓
[Phase 6A: Giác quan & Kỳ vọng]  1. Selective Attention (3-gate) → 2. Expectation Engine
        ↓
[Phase 6B: Thích ứng & Sinh thái]  3. Dynamic Candidate Generation → 4. Carrying capacity + tile depletion + 4 mùa
        ↓
[Phase 6C: Tâm lý sâu & Căn tính]  5. Conflicting Motivations (2 tầng) → 6. Identity kết tinh
        ↓
[Phase 6D: Kinh tế & Xã hội]  7. Scarcity pricing + demand-responsive caravan → 8. Reputation pipeline + 3 proto-norms
```

**Roadmap xa:** Phase 7 — xã hội phức hợp & thể chế (tòa án phong tục, guilds, thừa kế, mê tín/lễ nghi); Phase 8 — kinh tế liên vùng, tín dụng trung cổ, dịch tễ tiếp xúc, khí hậu khắc nghiệt; **Phase 9 — AI Brain integration** (khi thế giới đã có logic nội tại, ký ức chân thực, động lực sâu sắc để AI thực sự sống và suy tư, không phải chatbot trả lời prompt).

### 6.5. Ghi chú của lead sau vòng 2

1. Đồng ý ~90% với hội đồng. Phản biện hay nhất vòng: "15 tầng là làm sâu pipeline, không phải nhồi thêm hệ thống — Expectation Engine giúp **vứt bỏ** hàng trăm dòng code cứng nhắc."
2. Giữ lại cảnh báo của Ông đồ như điều kiện nghiệm thu cho mọi sub-phase 6A→6D: **mỗi tầng mới phải chứng minh nó tạo ra câu chuyện mà tầng cũ không tạo được** — nếu không, 6A→6D vẫn có thể thành "thêm system → code khổng lồ" trá hình.
3. Ba quan ngại ở 6.2 (waterfall, cultural priors, giữ highest-need-wins ở ngưỡng nguy cấp) trở thành ràng buộc bắt buộc khi viết spec Phase 6.

## Phần 7 — Adaptation Master Document + hội đồng 4 persona vòng 3 (2026-09-16)

### 7.1. Bối cảnh
User gửi Master Document v1.0 (12 chemicals, 9 organs, feeling-scape, voice, dream...) yêu cầu adapt chọn lọc — chỉ logic game, bỏ roadmap. Lead viết `docs/ADAPT_MASTER_DOC.md` (ADOPT/DISCUSS D1–D4/DEFER/DROP) và `docs/ADAPT_D1-D4_DETAIL.md` (so từng mục với code hiện tại kèm file:dòng). D1 chưa chốt option thì user up thêm build ngoài "Hearth" (~5.300 dòng, áp dụng literally review của ta) — 3 bài học: misery phải bounded (không thì ratchet), opinion = list of reasons có decay (steal cho 6D), "long-run balance is not solved" (labour allocation là blind spot của ta → Phase 7).

### 7.2. Hai bổ sung từ thảo luận EP (đã chốt vào doc)
1. `FeelingSubstrate` interface ngay bây giờ (getFeelingScape/getLayers; C3 đi qua nó; Phase 7 swap không phá AI brain).
2. Cross-effects dạng accumulator tích tụ + decay dt-scaled (determinism), không conditional bật/tắt.

### 7.3. Hội đồng 4 persona vòng 3 — kết quả (biên bản đầy đủ: `docs/ADAPT_4PERSONA_DEBATE.md`)
**Đồng thuận:** A4 phân tầng (AI chỉ đọc qualities, không đọc số); D2 = vocabulary-only, 0 state machine cơ quan mới; **hoãn D3** (không consumer = bug #13); thu gọn 40 qualities → ~12 core (tiết kiệm quota); WHY HUD phải thanh trừng số float sau 6E.
**Phản biện sắc nhất:**
- Thợ cả: interface là "lời dối trá lịch thiệp" nếu hứa swap êm — 3 accumulator tuyến tính vs 12 chất phi tuyến, phân phối tín hiệu đảo lộn, AI brain sẽ hóa điên.
- Nhà sinh thái: Option 1 toàn mũi tên một chiều, thiếu feedback vòng kín — đến Phase 7 sẽ vỡ từ gốc.
- Nhà nhận thức luận (gỡ): interface trung thực **iff** nó là lối đi độc đạo bắt buộc — mọi code nhận thức phải hỏi substrate, cấm chọc thẳng `v.body`. Vi phạm = đồ trang trí.
- Ông đồ: accumulator decay theo giờ vứt bỏ chronic states — mẹ chôn con hôm qua, hôm nay ăn khoai no là `content` = robot vô hồn.
- D2: phản ví dụ họng bỏng (uống nước trào ra) + bàng quang (tè dầm khi sợ) — Thợ cả gỡ bằng `conditions[]` 3 dòng, không cần 9 organs; nhưng vocabulary **bắt buộc** phải đọc `conditions`, không chỉ 6 fields.
- D3: ý tưởng hay nhất — voice intensity → acoustic amplitude trong A2 (tiếng thét 40m giật lính gác dậy) — nhưng vẫn hoãn vì quota.
- D4: Ông đồ tố "ngủ = nút reset vô cảm"; Thợ cả cảnh báo depression loop (chưa có cơ chế chữa lành); Nhà sinh thái đề xuất `stressResidue` 10–15% bất đối xứng, 2–3 ngày bình yên mới tan.
**3 câu hỏi trình EP:** (1) 1A YAGNI vs 1B interface ngay; (2) smallest 6E: Alpha (A3+D1+A2) vs Beta (Alpha + A1/D2 12 qualities, hội đồng khuyên Beta); (3) 3A cắt sạch D4 vs 3B thêm `stressResidue`.

### 7.4. Backlog từ Hearth (user đã duyệt)
- Phase 7: soak test dài ngày + labour allocation model ("2 người lo nước hôm nay").
- 6E: sàn accumulator + thích nghi (chống ratchet kiểu Hearth mood −100).
- 6D: relationship = danh sách lý do có decay (thay số đơn).

### 7.5. 6C PASS ở attempt 2/2 (2026-09-16)
Bài học lớn nhất Phase 6: **test xanh không có nghĩa gameplay sống**. Attempt 1 đặt guard trong
planTick wrapper — nhưng `tests/18_autotest.js` bundle SAU `utility.js` nên wrap NGOÀI và nuốt
`{verb:'work'}` trước khi guard kịp chạy. Villager chảy máu vẫn làm việc, test vẫn xanh vì dùng `wait`.
Fix đúng: đặt guard tại **production choke point** `brainThink` — nơi mọi decision path đều đi qua,
không wrapper nào với tới. Examiner verify bằng probe adversarial riêng (boundary 0.69/0.71, player
không miễn trừ, 150 ticks không oscillation, flee không bị giẫm) — 9/9. Quy tắc mới: mọi gameplay
guard phải sống trong production path, và test phải drive bundled chain thật.

## 2026-09-16 — Chống chịu lỗi API bằng task nhỏ + checkpoint
API Google qua egress proxy chập chờn (POST streamGenerateContent rớt, 400 location filter) — không phải quota. Task dài 60m dính lỗi là mất trắng. Đổi chiến lược: chia phase thành task ≤20m nối tiếp, mỗi task (1) lưu checkpoint `.phase6d_progress.md`, (2) định nghĩa interface cho task sau, (3) tự verify bằng probe chạy production path thật. Mất 1 task chỉ mất 1 mảnh. Kèm quyết định của user: default model High → flash-medium (Examiner vẫn là cửa chất lượng).

## 2026-09-16 — D1 xong, lead verify thay vì đốt quota
Robin bị cắt 2 lần (timeout 20m, proxy refuse). Code nằm trên đĩa nên lead tự verify: rebuild + harness xanh + probe 8/8 chạy production path thật. Không tốn thêm quota agy. Bài học: khi code đã on-disk và việc còn lại là verify cơ học, lead làm nhanh hơn re-dispatch. Checkpoint `.phase6d_progress.md` là hợp đồng interface cho task sau — chính nó cứu Task 1.

## 2026-09-16 — 6D xong: scarcity + caravan + reputation, Examiner PASS ngay attempt đầu
Phase 6D hoàn thành trong 4 task nối tiếp (D1 → D2 → D3 → 27_autotest), mỗi task tự verify bằng probe chạy production path thật rồi lead tự chạy lại. Harness 263 lines, 0 FAIL, part27 3/3 — Examiner audit một lần là PASS, không cần fix round.
**Bài học lớn nhất 6D: checkpoint là hợp đồng interface, không chỉ là log.** Task 2 (caravan) chạy được chính vì Task 1 để lại định nghĩa đầy đủ `recordDemand/getDemand/getAllDemands/consumeDemands` trong `.phase6d_progress.md` — khi run đầu của Task 2 chết do lỗi proxy location-filter, run retry không cần hỏi lại lead. Task 4 cũng chạy được nhờ contract T2/T3 Task 3 ghi sẵn. Chiến lược "task ≤20m + checkpoint" đã đúng với mục đích chống chịu API chập chờn.
**Bài học thứ hai: đừng tin worker summary, kể cả khi số liệu đẹp.** Task 3 báo probe 31/31 — lead tự viết probe riêng và phát hiện assert vacancy của mình cũng vacuous (winner undefined vì chưa hiểu API trả `res.winner`). Sửa probe thành case có ý nghĩa (thief hunting 5 vs honest 3 → honest thắng, thief score -1) mới thực sự test T2. Examiner cũng verify lại tất cả bằng probe riêng.
**Bài học thứ ba: checkpoint phải được sửa khi audit chứng minh nó sai.** Lead từng ghi "child harm → collapse trust" như feature đã chạy; Examiner chứng minh child-harm/fire-refusal là dead API (0 production caller). Sửa checkpoint ngay, không để claim sai tồn tại. Acceptance vẫn đứng vì spec đã scope "gieo mầm" — nhưng hồ sơ phải trung thực.
**Thiết kế:** reputation = danh sách lý do có decay (không phải số đơn) — đúng khuyến nghị từ bài học Hearth. Ostracism toàn-làng ngay lập tức vi phạm nguyên tắc "villager chỉ biết qua giác quan trung thực" — nợ thiết kế Phase 7 (scope ostracism theo local belief/gossip propagation).

## 2026-09-16 — Phase 6E bắt đầu: E1 PASS ngay audit đầu

**Bối cảnh:** User hỏi "6E là gì" → giải thích 1B/Beta/3B → user hỏi ranh giới triết lý "sim chỉ mô phỏng vật lý/sinh lý, tâm lý/hành động có giao hết cho AI brain không?" → chốt 3 tầng: Tầng 1 sim = tín hiệu cơ thể (deterministic); Tầng 2 AI brain sau này = ý nghĩa/câu chuyện; ranh giới = tín hiệu vs câu chuyện. User: "vậy thì quá trình hiện tại cứ tiếp tục?" → tiếp tục, vì 6E chính là Tầng 1 + hợp đồng AI brain sẽ đọc.

**E1 (substrate interface + A3 + D1):** Robin implement → Examiner Tier-3 PASS ngay attempt đầu (probe độc lập 14 assertions, bypass-test lint đối kháng, determinism 1.11e-16, harness 272 lines 0 FAIL). Không cần fix round — giống 6D, khác 6C (6C cần 2 rounds vì bug "green tests but dead gameplay").

**Nợ phi-blocking Examiner để lại cho E2+:** (1) lint chỉ match literal `v.body.` — bracket access lọt, chưa có code nào dùng; (2) `v.mood` suy từ stress — E2 aware; (3) scape placeholder 4-quality — E2 mở rộng 12; (4) mọi `domain==='danger'` route vào fearFatigueAcc — lựa chọn có chủ ý, ghi nhận.

**Bài học dispatch:** run đầu chết yểu không để lại gì vì checkpoint chưa kịp ghi — từ nay prompt dispatch lưu trong project (`.phase6e_e1_prompt.txt`), brief nhấn mạnh "ghi sớm, ghi thường xuyên". Transient failure không tốn quota (không sinh token), tốn là thời gian lead phải canh.

## 2026-09-16 — 6E E2: Examiner bắt "test xanh gameplay chết" lần thứ hai

**Diễn biến:** Robin nộp E2 (12 qualities, WHY HUD chữ, eye-read) báo 7/7 PASS → Examiner audit round 1: **FAIL blocking B1** — toàn bộ đường A3 signal→scape không có production caller; 5/24 kinds là mũi tên chết; người thân chết vẫn `content`. Đúng pattern 6C ("survival guard không fire trong game thật") tái diễn ở lớp cảm giác.

**Bài học củng cố (lần 2): "probe chạy qua game systems" phải là tiêu chí viết trong brief, không chỉ là cách Examiner kiểm tra.** Brief E2 gốc yêu cầu "production-path probe thật" nhưng Robin hiểu "thật" = chạy trên bundle compiled, còn signal vẫn inject tay. Correction brief lần này viết tường minh: "cháy rừng thật (chạy qua game systems, KHÔNG inject signal bằng tay) + control scenario". Sau khi tiêu chí được viết rõ, Robin fix đúng ngay round 1: wire wildfireTick/survivalGuard/killVillager/setDowned/spreadGossip/birthChild/marryVillagers → 23/23 kinds sống → Examiner re-audit PASS (probe độc lập 16/16, harness 277 lines 0 FAIL).

**Quy tắc mới cho mọi brief implementation từ nay:** acceptance phải liệt kê *negative control* (scenario không có stimulus → behavior không đổi) và cấm *hand-injection* cho phần wiring. "Chạy được trên bundle" ≠ "sống trong game".

**A1 eye-read (lead đọc bằng mắt):** lần đầu tiên trong dự án nghiệm thu bằng đọc narrative — arc 24h của Alden liền mạch như người thật (đói→sợ cháy→bỏng họng→uống không hết khát→ngủ→được chữa→khỏe). Đây là bằng chứng định tính mà unit test không cho được; giữ nghi thức này cho các slice cảm giác sau.

## 2026-09-16 — 6E E3: PASS ngay audit đầu — brief tốt thì không cần fix round

**Tương phản E2 vs E3:** E2 FAIL vì brief viết "production-path probe thật" mơ hồ → Robin hiểu sai → mất 1 correction round. E3 brief viết acceptance tường minh từng chữ (negative control 50 cells, cấm hand-inject, công thức đo được) → Robin nộp 10/10 → Examiner probe độc lập 20/20 → PASS ngay attempt đầu, 0 correction. **Chất lượng brief quyết định số correction round, không phải tay nghề dev.**

**Chi tiết đáng ghi:** Examiner lần chạy đầu assert sai (tưởng nạn nhân phải nghe tiếng thét của chính mình) — code đúng vật lý (source exclusion), test sai. Examiner tự sửa test thay vì báo bug giả. Đây là mặt tốt của "verify bằng code tự chạy": cả verifier cũng có thể sai, và việc chạy code bắt được sai lầm của chính verifier.

**Nợ triết lý nhỏ (N-a/N-b):** ADR-003 viết "derived from body/mind" và "8%/ngày" nhưng implement là default 1.0 và linear −0.08/ngày. Cả hai đều thỏa hệ quả kiểm chứng được (ceiling thật, 3 ngày → ≈0). Ghi nhận: spec nên viết theo hệ quả đo được, không viết theo ý định mơ hồ — bài học cho SPEC_PHASE7.

## 2026-09-16 — 6E E4: verifier cũng có thể sai — và Gareth có thật

**Sự cố:** E4 xóa `|| v.name === 'Gareth'` vì tin "Gareth không tồn tại" — tiền đề từ chính doc fix 782b3ca mà lead duyệt hôm qua. Examiner chạy code: Gareth là Wandering Knight thật từ commit đầu, canonical 11 dân làng không phải 9. Regression: Gareth từ dám chống sói thành bỏ chạy.

**Ba lớp bài học:**
1. **Verify tiền đề bằng code trước khi xóa.** Không xóa code đặc thù dựa trên trí nhớ/doc — doc cũng có thể sai, và sai lầm của doc hôm qua suýt thành regression hôm nay.
2. **Verifier cũng sai được.** Ở E3, Examiner assert sai (tưởng nạn nhân phải nghe tiếng thét của chính mình) rồi tự sửa test. Ở E4 re-audit, Examiner lại assert sai (tưởng Gareth đi một mình cũng phải đứng) rồi tự sửa. "Verify bằng code" không có nghĩa verifier bất khả sai — nó có nghĩa sai lầm bị code bắt được, kể cả sai lầm của người verify.
3. **Doc là claim, không phải bằng chứng.** GAME_DESCRIPTION từng viết "9 dân làng" trong khi code spawn 11. Từ nay doc roster phải được generate/verify từ `03_roster.js`, không viết tay.

**Phase 6E khép lại:** 4 slices, 2 FAIL (E2 wiring chết, E4 Gareth regression) đều bắt được bởi Examiner, đều fix trong attempt budget. Harness cuối 282 lines 0 FAIL.
