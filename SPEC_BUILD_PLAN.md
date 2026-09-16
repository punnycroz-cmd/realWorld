# WILLOWBROOK NATURA — Kế hoạch thực hiện spec 38 mục
_Ngày: 2026-09-15. Spec đầy đủ của chủ dự án, đối chiếu với game hiện tại._

## Kết quả audit: đã có gì / thiếu gì

**Đã có (không làm lại):** body/needs 8 nhu cầu, survivalGuard, honest perception, 16+ verbs + intent planner, y tế trung cổ, downed/rescue, 8 skills + XP + assignWork, xây dựng vật liệu, quần áo lớp/giữ ấm, 3 hạng bữa ăn + ngộ độc + ướp thịt, chăn nuôi, shop + caravan, sói/lợn/gấu + săn bắn, sét/cháy rừng/dập lửa, mang thai/sinh/trẻ em, chôn cất, xã hội 2 mặt (bond/rivalry/đánh nhau/làm lành), ký ức + dreams, event feed, Pawn Inspector, bridge API cho AI brain.

**Thiếu thật (phải xây mới):**
| # | Spec mục | Nội dung thiếu |
|---|---|---|
| 1 | §14–15 | Hệ recipe data-driven: cây→gỗ→ván→đồ nội thất; quặng→kim loại→công cụ; vật phẩm có "lý lịch" (ai làm, từ cây nào, lịch sử) |
| 2 | §8 | Utility AI thay routine cứng hiện tại (villager tự chấm điểm hành động theo needs/personality/khoảng cách/rủi ro...) |
| 3 | §16 | Knowledge/discovery: kiến thức không mở khóa toàn cục; dạy nghề (Bram dạy Marta), học lỏm, quên |
| 4 | §4 | Life stages infant/adolescent/elder; hôn nhân; household (hộ gia đình) như entity; thế hệ |
| 5 | §10 | Belief: niềm tin có thể sai/cũ/không chắc (hiện chỉ có perception trung thực) |
| 6 | §11 | Memory giàu: type/participants/location/time/importance/emotional impact + phai dần |
| 7 | §22 | Building như entity: nhiệt độ trong nhà, vệ sinh, sức chứa, sở hữu, mở rộng/bỏ hoang/phá dỡ |
| 8 | §17 | Business động: demand+skill+vốn → nghề/tiệm mới mọc ra trong lúc chơi |
| 9 | §32 | Save/load (localStorage) — hiện chưa có |
| 10 | §30–31 | Inspector hiện "WHY" (vì sao chọn hành động này) + debug overlays (nhiệt độ, độ phì, lửa, tầm nhìn...) |
| 11 | §24 | Đời thường: tắm rửa, dọn dẹp, thăm hỏi, chơi đùa, trông trẻ |
| 12 | §2 | Công trình còn thiếu: barn, workshop, kitchen, inn (chỉ mới có nhà/shop/giếng), sông (hiện mới có hồ) |

## Kiến trúc (quyết định của lead)

Spec yêu cầu modular, không single-file. Nhưng game phải giữ **1 file HTML mở được từ file://**.
→ Giải pháp: source chia module trong `src/` (sim/, entities/, systems/, render/, ui/, data/, brain/), **build script bundle tất cả thành 1 HTML duy nhất**. Vừa modular vừa giữ cách chơi hiện tại.

## Các phase

