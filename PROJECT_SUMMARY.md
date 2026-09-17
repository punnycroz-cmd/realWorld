# willowbrook_natura — Tổng hợp dự án
_Cập nhật: 2026-09-16. Tài liệu tổng hợp toàn bộ dự án cho chủ dự án._

---

## 1. Dự án là gì

**willowbrook_natura** là game mô phỏng cuộc sống làng quê thời trung cổ, chạy hoàn toàn trong trình duyệt, **1 file HTML duy nhất, không cần server, không cần mạng**.

Dự án ra đời từ việc kết hợp hai hướng:
- **Willowbrook** — game làng web có sẵn: đồ họa pixel-art, 8 dân làng điều khiển được, lịch sinh hoạt, kinh tế mua bán, chuông báo, minimap.
- **Natura (v9)** — triết lý mô phỏng "cơ thể sống": dân làng có nhu cầu sinh học thật (đói/khát/mệt/nhiệt/oxy), thế giới phản ứng thật (cháy rừng, sấm sét, mùa vụ), chết là chết thật, ký ức thật.

**Mục tiêu dài hạn:** đưa game tiến gần độ sâu hệ thống của Natura v9, rồi tiến tới **RimWorld** — nhưng **loại trừ "AI brain"** (bộ não AI điều khiển dân làng bằng LLM). Toàn bộ hệ thống hiện tại đều **deterministic** (không gọi LLM trong game). AI brain là phần cắm ngoài sau này qua bridge API.

## 2. Kiến trúc

| Thành phần | File | Ghi chú |
|---|---|---|
| Source (modular) | `src/` — 62 modules, thứ tự bundle tại `src/_order.txt` | Logic game viết ở đây, mỗi module một hệ thống |
| Bundler | `scripts/build_willowbrook_natura.py` | Chỉ là script **gộp** các module thành 1 file, không chứa logic game |
| File chơi | `willowbrook_natura.html` (~977 KB) | Được **generate** từ `src/`, **không sửa tay** |
| Build | `python3 scripts/build_willowbrook_natura.py` | Chạy lại mỗi khi sửa `src/` |
| Test | Harness Node (`?test`, chạy qua Node giả lập DOM) | Autotest tích hợp trong trang, 263 dòng, **0 FAIL** |

**Quy tắc sắt:**
- Chỉ sửa modular `src/`, rebuild bundle; không bao giờ sửa tay file HTML.
- Không gọi LLM/AI trong game. AI brain là phần cắm ngoài sau này qua bridge API.
- Commit/push do chủ dự án tự làm (không có đường push tự động đã xác thực).

## 3. Các hệ thống đã hoàn thành

### Nền tảng (PART 12)
- **Sinh tồn & tử vong:** chết vì đói, khát, đuối nước, rét, sốc nhiệt, kiệt sức. Xác phân hủy (tươi → rữa → xương → biến mất, ~3 ngày), chôn cất có bia mộ.
- **survivalGuard:** "bản năng sinh tồn" chạy mỗi tick — đói/khát/mệt/nguy hiểm tới mức tới hạn sẽ **ngắt mọi kế hoạch** để ăn/uống/ngủ/trốn. Không cần AI vẫn sống sót.
- **Nhận thức trung thực (honest perception):** dân làng chỉ "biết" những gì giác quan cho phép — khoảng cách bằng lời ("cách vài mét"), phương hướng, cảm nhận thời tiết/cơ thể, tầm nhìn giảm ban đêm/mưa bão. Không lộ tọa độ chính xác, nhiệt độ chính xác, chỉ số sinh học.
- **Hàng đợi hành động thật:** 16+ động từ (`go/take/drop/use/speak/eat/drink/sleep/rest/wait/fell/forage/fish/farm/build/cook/...`) thành kế hoạch nhiều bước, bị nhu cầu sinh tồn ngắt giữa chừng. Động từ lạ **báo lỗi rõ ràng**, không đoán mò.
- **Xã hội:** nói chuyện trong tầm nghe, bond tăng qua tiếp xúc, sự kiện xã hội.
- **Mang thai & sinh nở:** cặp bond cao thụ thai, thai ~20 ngày game, trẻ con cần ăn và lớn dần, render trẻ em đúng tỷ lệ (đầu to, chân ngắn).
- **Thế giới tương tác:** đốn cây ra gỗ, đống đồ/nhặt/bỏ, đống lửa, câu cá theo giờ/thời tiết, trồng trọt 4 giai đoạn, gà lang thang đẻ trứng.
- **Thảm họa:** sét đánh (thương vong + cháy), cháy rừng lan theo gió/độ khô, nhân chứng học "nguy hiểm".
- **Bệnh tật & thương tích cơ bản:** bỏng/sét gây đau giảm hiệu suất, ướt + lạnh lâu gây sốt.
- **Kinh tế:** vàng từng người, shop của Sella (bánh/cá/trứng/thịt/bữa ăn), mua bán cân đối vàng và tồn kho.
- **Event feed:** `getEvents(since)` — chết, sinh, mang thai, bond, cháy, sét, bài học nguy hiểm.

