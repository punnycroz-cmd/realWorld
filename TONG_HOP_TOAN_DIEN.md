# WILLOWBROOK NATURA — Hồ sơ toàn diện
_Ngày biên soạn: 2026-09-16. Trạng thái: đang phát triển Phase 6 ("Con người không hoàn hảo")._
_Nguồn: SPEC_BUILD_PLAN.md, SPEC_PHASE6.md, docs/thinking-process.md, WORK_LOG.md, src/MANIFEST.md, GAME_DESCRIPTION.md, PROJECT_SUMMARY.md, RIMWORLD_GAPS_BACKLOG.md + đối chiếu code trong `src/`. Chỗ nào chưa xác minh được ghi rõ "chưa xác minh"._

---

## 1. Tổng quan

**Willowbrook Natura** là game mô phỏng cuộc sống một ngôi làng thời trung cổ, chạy hoàn toàn trong trình duyệt: **1 file HTML duy nhất (`willowbrook_natura.html`), không server, không mạng, mở được từ `file://`**. Người chơi không điều khiển một nhân vật chính mà **chứng kiến và dẫn dắt cả cộng đồng**: dân làng sống, làm việc, yêu, cãi vã, ốm đau, già đi, chết — cả khi không ai nhìn.

Điểm khác biệt cốt lõi so với game làng thông thường: mỗi dân làng có **cơ thể sống mô phỏng thật** (đói/khát/mệt/nhiệt/oxy/máu/bệnh tuân quy luật sinh học, không phải thanh máu trừu tượng) và **kiến trúc nhận thức phân tầng** (world state → perception → belief/memory → decision → action → consequence), tách triệt để REALITY / PERCEPTION / MEMORY / KNOWLEDGE / BELIEF / CLAIM / EVIDENCE / UNCERTAINTY / CONTEXT. Toàn bộ AI hiện tại là **deterministic** (không gọi LLM trong game); AI Brain bằng LLM là phần cắm ngoài sau này qua `window.__aiBridge`.

**Gốc gác:** kết hợp "Willowbrook" (game làng web có sẵn: pixel-art, 8 dân làng điều khiển được, lịch sinh hoạt, kinh tế) với triết lý "Natura" (mô phỏng cơ thể sống, thế giới phản ứng thật, chết là chết thật). Bản Natura gốc (v9, có AI brain qua Ask API) **đang DỪNG theo lệnh user** — không khởi động lại khi chưa được yêu cầu.

**Stack kỹ thuật:**
- Source viết bằng **plain JavaScript** (không framework, không ES modules ở output), chia module trong `src/` (59 modules: `sim/`, `entities/`, `systems/`, `brain/`, `render/`, `ui/`, `data/`, `tests/`).
- Build: `python3 scripts/build_willowbrook_natura.py` nối các module **theo đúng thứ tự `src/_order.txt`** thành 1 khối `<script>` trong `willowbrook_natura.html`. Mọi module chung một script scope → cấm khai báo trùng tên top-level.
- Art: pixel-art procedural + AI raster (theo directive hiện hành: **không thay art AI raster bằng procedural**).
- Test: `node devtools/node_harness.js` (chạy từ project root) + mở `willowbrook_natura.html?test` trên trình duyệt.

**Cách chơi (tóm tắt):** sandbox, không màn thắng cố định. Người chơi quan sát, bấm vào từng dân làng xem cơ thể/kỹ năng/quan hệ/ký ức (Pawn Inspector), ra lệnh trực tiếp hoặc gõ ý định bằng lời thường ("đi đốn củi cho mùa đông"), phân công lao động theo năng khiếu, quyết sách trồng trọt/xây dựng/buôn bán/dự trữ mùa đông, can thiệp lúc nguy cấp (cháy, sói, người bị thương). Thua = làng lụi tàn; thắng = tự định nghĩa.

---

## 2. Tính năng chi tiết theo hệ thống

### 2.1. Cơ thể sống & nhu cầu (entities/02_body.js)
Mỗi dân làng có body mô phỏng: **satiety (no), hydration (nước), fatigue (mệt), coreTemp (thân nhiệt), oxygen (oxy), blood (máu), injury, hygiene (vệ sinh, 0..1, khởi đầu 0.95)**. Utility AI chấm điểm trên các deficit: đói/khát/mệt/vết thương/lạnh/xã hội (+ hygiene qua nhu cầu tắm rửa, safety qua risk modifiers).
- Ngưỡng sinh tử trong `survivalGuard` (`sim/12a_events.js:123`): `fatigue ≥ 0.999` → ngủ (time-to-death 14h); `hydration ≤ 0.02` → uống (20h); `satiety ≤ 0.02` → ăn (30h). Mức báo động thường: khát `hydration < 0.12`, đói `satiety < 0.10`, mệt `fatigue > 0.96`, lạnh `coreTemp < 35.0`, nóng `coreTemp > 39.5`, đuối nước (`drown_panic` + `oxygen < 0.3`).
- Hậu quả thật: đói lâu → kiệt sức → chết đói; khát → choáng → chết; mệt quá → gục bất tỉnh; rét → run → tê cóng → chết cóng; nóng → say nắng → sốc nhiệt; chảy máu nhiều → chết; ướt + lạnh lâu → cảm sốt; thịt sống 35% đau bụng; đồ ôi → ngộ độc.

