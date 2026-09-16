# SPEC PHASE 6 — "Con người không hoàn hảo"
_Ngày: 2026-09-16. Trạng thái: SPEC (chưa implement). Điều kiện tiên quyết: Phase 5 release đã push._

## Tài liệu gốc (đọc trước khi implement)

- `docs/thinking-process.md` **Phần 4** — 9 nguyên tắc dẫn đường (ràng buộc bắt buộc).
- `docs/thinking-process.md` **Phần 5** — Đánh giá chiến lược của Executive Producer.
- `docs/thinking-process.md` **Phần 6** — Biên bản hội đồng vòng 2: 7 phương án đã chốt + thứ tự triển khai.
- Phân tích 2 bản Natura ngoài (GLM 5.3 / Qwen Coder) — steal list đã được user duyệt 2026-09-16, tích hợp vào spec này (ghi rõ nguồn từng món).

## Ràng buộc bất biến (từ Phần 4 + vòng 2, tóm tắt)

1. **Cấm hoàn hảo hóa là luật tối cao.** Mỗi tính năng mới phải chứng minh tạo ra **câu chuyện mà hệ cũ không tạo được** (điều kiện nghiệm thu của Ông đồ).
2. **Hai ngưỡng:** dưới ~80% là đất của trade-off/tâm lý; trên ~85–90% sinh học độc tài override (giữ highest-need-wins ở ngưỡng nguy cấp — không được xóa).
3. **Chết ngu phải có logic nội tâm** (stale memory, false belief, pride, panic có nguyên nhân) — không RNG bullshit.
4. **Bảo toàn vật chất tuyệt đối** — không fallback nào được đẻ đồ ăn/vật liệu từ hư không.
5. **Belief ≠ truth:** villager chỉ dùng senses/memories/beliefs (3–5 tuples compact), không pointer tới hidden truth. Render/debug log được omniscient nếu không nhiễm vào decision.
6. **Bounded:** không food-chain đa tầng, không microclimate, không dịch tễ phức tạp, không Bayes đầy đủ, không mặc cả/lạm phát/tín dụng, không lập pháp dân chủ.
7. **Không waterfall 15 tầng** — implement theo lát cắt mỏng (vertical slices), các chiều nâng song song.
8. **Phải gieo cultural priors** — không đòi hỏi 100% bottom-up emergence (sẽ deadlock).
9. **Không trộn Phase 6 vào release Phase 4 đã audit.** Mỗi sub-phase: Robin implement → Examiner Tier-3 audit → fix (tối đa 2 lần) → re-audit PASS → mới sang sub-phase tiếp.

---

## 6A — Giác quan & Kỳ vọng (làm trước: rẻ nhất, leverage cao nhất)

### LÀM

**A1. Selective Attention — bộ lọc 3 cổng** (đặt trong `brain/12b_perception.js`, đúng vị trí pipeline sensation → attention → interpretation → memory):
- Cổng 1 — Cảm giác đột biến: lửa, tiếng thét, sói/gấu trong tầm nhìn → preemptive interrupt, cướp quyền chú ý ngay lập tức.
- Cổng 2 — Trạng thái khẩn cấp: need sinh học >75% → tunnel vision, lọc bỏ mọi vật thể không giải quyết cơn đói/khát/mệt/rét.
- Cổng 3 — Mục tiêu hiện tại (top-down relevance): chỉ vật thể/sự kiện liên quan việc đang làm dở mới được vào interpretation + ghi memory; còn lại là "nhiễu nền", lướt qua không lưu.
- Ông đồ nhượng bộ ở vòng 2: cổng 1 được đè bẹp mọi "trạng thái mải nghĩ".

**A2. Expectation Engine — Anchored Expectations** (`brain/knowledge.js`):
- Record: `{subject, attribute, predictedValue, confidence, learnedTick, source}` — steal **Qwen** `KnowledgeFact` (`types.ts:292-304`) + thêm trường `predictedValue`.
- Quy tắc: tri giác khớp dự đoán → +confidence, tốn 0 xử lý thêm. Lệch quá ngưỡng → sự kiện `SURPRISE = |thực tế − dự đoán| × confidence` → sinh emotion → ép update Epistemic Store → gọi re-plan nếu cần.
- Chỉ áp dụng 3 nhóm (điểm dừng đã chốt): **giá hàng quán** (nối 6D), **vị trí đồ đạc gia đình**, **sự hiện diện người thân**.
- **Stale stash beliefs** — steal **GLM** `knowledge.ts` (`observeStash`/`forgetStashes`): villager nhớ vị trí đồ vật đã thấy; belief hết hạn sau N ngày sim; đến nơi thấy đồ mất rồi = expectation violation → surprise. Đây là implement đầu tiên của belief tuples (Nguyên tắc 5).