### Intent planner (PART 13)
- `postIntent(name, text)` — ra lệnh bằng lời thường: "stoke the fire", "chop wood for the winter", "bury the dead", "tend the crops"... biến thành kế hoạch thật.
- **Dreams:** ý định không hiểu được lưu vào `v.dreams`; lặp lại 3 lần → ghi nhận "capability gap" toàn cục. `getDreams()` / `getCapabilityGaps()` cho AI brain sau này đọc.

### Hiện thực hóa RimWorld (PART 14)
- **Y tế trung cổ:** vết thương chi tiết từng vị trí (tay/chân/thân/đầu), mức độ, chảy máu; **máu là tài nguyên thật** (mất máu nặng chết được); vết thương hở không băng → nhiễm trùng → sốt; chế được **thuốc đắp** (thảo dược), **nẹp gỗ** (gỗ+vải), **trà hạ sốt**; động từ `tend` (băng bó theo kỹ năng y thuật); gãy xương cần nẹp + nghỉ + ăn nhiều ngày mới lành. Wren (thầy thuốc) tự đi hái thảo dược chế thuốc.
- **Downed/rescue như đời thật:** bất tỉnh / chảy máu / gãy chân (chỉ bò được); `rescue` vác người bị nạn về giường (đi chậm 0.45x); người thân tự động cứu khi an toàn.
- **Thú nguy hiểm:** **sói** đi bầy săn đêm (sợ lửa, sợ đám đông), **lợn rừng** húc khi lại gần, **gấu** hiếm nhưng cực nguy, mò mùi thức ăn; dân làng chạy vào nhà, bị dồn thì đánh trả bằng dụng cụ, hô hoán gọi cứu viện; `hunt` → xẻ thịt → thịt + da.
- **Kỹ năng:** 8 skill 0–10 (trồng trọt, nấu ăn, xây dựng, y thuật, săn bắn, câu cá, hái lượm, may vá), XP từ làm việc thật, **năng khiếu đúng vai** (Wren giỏi thuốc, Finn giỏi câu cá...), level ảnh hưởng tốc độ/năng suất/chất lượng. Bridge `assignWork(name, job, priority)` để AI brain/player phân công.
- **Xây dựng:** tốn gỗ/đá/rơm thật, thợ non xây chậm + dễ ẩu (độ bền thấp), công trình có độ bền riêng, bão/lửa/sói phá hỏng thì `repair`.
- **Quần áo:** nhiều lớp (áo trong/áo ngoài/giày), chỉ số giữ ấm, **ướt mất 60% tác dụng**, mặc rách thì lạnh, `mend` vá, thợ may làm đồ mới từ vải/da.

### Đợt 2 hiện thực hóa (PART 15)
- **Ăn uống:** 3 hạng bữa ăn (dở/ngon/thịnh soạn) theo tay nghề + nguyên liệu; **thịt sống 35% đau bụng**, đồ ăn ôi theo ngày (nóng ôi nhanh 1.6x); `preserve` ướp muối/hun khói để dành.
- **Chăn nuôi:** `tame` thuần hoá gà/lợn con bằng thức ăn (theo kỹ năng), nhốt chuồng cho ăn thì đẻ nhanh, bỏ đói thì ốm/bỏ đi hoang, lợn đẻ lứa trong chuồng; sói sợ đất có rào.
- **Caravan lữ hành:** mỗi mùa 3 thương nhân dựng trại ~14 tiếng, hàng và giá khác shop Sella, lính gác đuổi sói, vàng cân đối.
- **Xã hội mặt tối:** sỉ nhục → bond giảm + hiềm khích; đủ 3 hiềm khích + bond thấp → **thù địch**; đánh nhau bằng tay gây thương tích thật nhưng **dừng ở gục, không giết**; người ngoài can ngăn; xin lỗi qua `speak` thì hoà giải; hiềm khích phai 5%/ngày.
- **Dập lửa:** dân làng tự xách nước từ giếng/hồ đi dập (`douse`), ưu tiên nhà > người > ruộng > rừng xa; lửa sát người vẫn bỏ chạy trước; khói dày gây ngạt.