- **Phase 1 — Modular hóa:** ✅ HOÀN THÀNH + Examiner nghiệm thu (CONDITIONAL PASS → 2 defect đã fix, 10/10 lần test xanh 70/70). 40 modules `src/`, thin bundler, `src/MANIFEST.md`. Node harness: `devtools/node_harness.js` (chạy từ project root, vì /tmp không vào được jail của Robin).
- **Phase 2A — Recipe data-driven + provenance:** ✅ HOÀN THÀNH + Examiner nghiệm thu PASS (2026-09-16). 6 recipes + provenance API; 2 defect phát hiện sau audit (provenance mất khi đổi chủ; workstation không tới được bỏ im lặng) đã fix + re-audit PASS. Suite 80/80, 43 modules.
- **Phase 2B — Building entities + địa điểm mới:** ✅ HOÀN THÀNH + Examiner nghiệm thu PASS (2026-09-16). Building = entity đầy đủ (indoorTemp, cleanliness, capacity, owner, expansion, abandonment, demolition); barn/workshop/kitchen/inn hoạt động thật; sông deterministic (uống/câu cá/cầu). 1 defect sau audit (ghost-target fallback phá nhầm quán trọ) đã fix + re-audit PASS (probe 21/21). Suite 91/91, 45 modules.
- **Phase 2C — Utility AI:** ✅ HOÀN THÀNH + Examiner nghiệm thu PASS (2026-09-16). Utility AI scorer: candidate actions scored via 8 need deficits, personality weights, distance/proximity cost, risk modifiers, opportunity bonuses; deterministic tie-breaking (seeded RNG); failure observation -> interpretation -> knowledge -> re-evaluation chain; survivalGuard override & __aiBridge contract intact. 1 defect sau audit (stale-thought re-trigger kẹt vĩnh viễn) đã fix + re-audit PASS (probe 12/12, discrimination test chứng minh 18.13 bắt được bug cũ). Suite 112/112, 47 modules.
- **Phase 2D — Knowledge/Belief/Memory:** ✅ HOÀN THÀNH (2026-09-16). Epistemic store cá nhân per villager (memories, active beliefs, ownership beliefs, claims & evidence). Phân tách triệt để REALITY vs PERCEPTION vs MEMORY vs KNOWLEDGE vs BELIEF vs CLAIM vs EVIDENCE vs UNCERTAINTY. Quan sát -> niềm tin theo nguồn tin cậy; quên phai theo thời gian sim (sharp/average/forgetful); dạy học (teach verb/intent) kiểm tra gần nhau và tỉnh táo; niềm tin sai/mâu thuẫn lưu trữ song song với sự thật thế giới, quan sát mới supersede niềm tin cũ và lưu vết lịch sử; niềm tin sở hữu + tuyên bố (claims) không thay đổi actualOwner thế giới (chuẩn bị hạ tầng cho 2F); Utility AI tham vấn niềm tin thay vì toàn tri (khám phá khi không biết thức ăn ở đâu); +fix Examiner phát hiện (conflict detection tổng quát thay vì 5 key cứng; deep-clone evidence/content chống aliasing lịch sử) + re-audit PASS. Suite 128/128, 49 modules.

### Phase 2 — các hệ mới (chia gói nhỏ, mỗi gói = Robin implement → Examiner audit → fix → mới sang gói tiếp)