**A3. Brain boundary refactor (pattern, KHÔNG đổi logic)** — steal **Qwen** `observe/think/learn` + **GLM** `brain/brain.ts` interface:
- Tách boundary sạch giữa sim và decision trong `brain/` (`07_ai.js`, `utility.js`): `observe()` (chứa attention filter A1) → `think()` → `learn()`, perception DTOs typed.
- `brain/09_bridge.js` giữ nguyên contract cho future AI brain. Chuẩn bị kiến trúc cho Phase 9.

### KHÔNG LÀM
FOV nón chi tiết; thính giác theo bước sóng âm thanh; khứu giác/vị giác; mô hình dự báo chuỗi thời gian hay Bayes đầy đủ; expectation cho mọi thứ ngoài 3 nhóm trên.

### Tiêu chí nghiệm thu (Examiner Tier-3)
- Villager đói >75% đi ngang vật thể không ăn được trong tầm nhìn mà không ghi memory (chứng minh cổng 2 bằng test phân biệt).
- Giá bánh mì tăng sốc → surprise + hủy mua + emotion thất vọng (nối A2→6D).
- Stale belief: nhớ stash 5 ngày trước → đến nơi trống → surprise + belief được supersede (có vết lịch sử).
- Attention filter deterministic: cùng seed → cùng tập vật thể được chú ý.

---

## 6B — Thích ứng & Sinh thái

### LÀM

**B1. Dynamic Candidate Generation — thay ladder hardcoded** (`brain/utility.js`, `brain/13a_intent.js`):
- Bỏ chuỗi fallback tĩnh `A → B → C`. Khi action nghẽn: truy vấn Epistemic Beliefs sinh **tối đa 3 candidates** từ goal templates + beliefs + habit.
- Chỉ re-plan khi có "cú sốc nhận thức" (surprise từ 6A / interruption), **không** re-evaluate mỗi tick → tránh action jitter (cảnh báo của Nhà sinh thái vòng 2).
- Steal ý tưởng từ cả 2 bản ngoài: candidate scoring minh bạch có `reason` (GLM `BrainDecision.reason`, Qwen candidates có điểm số) — nối vào `brain/22b_why.js` để WHY panel giải thích được.

**B2. Carrying capacity & tile depletion** (`sim/12d_world.js`):
- Tile/bush depletion: khai thác làm cạn tài nguyên tile thật; regen theo mùa; **mùa đông regen có thể về 0**.
- 4 mùa ảnh hưởng: grain, forage/wood, động vật săn được (nối `entities/14c_wildlife.js`).
- Sói 2 trạng thái (đã chốt Phần 4): bình thường bị lửa/đuốc/đám đông deterr; **đói cực độ vượt qua nỗi sợ** (nối Survival Guard 6C).

**B3. Weather → fire causal chain** — steal **GLM** `weather.ts` + `fire.ts`:
- `dryDays` counter → `dryness`; fire spread = f(fuel theo terrain/cây/nhà, hướng gió, dryness); mưa/tuyết dập lửa.
- Nối vào `systems/15e_firefight.js` (đã có dập lửa — nay có **nguyên nhân sinh thái** của lửa).
- Tile cháy xong → scorched + tro có provenance "burned" (học GLM `onTileBurned`) — đúng Nguyên tắc 4.

### KHÔNG LÀM
GOAP đầy đủ; quét toàn bản đồ tìm path; food-chain đa tầng (cỏ→thỏ→cáo→sói); microclimate; dịch tễ phức tạp.

### Tiêu chí nghiệm thu
- Bridge bị chặn → Bram sinh candidates từ beliefs (không phải ladder cứng); cùng seed → cùng candidates (deterministic).
- Khai thác liên tục một bụi berry → cạn kiệt; mùa đông regen = 0 (test qua nhiều mùa sim).
- Hạn dài ngày → dryness cao → lửa lan nhanh hơn có ý nghĩa so với ngày ẩm (test phân biệt).
- Sói đói cực độ tấn công bất chấp đuốc; sói no/bình thường bị đuốc deterr.