### Phase 2–6 (tóm tắt — chi tiết tại `WORK_LOG.md` và `docs/thinking-process.md`)
- **Phase 2:** 6 đợt hiện thực hóa tiếp (2A–2F) — xây dựng sâu, y tế, xã hội, mùa vụ, kinh tế, sự kiện.
- **Phase 3:** cân bằng sinh tồn — sau 6A→6D, làng sống sót qua nhiều mùa (không còn chết đói hàng loạt như bản cũ).
- **Phase 4:** roster thực tế **9 dân làng** (Marta, Bram, Sella, Tobin, Wren, Finn, Alden, Pip, **Clara** — thương nhân tơ lụa).
- **Phase 5 (Release):** tag `v0.4.0-phase4` — tách riêng, không gộp Phase 6.
- **Phase 6 "Con người không hoàn hảo" (hoàn tất 6A→6D, commit `05caf95`):**
  - **6A Senses & Expectations** — attention gates, expectation tuples + TTL + surprise (12/12 test).
  - **6B Thích ứng & Sinh thái** — dynamic candidates belief-first, cạn kiệt/tái sinh theo mùa, sói đói/sợ, thời tiết → lửa (11/11 test).
  - **6C Survival Guard trong production `brainThink`** — bản năng sinh tồn Tier-2 override, motivation, emotion, identity (9/9 test; probe adversarial 9/9).
  - **6D Kinh tế khan hiếm & xã hội** — scarcity pricing (muối hết hàng → giá tăng), caravan đáp ứng demand thật, reputation + gossip (tin đồn sai có thể đổ tội người vô tội), proto-norm chống trộm, lấp chỗ trống theo collective trust (3/3 test Part 27).

## 4. Bridge API cho AI brain (tương lai)

Game đã sẵn sàng cắm bộ não AI ngoài qua `window.__aiBridge`:
- `listVillagers()` — danh sách dân làng
- `getPerception(name)` — nhận thức trung thực của 1 dân làng
- `postAction(name, action)` — ra lệnh động từ
- `postIntent(name, text)` — ra lệnh bằng lời thường
- `setBrainControlled(name, enabled)` — AI tiếp quản (tắt lịch scripted)
- `assignWork(name, job, priority)` / `getWork(name)` — phân công việc
- `getEvents(since)` — dòng sự kiện thế giới
- `getDreams(name)` / `getCapabilityGaps()` — những điều dân làng "muốn mà game chưa làm được"

## 5. Quyết định thiết kế đã chốt

1. **Thought/mood → để AI brain lo.** Không xây hệ tư tưởng/cảm xúc scripted.
2. **Combat người-vs-người → để AI brain lo.** Hiện tại xung đột đến từ thú dữ; đánh nhau giữa dân làng chỉ dừng ở ẩu đả, không giết.
3. **Mọi hệ thống phải đúng thời kỳ** (làng trung cổ): không điện, không công nghệ hiện đại, không phẫu thuật hiện đại — y tế là thảo dược, nẹp gỗ, nghỉ ngơi.
4. **Nhận thức trung thực:** dân làng không bao giờ biết số liệu "nhìn từ trên xuống".
5. **Động từ mới thật:** khi cần hành động mới, viết động từ/cơ chế mới — không ép vào động từ gần giống.
6. **Không thay art AI bằng hình vẽ procedural** (quy tắc từ Character Asset Compiler).
7. **Mô hình nhu cầu (canonical, theo code):** `brain/utility.js` tính **6 deficit có tên** — `satiety` (đói), `hydration` (khát), `fatigue` (mệt), `injury` (thương tích), `cold` (lạnh), `social` (giao tiếp) — cộng risk modifiers (đe dọa, lửa, thú dữ). Mô phỏng cơ thể theo dõi 7 trạng thái sinh lý: đói/khát/mệt/thân nhiệt/oxy/máu/bệnh. **Không có danh sách "8 needs" chính thức nào trong code** — con số 8 trong `WORK_LOG.md` chỉ là số ca chết vì nhu cầu trong một đợt test cũ.