- **2A — Recipe data-driven + provenance:** bảng recipe trong `src/data/` (cây→gỗ→ván→đồ nội thất; quặng→kim loại→dụng cụ; lanh→vải→quần áo; lúa→bột→bánh; thịt→hun khói...). Mọi vật phẩm chế tạo có provenance: người tạo, nguyên liệu, chất lượng, tình trạng, chủ sở hữu, thời gian tạo, lịch sử dùng.
- **2B — Building entities + địa điểm mới:** nhà = entity đầy đủ (nhiệt độ, sạch sẽ, sức chứa, chủ, mở rộng, bỏ hoang, phá dỡ). Thêm barn, workshop, kitchen, inn, sông.
- **2C — Utility AI:** ✅ HOÀN THÀNH + Examiner nghiệm thu PASS (2026-09-16). Nhân vật tự đánh giá nhu cầu/cơ hội và chọn hành động (utility scoring); `__aiBridge` giữ nguyên cho future brain.
- **2D — Knowledge/Belief/Memory:** ✅ HOÀN THÀNH + Examiner nghiệm thu PASS (2026-09-16; 2 defect sau audit: silent-merge ngoài 5 key cứng + evidence aliasing — đã fix + re-audit PASS). Knowledge cá nhân (khám phá/dạy/quên), belief có thể sai/lỗi thời/không chắc, memory giàu (ai, ở đâu, quan trọng, cảm xúc, phai dần), ownership beliefs & claims.
- **2E — Đời sống xã hội:** ✅ HOÀN THÀNH + Examiner nghiệm thu PASS (2026-09-16; FAIL lần 1 với 5 defect + 2 bug phát hiện khi sửa: childcare "hô biến" đồ ăn, occupation bonus dead code, chửa ngoài hôn nhân, Math.random trong sinh đẻ, marry thất bại im lặng, NaN position có sẵn, player pawn không được survivalGuard — đã fix hết + re-audit PASS: probe độc lập 10/10, trace 72h ×3 sạch NaN/chết khát/chết kiệt sức). Life stages (child/youth/adult/elder, hiệu ứng thật), hôn nhân (mutual bond, adult, xóa spouseId khi chết), household, thế hệ (sinh đẻ deterministic qua createVillager), sinh hoạt (bathe/visit/play/childcare/clean/insult), bonds phai dần, nghề nghiệp +25% có thật, sạp chợ. Suite 155/155, 51 modules.
- **2F — Ownership, provenance & information layers:** ✅ HOÀN THÀNH & Examiner nghiệm thu PASS (2026-09-16). object identity ổn định (Chair #104), phân tách actualOwner / currentHolder / knownOwner / suspectedOwner + confidence + evidence + claims theo từng nhân vật, sự kiện chuyển giao (mua/bán/tặng/trộm/mượn/mất/tìm/thừa kế/bỏ hoang) ghi vào lịch sử vật, material lineage (Chair→Plank→Tree), chuỗi failure→observation→re-evaluation (không bỏ action im lặng). Tranh chấp: 3+ người cùng nhận đều được xét xử, xử định lượng theo thang chứng cứ, trưởng làng không tự xử kiện của mình; __aiBridge viewer-scoped, không rò rỉ actualOwner. Suite 183/183 (part21 27/27), 53 modules. Tìm thấy không chặn: getTransferLog còn rò rỉ chủ thật trong steal result string — đã vá sau nghiệm thu (không cần re-audit).
- **Phase 3 — Công cụ:** save/load (localStorage), inspector "tại sao làm thế" (why-action), debug overlays. ✅ IMPLEMENTED (2026-09-16, lead trực tiếp): `sim/22a_save.js` (save/load full state + RNGS.s, versioned, autosave/day, manual slot), `brain/22b_why.js` (decision trace từ utility brain thật + `__aiBridge.explainAction`, panel WHY trong pawn inspector), `render/22c_overlays.js` (5 debug overlays tắt mặc định), `tests/22_autotest.js` (14 assertions). Suite 198/198 (part22 14/14), 57 modules. ✅ HOÀN THÀNH & Examiner nghiệm thu PASS (2026-09-16, 4 vòng audit: 3 vòng FAIL defect không chặn → fix hết — feed overlay standalone, shape-corrupt atomicity field→element→object-map-value levels, test cleanup by-name, __proto__ smuggling 2 lớp; vòng 4 PASS + 1 minor hardening). Suite cuối 206/206 (part22 21/21), 57 modules.
- **Phase 4 — Long-run:** chạy ngày/tuần/mùa/năm, fix bug, Warren release review.
- **Phase 2 — Hệ mô phỏng mới:** các mục 1–8, 11–12 trong bảng thiếu (recipe/provenance, utility AI, knowledge, life stages/hộ gia đình, belief, memory giàu, building entity, business động, đời thường, công trình/sông còn thiếu).
- **Phase 3 — Công cụ & lưu trữ:** save/load, inspector WHY, debug overlays.
- **Phase 4 — Kiểm thử dài:** chạy nhiều ngày/tuần/mùa mô phỏng, fix kẹt agent, loop vô hạn, bug sinh/tử, kinh tế.
- **Phase 5 — Release:** Examiner audit cuối + Warren checklist.

## Phân công team

- **Lead (Friend):** kiến trúc, audit, quyết định, verify cuối, báo cáo.
- **Robin (dev/agy):** implement từng module theo phase.
- **Examiner (QA):** audit đối kháng mỗi phase (Tier 3).
- **Sylvie:** chỉ vào khi có thay đổi art (hiện chưa).
- **Warren:** Phase 5 release checklist.

## Điểm cần chủ dự án quyết (đang hỏi)

**ART:** spec yêu cầu "KHÔNG dùng ảnh AI, character phải procedural 100%" — nhưng directive hiện hành của chủ dự án là "không bao giờ thay art AI raster bằng procedural". Hai yêu cầu mâu thuẫn trực tiếp. Mặc định giữ art hiện tại trừ khi chủ dự án đổi ý.