### 2.2. survivalGuard — bản năng sinh tồn
Chạy mỗi tick, **ngắt mọi kế hoạch** khi nhu cầu chạm ngưỡng nguy hiểm để cứu mình trước (ăn/uống/ngủ/trốn). Triage theo **time-to-death** (kiệt 14h / khát 20h / đói 30h — mối nguy gần cái chết nhất xử lý trước, fix bug #34). Khi nguồn chính thất bại (vd quán hết bánh) → fallback forage tự nhiên (fix bug #28 death spiral). Player pawn (Marta, `isNPC:false`) cũng được guard trước khi xử lý input người chơi (fix bug #18). Guard không ngắt action loại emergency/survival đang chạy.

### 2.3. Nhận thức trung thực — honest perception (brain/12b_perception.js)
Dân làng chỉ "biết" những gì giác quan cho phép: khoảng cách bằng lời ("cách vài mét"), phương hướng, cảm nhận thời tiết/cơ thể, tầm nhìn giảm ban đêm/mưa bão. **Không lộ tọa độ chính xác, nhiệt độ chính xác, chỉ số sinh học.** Phase 6A bổ sung **bộ lọc attention 3 cổng**: (1) cảm giác đột biến — lửa mất kiểm soát/tiếng thét/sói-gấu **hostile** → preemptive interrupt; (2) need >75% → tunnel vision, lọc vật không giải quyết cơn đói/khát; (3) mục tiêu hiện tại — chỉ thứ liên quan việc đang làm mới vào interpretation/memory, còn lại là nhiễu nền. Contract `__aiBridge.getPerception` giữ nguyên.

### 2.4. Utility AI + intent planner (brain/utility.js, brain/13a_intent.js)
Thay routine cứng: mỗi tick, dân làng liệt kê **candidate actions** từ tập động từ (eat, drink, sleep, work, cook, craft/recipe, clean, socialize, flee, douse, trade, warm, rest, leisure...) và chấm điểm đa nhân tố:
- 8 need deficits + personality weights (industrious/lazy/sociable/cautious/brave/gluttonous) + distance/proximity cost + risk modifiers (thú gần +120 flee, lửa +80 douse/flee, ban đêm) + opportunity bonuses (caravan +55 trade, bữa ở inn +18, bánh mới +18, lúa chín +20).
- Tie-break deterministic bằng **FNV-1a seeded hash (`hashString18`)** — zero `Math.random()`.
- Chuỗi thất bại trung thực: **FAILURE → OBSERVATION (thought ghi lý do) → INTERPRETATION → NEW KNOWLEDGE (blacklist `v.unreachable` có cooldown) → RE-EVALUATION → NEW ACTION** — không bao giờ bỏ action im lặng.
- Không biết thức ăn ở đâu → sinh candidate `explore_food` (đi forage) thay vì pathing tới đống đồ toàn tri (chống omniscience, fix từ 2D).
- **Intent planner:** `postIntent(name, text)` biến lời thường ("stoke the fire", "bury the dead") thành kế hoạch thật. Ý định không hiểu → lưu vào `v.dreams`; lặp lại 3 lần → ghi "capability gap" toàn cục cho AI brain sau này đọc.

### 2.5. Knowledge / Belief / Memory — epistemic store (brain/knowledge.js)
Mỗi villager có `v.epistemic = { memories, beliefs, ownership, ... }`:
- Memory entry: `{ id, kind (observation/taught/belief/claim), topic, content, who, where, when, confidence 0..1, salience 0..1, evidence[], source (direct 0.95 / remembered 0.65 / hearsay 0.45 / claim 0.30), superseded, supersededBy }`.
- **Quên phai theo sim-time** với 3 preset tính cách: sharp (0.4x), average (1.0x), forgetful (2.5x); salience cao tồn tại lâu hơn; prune khi confidence < 0.05; cap 120 memories (dedupeWindowH 6h chống spam).
- **Niềm tin có thể sai/lỗi thời/mâu thuẫn**, lưu song song với world truth; quan sát mới **supersede** niềm tin cũ và **giữ vết lịch sử** (deep-clone evidence chống aliasing — fix bug #10/#11).
- **Dạy học** (`teach` verb): cần gần nhau (≤4 ô) + cả hai tỉnh táo; học trò nhận knowledge hearsay với 0.75x confidence của thầy; trẻ con/em được +15% learning bonus.
- **Tuyên bố** (`claim` verb): claim không bao giờ đổi world truth; người xung quanh chứng kiến → ghi hearsay memory.

### 2.6. Ownership 4 lớp + provenance + material lineage (systems/21a_ownership.js)
- **IDENTITY BOUNDARY:** vật phẩm chế tạo quan trọng (plank, furniture) có **stable id** (Chair #104: creator, quality, condition, material parentIds, tree lineage roots, full event history) + count mirror trong inventory; hàng bulk (lương thực, gỗ, lúa) giữ count-based.
- **4 lớp ownership:** `actualOwner` (world truth — chỉ transfer hợp lệ mới đổi) / `currentHolder` (ai đang cầm) / `knownOwner`+`suspectedOwner`+confidence+evidence+claims **theo từng nhân vật**. `actualOwner` không bao giờ broadcast — bridge viewer-scoped chỉ trả belief-level.
- **Transfer engine** (`recordTransfer`): gift/sell/buy/inherit → đổi holder+owner; **steal → chỉ đổi holder** (chủ vẫn là nạn nhân); borrow → holder + `expectedReturnH`; return/lose/find/abandon → giữ owner. Mọi transfer append vào history của vật + world transfer log; participants/witnesses hình thành beliefs/memories qua 2D APIs.
- **Material lineage:** `getLineage(itemId)` → Chair #104 → Plank #77 → Tree #883 (stable tree ids, `ensureTreeId`/`recordFelledTree`).
- **Tranh chấp:** claim mâu thuẫn → dispute; `resolveDispute` deterministic theo thang chứng cứ (creation/direct observation > witnessed transaction/possession history > hearsay > bare claim); trưởng làng (Alden) xử, **không được xử vụ của chính mình**; claimant thứ ba được tham gia; claim sau xử → dispute mới (không viết lại lịch sử); mediation chỉ ra lệnh POSSESSION, không viết lại actualOwner.
- Verbs: `steal` (có nhân chứng tỉnh ≤12 ô → bị bắt quả tang, đồ ở yên + beliefs/memories/bonds; không ai thấy → holder đổi lén), `borrow` (cần mutual bond ≥0.2, từ chối trung thực), `giveback`, `mediate`.

### 2.7. Recipe data-driven + provenance (data/recipes.js, systems/16a_recipes.js)
`RECIPE_TABLE`: fell_tree → plank → furniture; harvest_crop → flour → bread; (mở rộng: lanh→vải→quần áo, thịt→hun khói...). Executor `doRecipeStep` kiểm tra inputs/tools/skill/workstation; mọi output có provenance (người tạo, nguyên liệu, chất lượng, tình trạng, chủ, thời gian, lịch sử dùng). Provenance **đi theo vật phẩm** qua mọi đường chuyển tay (villager→pile→villager) qua `p.prov`; `stripItemProvenance` dọn ghost records mỗi khi inventory giảm (drop/eat/burn/sell/craft/mend/build/cook/preserve/feed/recipe-inputs). Workstation không tới được → thought "Can't reach the X" + giữ nguyên inputs (không nuốt im lặng).

### 2.8. Building là entity (systems/17a_buildings.js)
Nhà = entity đầy đủ: `indoorTemp` (lửa sưởi ấm → 22–24°C, mùa đông hạ), `cleanliness` 0..1 (giảm theo người ở/nấu ăn/thú, bỏ hoang ≥3 ngày decay nhanh), `capacity` + phạt overcrowding, `owner`, `residents`, `hasFire`. Verbs: `expand` (6 logs + 4 đá → +2 capacity), `clean`, `demolish` (thu hồi 50% vật liệu), `repair`. Công trình chức năng: **barn** (nhốt thú), **workshop** (bàn thợ cho recipes), **kitchen** (bếp lửa nấu ăn), **inn** (Sleepy Stag Inn — phòng trọ + bán bữa ăn, Tobin phục vụ). Sông deterministic: uống/câu cá/tắm từ bờ hoặc cầu (`nearWater3`), cầu tự kéo dài tới đất cao.

### 2.9. Kinh tế: vàng, shop Sella, caravan (systems/13b_economy.js, 15c_caravan.js)
- **Vàng riêng từng người**; shop của Sella mua bán lương thực/vật liệu hằng ngày; inn của Tobin bán bữa ăn + phòng trọ; sạp chợ (market stall) cho commerce trong làng.
- **Caravan lữ hành:** mỗi mùa 1 đoàn (1 spice trader + 2 lính gác) dựng trại ~nửa ngày–1 ngày: bán **muối, vải vóc, gia vị, dụng cụ sắt** (thứ làng không tự làm được), thu mua da thú/thịt hun khói/trứng/nông sản. Lính gác xua sói → đêm caravan ở lại là đêm yên bình.
- Phase 6D sẽ nâng cấp: **scarcity pricing** (giá = sàn × (1+scarcity) × seasonMult, scarcity = 1 − stock/weeklyConsumption), caravan **demand-responsive thật** (ghi sold-out → chuyến sau mang nhiều hơn).

### 2.10. Đời sống xã hội 2 mặt (systems/12d_social.js, 15d_friction.js, 20_social_life.js)
- **Mặt sáng:** nói chuyện trong tầm nghe → bond tăng; làm việc cùng, hoạn nạn cùng → thân thiết; visit (+0.05 bond), chơi đùa (trẻ con), sinh hoạt (tắm `bathe` phục hồi hygiene 1.0, dọn dẹp).
- **Mặt tối:** `insult` (−0.12 bond + insult memory) → hiềm khích tích lũy + bond thấp → **thù địch** (không cứu/không băng bó cho nhau) → **đánh nhau bằng tay** gây thương tích thật nhưng **dừng ở gục, không bao giờ giết**; người ngoài can ngăn; xin lỗi qua `speak` → làm lành; hiềm khích phai ~5%/ngày; bond phai ~0.01/ngày sau 3 ngày không tiếp xúc.
- Ký ức xã hội: ai cứu mình / ai đánh mình / nơi nào nguy hiểm đều được nhớ.

### 2.11. Life stages, hôn nhân, household, sinh đẻ (systems/20_social_life.js, entities/12d_pregnancy.js, data/03_roster.js)
- 4 stages: **child (0–12)** — mang tối đa 6 đồ (adult 20), cấm việc nặng (fell/construct/demolish...), học nhanh hơn; **youth (13–17)**; **adult (18–59)**; **elder (60+)** — đi 0.75x, mệt nhanh 1.35x, đốt calo 0.85x, cấm việc nặng nhất.
- **Hôn nhân:** 2 adults tỉnh táo + bond ≥ 0.7 + cách nhau ≤ 4 ô + chưa cưới → `spouseId` 2 chiều, wedding memories (salience 1.0) + witness beliefs; chết → xóa `spouseId` sạch (không dangling).
- **Household** là entity: nhà chung, thành viên, `sharedInventory`, food preference chung (+0.15 vào utility).
- **Sinh đẻ:** chỉ vợ chồng + adult + tỉnh táo + không starving; thai **20 ngày**, cooldown 30 ngày sau sinh; mọi RNG seeded (`hashString18`) — zero `Math.random()`; `birthChild` dùng factory `createVillager` chuẩn, ghi parentage (`motherId`/`fatherId`), household, birth memories cho cha mẹ + nhân chứng.

### 2.12. Thú hoang (entities/14c_wildlife.js)
States: `wander / stalk / attack / flee / fight / eat`. **Sói** đi bầy săn đêm — sợ lửa/đuốc/đám đông/người can đảm; **lợn rừng** hiền thì thôi, lại gần thì húc; **gấu** hiếm nhưng cực nguy, mò theo mùi thức ăn. Dân làng thấy sói hostile → chạy vào nhà; bị dồn → đánh trả bằng dụng cụ + hô hoán gọi cứu. `hunt` → xẻ thịt → thịt + da. Cân bằng Phase 4: sói atkCd 0.55h, cap 3 con/đêm, spawn 0.22, cắn 1–2 phát no 0.35 rồi rút. Phase 6B bổ sung sói 2 trạng thái: bình thường sợ lửa; **đói cực độ vượt qua nỗi sợ**.

### 2.13. Thời tiết, lửa, chữa cháy (sim/12d_world.js, systems/15e_firefight.js)
Vòng ngày/đêm, 4 mùa (đông: ruộng chết, hồ đóng băng, sói liều; hè: say nắng, thịt ôi 1.6x, sấm sét), thời tiết nắng/mây/mưa/bão/sét. Sét đánh → thương vong + cháy; cháy rừng lan theo gió/độ khô; mưa dập lửa nhỏ nhưng làm ướt quần áo (mất giữ ấm). Dân làng **tự dập lửa** (`douse`): xách nước từ giếng/hồ, ưu tiên **nhà → người → ruộng → rừng xa**; lửa sát người vẫn bỏ chạy trước; hít khói dày → ngạt. Phase 6B bổ sung chuỗi nhân quả weather→dryness→fire (dryDays counter, fuel theo terrain, gió) — steal từ bản GLM.

### 2.14. Y tế trung cổ + downed/rescue (systems/14a_medical.js, 14b_rescue.js)
Không bệnh viện/kháng sinh. Vết thương chi tiết từng vị trí (tay/chân/thân/đầu) + mức độ + chảy máu; **máu là tài nguyên thật** — mất nhiều chết được; vết hở không băng → nhiễm trùng → sốt → chết. Chế được: **thuốc đắp thảo dược** (cầm máu, chống nhiễm trùng), **nẹp gỗ + vải** (gãy xương — gãy chân chỉ bò được, cần nẹp + ăn đủ + nghỉ nhiều ngày), **trà hạ sốt**. Verb `tend` (băng bó theo tay nghề y thuật). **Downed:** bất tỉnh/chảy máu/gãy chân → `rescue` vác về giường (đi 0.45x); người thân tự cứu khi an toàn. Predicate `isActivelyBleeding` chống loop ngất-tỉnh xóa plan (fix bug #32).

### 2.15. Kỹ năng, XP, phân công (systems/14d_skills.js)
8 skills 0–10: trồng trọt, nấu ăn, xây dựng, y thuật, săn bắn, câu cá, hái lượm, may vá. XP từ **làm việc thật**; mỗi người có **năng khiếu đúng vai** (Wren giỏi thuốc, Finn giỏi câu cá). Level ảnh hưởng tốc độ/năng suất/chất lượng. Làm đủ 10 productive actions một nghề → **occupation** (+25% hiệu suất, đã đo được fishing ratio = 1.25 — fix bug #13 dead code). `assignWork(name, job, priority)` cho player/AI phân công.

### 2.16. Xây dựng & quần áo (systems/14e_construction.js)
Xây tốn **vật liệu thật** (gỗ đốn cây, đá đập mỏ, rơm); thợ non xây chậm + độ bền thấp; công trình có độ bền riêng, bão/lửa/sói phá → `repair`. Quần áo nhiều lớp (áo trong/áo ngoài/giày/áo choàng đông): tác dụng duy nhất nhưng sống còn là **giữ ấm**; ướt mất phần lớn tác dụng (PROJECT_SUMMARY ghi 60%, GAME_DESCRIPTION ghi "mất hết" — chưa thống nhất, xem mục 8.3); mặc lâu rách → `mend` vá hoặc may mới từ vải (mua caravan) / da thú.

### 2.17. Ăn uống 3 hạng + bảo quản (systems/15a_food.js)
3 hạng bữa ăn (dở/ngon/thịnh soạn) theo tay nghề + độ đa dạng nguyên liệu — ăn ngon no lâu. **Thịt sống 35% đau bụng**; đồ ôi theo ngày (trời nóng 1.6x); ngộ độc từ đồ ôi/nấu ẩu. `preserve`: **ướp muối / hun khói** để thịt được hàng chục ngày — chìa khóa sống qua mùa đông.

### 2.18. Chăn nuôi (entities/15b_husbandry.js)
`tame` thuần hóa **gà và lợn con** bằng thức ăn (theo kỹ năng; lợn lớn không thuần được); nhốt chuồng có rào (sói không vào) + cho ăn đều → gà đẻ trứng nhiều, lợn đẻ lứa; **bỏ đói → ốm → bỏ đi hoang**. Săn bắn → thịt + da (da may quần áo, bán caravan).

### 2.19. Save/load (sim/22a_save.js)
Versioned save/load **toàn bộ sim state thật**: clock/weather, chunks, full villager records (body/needs/skills/bonds/inventory/plans/pregnancy/wounds/memories/epistemic/thoughts/why-trace), item registry + id counters, transfer log, piles/fires/crops/chickens/wildlife/livestock, caravan/shop/inn, households, event log, UI indices, **RNGS.s** (seeded RNG stream → tiếp tục bit-identical). Autosave mỗi ngày sim + slot thủ công (localStorage, fallback in-memory). **Atomic**: validate trên bản tạm, hợp lệ mới ghi đè; version/JSON/shape sai → từ chối không mutate world; chặn `__proto__` smuggling 2 lớp; giới hạn độ sâu payload.

### 2.20. Why-inspector (brain/22b_why.js)
Wrap (không thay) `evaluateVillagerUtility`, ghi **decision trace** mới nhất mỗi villager: winner, top-6 candidates + scores, need deficits + personality + night flag, per-candidate distance. `__aiBridge.explainAction(name)` → plan + decision + beliefs đã dùng (belief-scoped, không actualOwner) + thought thất bại gần nhất. Panel "🧠 Why this action?" trong Pawn Inspector.

### 2.21. Debug overlays (render/22c_overlays.js)
5 overlays độc lập, **tắt mặc định** (không tốn draw khi tắt): needs bars, ownership labels (belief-scoped), belief-confidence view, building/farm zones, event feed. Nút 🛠 Debug + panel checkbox.

### 2.22. __aiBridge — cửa cho AI brain tương lai (brain/09_bridge.js)
`listVillagers, getPerception, postAction, postIntent, setBrainControlled, assignWork/getWork, getEvents, getDreams, getCapabilityGaps, getBeliefs, getMemories, getOwnershipBeliefs, observe, teach, claim, explainAction, saveGame/loadGame/worldHash/hasSave, debugOverlays, getLifeStage, getHousehold, getRelationships, getOccupation`. Mọi getter **viewer-scoped**: AI chỉ nhận beliefs của nhân vật đó, không bao giờ world truth (fix bug #20/#21).

---

## 3. Kiến trúc & kỷ luật kỹ thuật

**Cấu trúc `src/` (59 modules):** `sim/` (world/time/space: core, settlement, navigation, mainloop, boot, events+mortality+survivalGuard, parity, world, save) · `entities/` (body, pregnancy, wildlife, husbandry) · `systems/` (actions, social, illness, economy, butcher, medical, rescue, skills, construction, wiring×2, food, caravan, friction, firefight, recipes, buildings, social_life, ownership) · `brain/` (ai, bridge, perception, intent, why, knowledge, utility) · `data/` (roster, recipes) · `render/` (pipeline, overlays×2) · `ui/` (hud, controls) · `tests/` (13 part-files: 12d, 13–24).

**Build pipeline:** `scripts/build_willowbrook_natura.py` nối modules theo `src/_order.txt` thành 1 khối `<script>` trong `willowbrook_natura.html`. Không ES modules ở output → `file://` an toàn (không fetch/XHR/http refs — Warren đã verify). **Cấm hand-edit HTML** — chỉ sửa `src/` rồi rebuild. Module sau **wrap** (không thay) hàm module trước (`const __base = fn; …`); `_order.txt` là ordering contract duy nhất; 0 duplicate top-level declarations (scan tự động).

**Determinism:** `RNGS` Mulberry32 seeded (`RNGS.s`), serialize trong save → tiếp tục bit-identical. **`Math.random` cấm trong gameplay** — chỉ render (lửa nhấp nháy) và comments; mọi gameplay RNG qua seeded streams; tie-break bằng FNV-1a `hashString18`. Test determinism: cùng seed → cùng lựa chọn.

**Test harness:** `node devtools/node_harness.js` (chạy từ project root) — chạy toàn bộ part-tests, đếm FAIL lines; mỗi tính năng mới cần **discriminating test** (fail trên code cũ theo construction). Quy tắc test live-world: wrap snippet trong `(function(){...})()`, duy trì survival needs trong cùng evaluate, dọn test villagers sau mỗi test, không `simTick(24)` thô.

**Bằng chứng cân bằng dài hạn (Phase 4):** 30-day deterministic run: 11 → 8 sống, 3 births, 6 deaths — **tất cả 6 ca chết đều chảy máu sau thú tấn công, 0 chết đói/khát/kiệt sau ngày 3**. Examiner PASS.

---

## 4. Lịch sử lỗi & cách sửa (35 bug theo phase)

*Mẫu số chung: hầu hết defect nghiêm trọng KHÔNG bị test suite của Robin bắt được (suite xanh nhưng Examiner probe độc lập vẫn tìm ra). → Quy trình Tier-3 bắt buộc: Examiner audit đối kháng, không tin worker tự báo xanh.*

### Phase 1 — Modular hóa
| # | Triệu chứng | Nguyên nhân | Cách fix | Bài học |
|---|---|---|---|---|
| 1 | Test lửa flaky: người dập lửa kẹt ngoài tường chuồng | Va chạm coi chân tường là cản tuyệt đối | Test deterministic: seed cố định, setup kiểm soát được | Ngoài đời người ta tạt xô từ 2–3m, không áp sát tâm cháy |
| 2 | Trùng khai báo `paBlob` khi gộp renderer | Gộp file thủ công | Xóa trùng, giữ 1 bản | Đóng gói primitives vào namespace cô lập |
| 3 | Đếm baseline sai 140 vs 70 | Đếm lặp 2 vòng log | Chuẩn hóa: 70 checks, 10/10 runs xanh mới accept | Harness bóc tách suite/case/assertion rõ ràng |

### Phase 2A — Recipe + provenance
| # | Triệu chứng | Nguyên nhân | Cách fix | Bài học |
|---|---|---|---|---|
| 4 | Provenance mất khi villager→pile→villager; ghost records | `doDropStep` không ghi provenance xuống pile; `v.itemProv` giữ bản ghi ma | Helper `strip/add/movePileProvenance`; `p.prov` mirror `p.items`; dọn ghost mỗi lần inventory giảm | Lý lịch vật phải đi theo vật, không theo người |
| 5 | Workstation không tới được → hủy im lặng, inputs biến mất | Không có failure feedback | Thought "Can't reach the X" + giữ nguyên inputs | Chuỗi failure→observation→knowledge, không nuốt im lặng |

### Phase 2B — Building entities
| # | Triệu chứng | Nguyên nhân | Cách fix | Bài học |
|---|---|---|---|---|
| 6 | Sông nhấn chìm bờ đông; cầu cụt giữa nước sâu | `getRiverCenter` làm trũng cả bờ | Hành lang đất khô 2 bên; cầu tự kéo dài tới đất cao | Dân trung cổ không dựng cầu đâm xuống nước xiết |
| 7 | Uống/câu cá phải lội cả người xuống nước | `doDrinkStep`/`doFishStep` đòi `depth > 0` | `nearWater3(v)`: tương tác từ bờ/cầu/giếng | Người ta cúi từ bờ, không nhảy xuống sông lạnh để uống nước |
| 8 | "demolish the old hut" → phá nhầm quán trọ Sleepy Stag Inn | Fallback phá công trình gần nhất khi không tìm thấy tên | Tên riêng không thấy → no-target + fail trung thực; fallback chỉ cho 'home'/'nearest' | Không thợ tỉnh táo nào đập quán rượu vì không tìm thấy cái chòi |

### Phase 2C — Utility AI
| # | Triệu chứng | Nguyên nhân | Cách fix | Bài học |
|---|---|---|---|---|
| 9 | Mỗi tick re-trigger failure cũ → blacklist vĩnh viễn đống lửa/giường hợp lệ, churn plan | `handleActionFailure` quét mảng `thoughts` cũ | Chụp identity mảng thoughts trước tick; chỉ xử lý khi bị replace trong tick hiện tại (+ regression test 18.13) | Vấp 1 lần ở cửa không khiến người ta né cửa đó cả đời |

### Phase 2D — Knowledge/Belief/Memory
| # | Triệu chứng | Nguyên nhân | Cách fix | Bài học |
|---|---|---|---|---|
| 10 | Thông tin mới về độ bền/giá ghi đè âm thầm, mất lịch sử niềm tin | `isContentConflicting` chỉ so 5 key cứng | Mọi key chung đổi giá trị → supersede + giữ history | Con người nhớ mình từng nghĩ đồ còn nguyên trước khi thấy nó vỡ |
| 11 | Bằng chứng hôm nay đột biến luôn ký ức quá khứ | Shallow copy mảng evidence | Deep-clone evidence+content khi đóng băng vào `v.epistemic` | Bằng chứng hôm nay không chui ngược vào nhật ký tuần trước |

### Phase 2E — Social life (Examiner FAIL lần 1, 6 defects)
| # | Triệu chứng | Nguyên nhân | Cách fix | Bài học |
|---|---|---|---|---|
| 12 | `doChildcareStep` tăng độ no của trẻ mà không trừ kho → **đồ ăn từ hư không** | Không lookup/decrement store | Bắt buộc lấy từ túi/kho gia đình; hết → fail trung thực | Nuôi trẻ là gánh nặng lương thực lớn nhất của mái nhà — "pháp thuật" bị cấm tuyệt đối (tiền thân Nguyên tắc 4) |
| 13 | `calcOccupationBonus` (+25%) là dead code | Không hệ thống nào gọi | Nối vào executors thật; đo được fishing ratio = 1.25 | Danh hiệu không tác động = rác (bài học được dùng lại ở Phase 6C identity) |
| 14 | Chưa cưới vẫn thụ thai (fallback nam gần nhất bond>0.7) | Logic fallback bừa | Chỉ vợ chồng + adult/tỉnh/không starving | Làng trung cổ dưới mắt giáo xứ không có chuyện chửa bừa |
| 15 | `Math.random()` trong pregnancy; già/bệnh vẫn thụ thai | Unseeded RNG + thiếu gate | Seeded `hashString18` + chặn tuổi/mãn kinh/suy dinh dưỡng/liệt giường | Cơ thể tự đình chỉ rụng trứng khi suy dinh dưỡng nặng |
| 16 | `marry` thất bại → lệnh biến mất im lặng | Không failure path | Thought giải thích + cảm xúc tiêu cực + giảm bond | Bị từ chối hôn nhân là cú sốc — không ai thản nhiên đi bửa củi |
| 17 | `{verb:'go', person}` → villager ở **(NaN, NaN)** rồi chết khát | Không resolve person→coords | Resolve trước khi đi; reject non-finite | Lỗi toán học không được phân rã cơ thể vào hư không |
| 18 | Marta (player pawn) chết khát cạnh giếng trong headless run | `updatePlayerPawn` không gọi `survivalGuard` | Guard chạy trước input người chơi | Bản năng sinh tồn là vô điều kiện, không chờ "lệnh từ thượng đế" |

### Phase 2F — Ownership (Examiner FAIL lần 1, 2 blocking)
| # | Triệu chứng | Nguyên nhân | Cách fix | Bài học |
|---|---|---|---|---|
| 19 | Nguyên đơn thứ ba mang bằng chứng gốc bị phớt lờ | Dispute đóng băng 2 đương sự lúc mở đơn | Late claimant thành bên đầy đủ; claim mới sau xử → dispute mới | Tòa thôn xử theo sự thật, không theo mảng cố định |
| 20 | `__aiBridge` lộ `actualOwner` cho mọi truy vấn ngoài | `summarizeItem` trả world truth | Getter viewer-scoped: chỉ belief + confidence | Không ai nhìn rìu trong rừng mà biết ngay chủ hợp pháp |
| 21 | Log "ownership stays Y" lộ chủ thật vụ trộm không nhân chứng | Transfer log ghi thẳng tên nạn nhân | Sanitize ở bridge boundary; world history nội bộ giữ nguyên | Nhật ký công khai chỉ ghi cái có người chứng kiến |

### Phase 3 — Save/load (lead implement; Examiner 4 vòng: 3 FAIL → PASS)
| # | Triệu chứng | Nguyên nhân | Cách fix | Bài học |
|---|---|---|---|---|
| 22 | Dân làng đang bị `otherPerson` nhìn → `null` khi save | `WeakSet` chống đệ quy trong clone | Tách transient refs khỏi entity bền vững trước serialize | Ghi sổ bộ không được làm bốc hơi người đang thở |
| 23 | Load xong lệch màu da/tóc | Tự tính lại `_ci` | Lưu/khôi phục nguyên vẹn seed + chỉ số đã bake | Ngủ dậy không ai muốn bị tráo màu tóc |
| 24 | Feed overlay bật độc lập thì chết | Renderer chặn DOM update khi không có canvas overlay | Tách DOM update thành tiến trình độc lập | — |
| 25 | File lỗi nhưng đã xóa world trước khi báo lỗi | Load không atomic | Validate trên bản tạm; hợp lệ mới ghi đè | "Thư lại đốt làng trước khi kiểm tra sổ mới có đọc được không" |
| 26 | `__proto__` smuggling 2 lớp → giả mạo stock/crash | Key shapes không validate | Từ chối `__proto__`/`constructor` ở parser | — |
| 27 | Payload lồng 30k → RangeError | Đệ quy không giới hạn | Giới hạn độ sâu + try/catch tầng tiếp nhận | — |

### Phase 4 — Long-run balance (2 passes)
| # | Triệu chứng | Nguyên nhân | Cách fix | Bài học |
|---|---|---|---|---|
| 28 | Đói → guard ép mua ở inn → inn hết bánh → lặp mua → **chết đói trước quầy rỗng** (11/11 chết pass 1) | Không fallback khi nguồn chính thất bại | Nguồn chính fail → forage tự nhiên | Nông dân thấy quán hết đồ sẽ ra rừng đào củ, không xếp hàng chết đói |
| 29 | Thỏ/hươu/chim cũng trigger flee → cắt ngang survival plan | Mọi animal đều gây hoảng | Chỉ hostile predator mới gây hoảng | Người làm nông không chạy thục mạng vì thỏ gặm cỏ |
| 30 | Bụi berry hái 1 lần biến mất vĩnh viễn | Không regrowth | Giữ gốc bụi, tái sinh 3–4 ngày mùa ấm | Bụi ăn quả là thực vật lâu năm, không phải quặng mỏ |
| 31 | Đang chết khát cũng bỏ cuộc sau 1.5h (drink timeout cứng) | Countdown cứng | Bỏ timeout; chỉ hủy khi nguồn bị phá/bị tấn công | Người chết khát không bỏ cuộc vì "hết 90 phút bấm giờ" |
| 32 | Máu thấp ngất → vết đã cầm máu nên tỉnh ngay → lại ngất → mỗi lần ngất xóa plan (co giật tại chỗ) | Down khi blood<0.38 bất kể vết thương | `isActivelyBleeding`: chỉ down khi vết đang thực sự chảy máu; ngất sâu nhiều giờ | Người mất máu hôn mê li bì, không bật dậy như lò xo |
| 33 | Wall-following coi chính cái giếng-đích là chướng ngại → **quay vòng quanh giếng tới chết khát** | Probe chiếu thẳng tâm đích | Bỏ qua va chạm của vật đích trong tầm tương tác 1–1.5 ô | Muốn múc nước mà thành vệ tinh quanh miệng giếng |
| 34 | Còn 2h chết kiệt sức vẫn bị ép đi uống nước đầu làng xa → gục dọc đường | Triage cứng uống→ăn→ngủ | Triage theo **time-to-death** (kiệt 14h / khát 20h / đói 30h) | Bác sĩ ưu tiên mối nguy gần cái chết nhất, không theo danh mục hành chính |
| 35 | Sói overtuned: 0.4h hồi đòn, 4 con/đêm → thảm sát cả làng | Thông số beast quá cao | atkCd 0.55h, cap 3/đêm, spawn 0.22, cắn 1–2 phát no rồi rút | Sói trung cổ sợ lửa/đuốc/tiếng người; không diệt chủng khu có canh gác |

### Phase 6A — đang implement (Examiner FAIL lần 1, 3 blocking — đang fix attempt 1/2)
| # | Triệu chứng | Nguyên nhân | Hướng fix |
|---|---|---|---|
| A1 | Cổng 1 interrupt **mỗi tick** vì sói hiền và lửa trại → villager đi được 9.56 tiles so với 40 tiles control; plan douse bị wipe | `perceiveSurroundings` tag threat cho MỌI sói/gấu bất kể state, `isFire` cho MỌI lửa; Robin xóa comment cảnh báo Phase 4 | Chỉ hostile state (stalk/attack/hunt/fight) + wildfire mới trigger; douse plan không bị wipe (spec đã được lead cập nhật) |
| A2 | Expectation **không bao giờ hết hạn** | `decayEpistemic` không đụng `v.epistemic.expectations`; không TTL constant | Thêm expiry sweep + discriminating test (learnedTick 10 ngày trước → expired) |
| A3 | API expectation location/presence **dead** (0 caller in-game, chỉ price được nối) | Chưa nối vào gameplay | Lead quyết định: nối `checkStashExpectation` vào take/forage thật (không descope) |

---

## 5. Định hướng

### 5.1. Chín nguyên tắc dẫn đường (từ thinking-process Phần 4 — đọc trước mọi task Phase 6, vi phạm → dừng hỏi user)
1. **Đời thật không hoàn hảo → cấm hoàn hảo hóa** (luật tối cao, quyết định trực tiếp của user). Mỗi đề xuất phải có điểm dừng viết sẵn; không mô phỏng cái gì chỉ vì "cho thật hơn" mà không tạo gameplay/câu chuyện.
2. **Hai ngưỡng, không phải một.** Khuyết tật tâm lý (bướng, sĩ diện, mê tín, hoảng, lười, thói quen) chỉ hiệu lực khi need ở mức vừa (30–70%). Chạm ngưỡng sinh tử (>90%) → bản năng sinh học override tất cả.
3. **Cái chết ngu ngốc phải có logic nội tâm** (niềm tin sai, bướng, hoảng có nguyên nhân). Cấm chết vì RNG thuần túy — người chơi khóc vì bi kịch có nguyên nhân, nhưng chửi game lỗi nếu chết vì roll xúc xắc.
4. **Bảo toàn vật chất tuyệt đối.** Không đồ ăn/vật phẩm từ hư không — kể cả qua cửa sau như "forage tại chỗ không trừ tile". Mọi fallback sinh tồn đều trừ tài nguyên thật.
5. **Villager chứa beliefs, không chứa con trỏ tới sự thật.** Tối đa 3–5 mẩu `[ai/cái gì, thuộc tính, ở đâu, khi nào]`; quyết định chỉ đọc beliefs + senses + memory.
6. **Ngân sách của Thợ cả: rẻ, deterministic, test được.** Ladder ≤ 3 bậc; tin đồn single-hop, enum; trust int −10…+10; mọi RNG seeded.
7. **Habit và lười là bản chất, không phải bug.** Vẫn ra quán quen dù hôm qua hết bánh; thà ăn đồ dự trữ dở còn hơn đi xa — "fix" thành tối ưu hoàn hảo cũng là phi thực tế.
8. **Tin đồn méo mó là tính năng (có giới hạn).** Single-hop, sai lệch dần — đó là cách làng người vận hành; nhưng mỗi villager chỉ giữ vài mẩu tin (chống bùng nổ O(N²)).
9. **Release trước, Phase 6 sau.** Không trộn release đã nghiệm thu với feature mới (giữ "clean tagged source" mà Warren đã sign-off).

### 5.2. Đánh giá chiến lược của Executive Producer (nguyên văn ý chính, 2026-09-16)
- Hiện tại là **"FOUNDATION OF A LIVING WORLD"**, chưa phải "REALISTIC SOCIETY SIMULATOR". Cần cải thiện là **độ đúng của mô hình đời thực**, không phải thêm thật nhiều feature.
- **Ladder chỉ là implementation approximation**, không phải bản chất cognition. Bản chất: goals + beliefs + capabilities + emotions tái đánh giá liên tục (cầu nối tự nhiên tới AI Brain).
- Thiếu **selective attention** (sensation → attention → interpretation → memory), **conflicting motivations** (không phải highest-need-wins), **autobiographical identity** (chừa chỗ kiến trúc), **expectation/prediction error** (surprise → belief update → emotion).
- Kinh tế ưu tiên: **scarcity + price + expectations + ownership + specialization** (đừng thêm tất cả ngay).
- Sinh thái cần **carrying capacity** về lâu dài; xã hội cần **norm/tradition/role/authority/institution** tự hình thành qua pipeline `action → witnessed → remembered → reputation → trust → opportunity` — **đây là nơi Willowbrook có thể vượt khỏi RimWorld**.
- **"Realism ≠ accuracy"**: con số chi tiết (bond +0.05, fatigue 1.35x...) chỉ là model parameters; realism đến từ parameter + relationship + feedback loop + consequence.
- **AI Brain gần cuối, không phải đầu:** "Đừng xây AI Brain để 'làm NPC thông minh'. Hãy xây simulation đủ tốt để một AI Brain có một thế giới thực sự đáng để suy nghĩ trong đó."
- Thứ tự ưu tiên 15 tầng: Physical causality → Human needs/body → Perception → Belief+uncertainty → Memory → Conflicting motivations → Adaptive behavior → Relationships/family → Economy → Knowledge/learning → Social norms/reputation → Institutions/law → Ecology → Generational/cultural evolution → **AI Brain**.

### 5.3. Phase 6 — "Con người không hoàn hảo" (SPEC đã duyệt 2026-09-16, chưa implement xong)
- **6A — Giác quan & Kỳ vọng** (đang làm): attention 3 cổng, Expectation Engine `{subject, attribute, predictedValue, confidence, learnedTick, source}` + SURPRISE rule, stale stash beliefs, brain boundary `observe/think/learn` (chuẩn bị Phase 9).
- **6B — Thích ứng & Sinh thái**: Dynamic Candidate Generation (tối đa 3 candidates, chỉ re-plan khi surprise/interruption), carrying capacity + tile depletion + 4 mùa (đông regen = 0), sói 2 trạng thái, chuỗi weather→dryness→fire.
- **6C — Tâm lý sâu & Căn tính**: **Survival Guard** (guard clauses override tuyệt đối + chống oscillation), conflicting motivations 2 tầng + suppression stress + emotion tags, emotion derivation layer, body-factor chain (vết thương → infection → giảm work/speed), identity tự kết tinh (3–5 tags, không config tay, phải có tác động thật).
- **6D — Kinh tế khan hiếm & Xã hội mở đầu**: scarcity pricing + caravan demand-responsive **thật**, reputation-opportunity pipeline + 3 proto-norms gieo mầm (cấm trộm, bảo vệ trẻ, tương trợ hỏa hoạn) + mặt tối tin đồn sai.
- **Steal list từ 2 bản Natura ngoài** (phân tích read-only, không tin worklog của họ — đã bắt quả tang GLM claim "demand-responsive caravan" nhưng code là RNG thuần): P0 = Survival Guard (cả 2 AI độc lập cùng phát minh — tín hiệu mạnh nhất) + belief tuples + stale beliefs; P1 = scarcity pricing (sửa magic number 8), weather→fire chain, emotion layer, body-factor chain; P2 = brain boundary pattern. **Deferred:** needs-derived-from-body (Phase 7+; needs hiện tại đã ổn định qua 30-day run).
- Quy trình: Robin implement → Examiner Tier-3 audit → fix (tối đa 2 lần) → re-audit PASS → sang sub-phase tiếp.

### 5.4. Roadmap xa
- **Phase 7:** xã hội phức hợp & thể chế (tòa án phong tục, guilds, thừa kế, mê tín/lễ nghi).
- **Phase 8:** kinh tế liên vùng, tín dụng trung cổ, dịch tễ tiếp xúc, khí hậu khắc nghiệt.
- **Phase 9:** AI Brain integration — khi thế giới đã có logic nội tại, ký ức chân thực, động lực sâu sắc để AI thực sự sống và suy tư.
- Backlog "xem xét sau" (RIMWORLD_GAPS_BACKLOG.md): bản đồ thế giới + faction, storyteller điều tiết drama, y tế sâu (cắt cụt, chân tay giả gỗ), nấu bia/rượu, vũ khí + giáp, khái niệm phòng + nhiệt độ trong nhà, huấn luyện thú, kho bãi zone/stockpile, độ phì đất, kịch bản khởi đầu/thắng-thua. 4 món đáng tiền nhất khi quay lại: bia/rượu, chân tay giả gỗ, cung tên + giáp, nhiệt độ/phòng trong nhà. Cố ý không làm: điện, cây công nghệ, ideology, tàu vũ trụ.

---

## 6. Trạng thái hiện tại (2026-09-16)

- **Phase 1–4: HOÀN THÀNH**, Examiner PASS từng phase. Suite 224/224 assertions, 0 FAIL.
- **Phase 5 — Release:** Warren **conditional sign-off** (artifact 785,585 bytes, SHA-256 `5d0ce53a4344f3f82fa7d1983b34dab18470af9dadd9bbe9cc22b28c34b96781`, rebuild byte-identical, cold Chromium boot 0 errors). Tag `v0.4.0-phase4` tại commit `1aded9c` **chưa push** — cần **token GitHub one-time của user** (không lưu).
- **Phase 6:** SPEC đã được user duyệt (`SPEC_PHASE6.md`). **6A đang implement:** Robin code xong lần 1 (7 files + `tests/24_autotest.js`, harness 234 lines 0 FAIL) → **Examiner FAIL 3 blocking defects** (A1: gate-1 interrupt mỗi tick vì sói hiền/lửa trại; A2: expectation không hết hạn; A3: stash-expectation API dead) → đang fix **attempt 1/2** → sau đó re-audit → PASS mới commit → sang 6B. Chưa đụng tag release.
- **Natura gốc (v9): DỪNG** theo lệnh user — không khởi động lại khi chưa được yêu cầu. (Marta chết đói Day 33, Tomas chết đói Day 35 — không bao giờ resurrect.)

---

## 7. Team & quy trình

| Vai | Ai | Nhiệm vụ |
|---|---|---|
| Lead (PM + tech lead) | Friend (Muse) | Kiến trúc, brief, audit, quyết định, verify cuối, báo cáo. Người duy nhất nói chuyện với user. |
| Junior dev | **Robin** = agy CLI (Antigravity) | Implement theo brief. Persona `team/dev-robin.md` tự áp qua `~/workspace/agents/agy.sh` (hiện unjailed — giữ prompt scoped trong project). Timeout print 30m. |
| QA đối kháng | **The Examiner** | Audit Tier-3: tự chạy code verify, verdict PASS/FAIL kèm file/line evidence, **không bao giờ sửa code**, không tin worker tự báo xanh. |
| Art director | Sylvie Moreau | Direction only (không redraw). Hiện chưa vào vì chưa có thay đổi art. |
| Release engineer | Warren Stone | Ship checklist (clean build, artifact, cold smoke test, checksum). Không fix. **Nothing ships red.** |
| Executive producer | User | Final say về vision, taste, cái gì được ship. |

**Review tiers:** Tier 1 (docs/config — lead eyeball) · Tier 2 (script/tool cô lập — lead + test targeted) · Tier 3 (game logic/shared framework/economy/save/shipping — **Examiner audit đầy đủ**).

**Quy tắc sắt:** dev không ship thẳng (mọi thứ qua lead review) · examiner không sửa code · Sylvie không redraw · Warren không fix · tối đa **2 attempts** mỗi task rồi lead re-scope/tự làm · batch task nhỏ (mỗi agy call tốn ~13k-token overhead) · quota agy là tài nguyên khan hiếm (bucket ~5h + weekly cap) · "Agreement is not evidence" — mọi handoff phải ghi rõ **verified vs claimed** · commit/push do user giữ phía git (cần token của user).

**Kỷ luật test live-world (học bằng máu):** wrap snippet trong `(function(){...})()` (const top-level gây "already declared" ở evaluate thứ 2) · duy trì survival needs trong cùng evaluate khi advance time · white-box tests ưu tiên · `simTick(24)` không phải time machine trung tính · dọn temp villagers sau mỗi test · **không bao giờ test trong canonical settlement / restart real minds**.

---

*Hết hồ sơ. Tài liệu gốc đối chiếu: `SPEC_BUILD_PLAN.md`, `SPEC_PHASE6.md`, `docs/thinking-process.md` (Phần 1–6), `WORK_LOG.md`, `src/MANIFEST.md`, `GAME_DESCRIPTION.md`, `PROJECT_SUMMARY.md`, `RIMWORLD_GAPS_BACKLOG.md`, code `src/` (59 modules).*

---

## 8. Các vấn đề tài liệu đã biết — CHƯA SỬA (theo lệnh user: chỉ ghi vào hồ sơ, nhắc lại sau khi Phase 6 xong)

> Phát hiện khi biên soạn hồ sơ (2026-09-16). User quyết định: tạm thời không sửa source docs, chỉ ghi nhận ở đây. **Lead sẽ nhắc lại 3 (+1) vấn đề này để sửa sau khi các agent chạy xong toàn bộ Phase 6 (6A→6D).**

- **8.1. `PROJECT_SUMMARY.md` đã lỗi thời nặng.** Vẫn mô tả kiến trúc single-file 6.499 dòng và test suite 140/140, trong khi thực tế từ Phase 1 đã modular hóa 59 modules trong `src/` (build script chỉ là bundler), test suite đã 230+ dòng. Cần viết lại cho khớp kiến trúc hiện tại.
- **8.2. `GAME_DESCRIPTION.md` lệch roster.** §5 liệt kê 8 dân làng (Marta/Bram/Sella/Tobin/Wren/Finn/Alden/Pip) nhưng §12 nhắc "Gareth (người can đảm)" — Gareth không tồn tại trong roster; WORK_LOG Phase 4 ghi 11 villagers ban đầu (có cả Clara). Cần cập nhật roster thực tế + loại tên ma.
- **8.3. Mâu thuẫn "quần áo ướt".** `PROJECT_SUMMARY.md` ghi ướt mất 60% tác dụng giữ ấm, `GAME_DESCRIPTION.md` ghi "mất hết". Cần đối chiếu code `systems/14e_construction.js` (hoặc module quần áo) rồi thống nhất một con số.
- **8.4. "8 needs" chưa map chặt vào code (soft mismatch).** Spec/MANIFEST nói 8 needs nhưng `brain/utility.js` chỉ tính 6 deficit có tên (satiety, hydration, fatigue, injury, cold, social + risk modifiers). Cần đối chiếu trước khi Phase 6C đụng vào needs.