---

## 6C — Tâm lý sâu & Căn tính

### LÀM

**C1. Survival Guard — cơ chế thực thi Nguyên tắc 2** (`systems/12c_actions.js`, gắn đầu utility AI):
- Steal **GLM** `sim.ts:survivalGuard()` + **Qwen** `brain.ts:111-155` — **cả 2 AI độc lập cùng phát minh pattern này** (guard clauses điểm tuyệt đối override mọi candidate) → tín hiệu mạnh nhất trong steal list.
- Ngưỡng sinh tử: thirst<8, hunger<6, warmth<6, blood<70, lửa/sói kề bên → cancel action interruptible + re-decide; action loại emergency/survival không bao giờ bị interrupt.
- **Chống oscillation** (bug GLM #5: ăn↔chạy loop): re-decide lock/cooldown sau mỗi lần guard trigger.

**C2. Conflicting Motivations — kiến trúc 2 tầng:**
- Tầng 1 (dưới 80%): duty / attachment / pride / habit cạnh tranh với needs qua utility **có ngữ cảnh** — modifier điều kiện rõ ràng, KHÔNG trọng số mờ (cảnh báo của Thợ cả).
- Khi motive tâm lý thắng need cơ thể (Alden nhịn ngủ chăm người ốm) → **suppression stress** + **emotion tag** (mệt-nhưng-tự-hào) ghi vào memory — trade-off phải để lại dấu vết cảm xúc (điều kiện của Ông đồ).
- Tầng 2 (trên 85%): chính là C1 — sinh học override 100%, microsleep cưỡng chế (sinh học thắng thơ ca).

**C3. Emotion derivation layer** — steal **Qwen** `character.ts:407-435` (`entities/02_body.js`, chạy sau updateBody):
- Cảm xúc sinh từ body/needs + decay: đói→anxious, đau→suffering, ổn→content. Nền rẻ nhất cho emotion tags của C2.

**C4. Body-factor chain** — steal **GLM** `needs.ts` (`entities/02_body.js` + `systems/12d_illness.js`):
- Vết thương không chữa → infection; mọi condition trừ work factor / speed factor theo severity; pain + blood loss cộng dồn.
- `bodyWorkFactor` nối vào utility scoring: người què tự biết không đi xa — hỗ trợ candidate generation (B1).

**C5. Autobiographical Identity — tự kết tinh** (`brain/knowledge.js`):
- `v.identity`: tối đa 3–5 self-beliefs, **KHÔNG config tay** — tự hình thành khi sự kiện đạt salience cực hạn (suýt chết đuối, cứu làng khỏi cháy, bị phản bội, skill đạt Master).
- Tag enum + hệ số bias lên attention (6A) và goal selection. Bài học từ cú vả vòng 2 (bug #13 `calcOccupationBonus` dead code): **đã làm là phải có tác động thật** — vd "mẹ Pip" → tiếng khóc của Pip có salience ×5. Tags cũ rụng khi biến cố mới làm lung lay.

### KHÔNG LÀM
Lý thuyết triết học đạo đức phức tạp; bệnh tâm thần lâm sàng; văn bản tự truyện văn học; identity crisis; quá 5 identity tags.

### Tiêu chí nghiệm thu
- Alden fatigue 70% + người ốm cần chăm → duty thắng sleep → suppression stress + emotion tag trong memory.
- Alden fatigue 95% → microsleep cưỡng chế bất chấp duty (test phân biệt: thơ ca thua sinh học).
- Guard trigger → không oscillation: sau re-decide lock, action ổn định ≥ N tick (test chống loop).
- Sự kiện salience cực hạn → identity tag mới sinh → tag ảnh hưởng attention đo được (vd salience tiếng khóc ×5).
- Vết thương không băng → infection → work factor giảm → villager tự chọn việc nhẹ hơn.

---

## 6D — Kinh tế khan hiếm & Xã hội mở đầu

### LÀM

**D1. Scarcity pricing** — steal **GLM** `economy.ts:14-22`, sửa magic number (`systems/13b_economy.js`):
- Giá = giá sàn × (1 + scarcity) × seasonMult (thực phẩm đắt hơn mùa đông).
- `scarcity = max(0, 1 − stock/weeklyConsumption)` — **KHÔNG** dùng hằng số 8 vô nghĩa như GLM (đúng phê phán "có con số = khoa học" ở Phần 5.13).
- Bảo toàn vật chất tuyệt đối: hết muối là hết thật đến khi caravan tới. Giá sốc → expectation violation (6A) → hủy mua / chuyển giải pháp thay thế.

**D2. Demand-responsive caravan — LÀM THẬT** (`systems/15c_caravan.js`):
- Worklog GLM claim nhưng code là RNG thuần (bài học: không tin AI tự báo cáo — Examiner verify bằng code). Ta implement thật: caravan ghi nhận mặt hàng sold-out (demand signal) → chuyến sau mang nhiều hơn theo cung cầu đơn giản.

**D3. Reputation-Opportunity Pipeline + 3 proto-norms gieo mầm** (`systems/12d_social.js`, `systems/20_social_life.js`, `systems/21a_ownership.js`):
- Hành động xã hội có nhân chứng → memory salience cao → tin đồn méo mó 1-hop (dùng hạ tầng claims/witnesses sẵn có) → trust/reputation per-villager.
- Role vacancy (trưởng thôn, lính gác, thầy thuốc) → chọn người uy tín cao nhất **trong niềm tin tập thể**.
- Gieo 3 proto-norms (học từ quan ngại #2 vòng 2 — không đòi 100% bottom-up): (1) cấm trộm — bắt quả tang → mất sạch trust; (2) bảo vệ trẻ nhỏ; (3) tương trợ hỏa hoạn. Vi phạm → social ostracism.
- **Mặt tối bắt buộc:** tin đồn sai cũng tạo reputation sai (nối dê tế thần) — xã hội thật không công bằng.

### KHÔNG LÀM
Mặc cả trả giá qua lại; lạm phát hay nợ/tín dụng phức tạp; hệ thống lập pháp dân chủ hiện đại; xung đột giai cấp vĩ mô; luật văn bản phức tạp.

### Tiêu chí nghiệm thu
- Muối khan hiếm → giá tăng → villagers giảm ướp thịt / chuyển ăn tươi → demand signal ghi nhận → caravan chuyến sau mang nhiều muối hơn (chuỗi emergent khép kín, test nhiều chuyến).
- Trộm bị bắt quả tang → trust sụp → khi có guard vacancy, kẻ trộm không được chọn dù khỏe.
- Tin đồn sai (nhân chứng nhìn nhầm) → reputation sai hình thành → test mặt tối của xã hội.

---

## DEFERRED — không làm trong Phase 6

- **Needs derived từ body** (steal Qwen: `thirst=(1−hydration)×100`…): ý hay, triệt lớp bug đồng bộ needs/body — nhưng needs hiện tại đã ổn định qua 30-day run + Examiner PASS. Refactor Tier-3 sâu lúc này rủi ro > lợi. **Để Phase 7+.**
- Phase 7: xã hội phức hợp & thể chế (tòa án phong tục, guilds, thừa kế, mê tín/lễ nghi).
- Phase 8: kinh tế liên vùng, tín dụng trung cổ, dịch tễ tiếp xúc, khí hậu khắc nghiệt.
- Phase 9: AI Brain integration — khi thế giới đã có logic nội tại, ký ức chân thực, động lực sâu sắc để AI thực sự sống và suy tư.

## Quy trình thực hiện

1. Thứ tự: **6A → 6B → 6C → 6D** (rẻ + leverage cao trước; 6A là nền cho 6C/6D).
2. Mỗi sub-phase là một gói độc lập: Robin implement theo spec này → Examiner Tier-3 audit → fix (tối đa 2 lần) → re-audit PASS → mới sang gói tiếp.
3. Hard rule: edit modules trong `src/`, rebuild qua `scripts/build_willowbrook_natura.py`; **không hand-edit `willowbrook_natura.html`**.
4. Determinism: `Math.random` chỉ trong render/comments; mọi RNG gameplay qua seeded streams (kỷ luật từ Phase 4).
5. Test: mỗi tính năng mới cần test phân biệt (fail trên code cũ theo construction) + suite harness xanh; long-run probe khi chạm needs/sinh tồn.