## 6. Trạng thái kiểm thử

- `node --check` trên JS của trang: **PASS**
- Harness `?test` chạy dưới Node (giả lập DOM): **263 dòng, 0 FAIL** — bao phủ PART 12–27 (y tế, cứu hộ, sói săn, XP kỹ năng, vật liệu xây dựng, giữ ấm quần áo, hạng bữa ăn, thuần hoá, caravan, đánh nhau, dập lửa, attention/expectation, sinh thái mùa vụ, survival guard, scarcity pricing, reputation/gossip)
- Logic game Tier-3 (thay đổi gameplay/shared framework) đều qua **Examiner audit độc lập** (tự chạy code, PASS/FAIL có bằng chứng file:dòng) trước khi commit — áp dụng cho mọi sub-phase 6A→6D
- Trong lúc test phát hiện và sửa bug thật: dân làng đang làm việc không đi dập lửa; dân gãy chân không được băng bó; rescue kẹt đường đi; survival guard không kích hoạt khi dân làng đang làm việc (test cũ chặn production path).
- **Chưa chạy `?test` trên trình duyệt thật** — cần chủ dự án mở `willowbrook_natura.html?test` một lần.

## 7. Trạng thái git

- Repo: `https://github.com/punnycroz-cmd/realWorld.git`, HEAD tại commit `05caf95` — `feat: Phase 6D 'Con nguoi khong hoan hao' — Examiner PASS` (2026-09-16)
- Mọi phase 6A→6D đã commit riêng, đầy đủ. **Chưa push** — đang chờ chủ dự án xác nhận (cần token một lần mới nếu muốn push có xác thực)

## 8. Backlog "xem xét sau" (so với RimWorld)

Chi tiết tại `RIMWORLD_GAPS_BACKLOG.md`. Tóm tắt:
- **10 món còn thiếu** (làm được, không cần AI): bản đồ thế giới + faction, storyteller điều tiết drama, y tế sâu (cắt cụt, chân tay giả gỗ), nấu bia/rượu, vũ khí + giáp (cung/giáo/kiếm), khái niệm phòng + nhiệt độ trong nhà, huấn luyện thú, kho bãi zone/stockpile/bills, độ phì nhiêu đất, kịch bản khởi đầu/thắng-thua.
- **4 món ưu tiên khi quay lại:** nấu bia, chân tay giả gỗ, cung tên + giáp, nhiệt độ/phòng trong nhà.
- **Cố ý không làm:** điện, cây công nghệ, ideology, tàu vũ trụ.
- **Để AI brain:** thought/mood, combat người, tù binh, nội dung hội thoại.

## 9. Các dự án liên quan (ngắn gọn)

- **Natura v9** (`natura-v9.html`, `build_v9.py`): mô phỏng gốc với AI brain (Ask API + Hebbian memory). **Đang DỪNG theo lệnh** — không khởi động lại khi chưa được yêu cầu.
- **Willowbrook gốc** (`village-game/`, `willowbrook/`): game làng trình duyệt đã giao 2026-09-10, không đụng tới.
- **Character Asset Compiler v2**: 516 combo nhân vật đã biên dịch, atlas hoàn chỉnh.
- **Game làng cozy** (goal_ab08dcecaf15): dự án game nông trại Stardew-like với NPC chạy AI — mục tiêu dài hạn riêng.

## 10. Việc tiếp theo

1. Chủ dự án mở `willowbrook_natura.html?test` trên trình duyệt thật một lần.
2. Quyết định push Phase 6 (cần token một lần mới).
3. Spec Phase 6E (feeling substrate / 12 qualities / hearing / stress residue — đã chốt thiết kế 1B/Beta/3B) — chờ chủ dự án cho viết spec.
