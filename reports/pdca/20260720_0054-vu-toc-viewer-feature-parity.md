# PDCA Report — Clone viewer Trần Tộc → Vũ Tộc

**Thời điểm:** 2026-07-20 00:54 (UTC+7)  
**Plan:** [../../plans/20260720_0054-vu-toc-viewer-feature-parity.md](../../plans/20260720_0054-vu-toc-viewer-feature-parity.md)  
**Memory:** [../../memory/20260720_0054-vu-toc-viewer-feature-parity.md](../../memory/20260720_0054-vu-toc-viewer-feature-parity.md)

## 1. Context

Chủ dữ liệu yêu cầu audit và clone các tính năng viewer Trần Tộc còn thiếu trên Vũ Tộc (sidebar → popup modal), ghi log PDCA/SSOT.

## 2. Plan

Xem file plan. Gap chính: autocomplete, chế độ Tree/Force, export ảnh/JSON, panel 🧭 (slider + d-pad), modal `<dialog>` kiểu Trần Tộc, vẽ nhánh hậu duệ + banner, footer, mobile tab mặc định Phả đồ.

## 3. Do

- Port `public/js/autocomplete-search.js` từ Trần Tộc; gắn `fetchUrl=/api/public/search`.
- Viết lại `public/index.html`: stats (người / quan hệ cha–con / chi·đời), lọc Chi, lọc đời, chế độ, Fit/Ảnh/JSON, banner nhánh, panel 🧭, `<dialog>` hồ sơ, footer.
- Thay `public/css/viewer.css` bằng CSS Trần Tộc + bổ sung `.branch-filter`.
- Viết lại `public/js/viewer.js`: TreeModel máu (loại spouse), tooltip, filter `visible`+relayout, Force layout, vẽ nhánh/`showFullTree`, modal Thân thế/Gia đình/Vẽ nhánh/Ghi chép + person-link, zoom slider/pan/mobile tabs, export.
- Deploy public Worker version `b08388fb-610b-4606-8def-844fe8a3fbc0`.

## 4. Check

- PASS: live HTML có Chế Độ, 📷 Ảnh, 📥 JSON, 🧭.
- PASS: stats `315` / quan hệ cha–con / `8 chi · Đời 0–7`.
- PASS: autocomplete tìm “TỎ PHỤ” → Đời 0 · Đinh; clear ×.
- PASS: panel 🧭 mở slider 0.7 + d-pad + Toàn cảnh.
- PASS: modal dialog TỎ PHỤ — Thân thế, Gia đình (TỔ MẪU + 8 con link), Vẽ nhánh (196 người đến Đời 7).
- PASS: bấm “Vẽ phả đồ nhánh này” → banner “Xem toàn bộ phả đồ”.
- PASS: cây vẫn từ TỎ PHỤ; giữ lọc Chi Vũ Tộc.

## 5. Act

- Tiếp: Cloudflare Access + form CRUD admin.
- Tùy chọn: gắn lại 5 mảnh Vũ đời 5 thiếu father; giấy phép GoJS nếu công bố rộng.
- Mobile: nên kiểm tra tay trên điện thoại (tab Phả đồ mặc định).

## 6. Changed files

- `cloudflare/vu-toc-lang-chuong/public/index.html`
- `cloudflare/vu-toc-lang-chuong/public/css/viewer.css`
- `cloudflare/vu-toc-lang-chuong/public/js/viewer.js`
- `cloudflare/vu-toc-lang-chuong/public/js/autocomplete-search.js` (mới)
- `plans/20260720_0054-vu-toc-viewer-feature-parity.md` + README
- `reports/pdca/20260720_0054-vu-toc-viewer-feature-parity.md` + README
- `memory/20260720_0054-vu-toc-viewer-feature-parity.md` + README

## 7. Risks & rollback

- Force layout có thể chậm với ~200 node.
- GoJS eval watermark.
- Rollback: redeploy asset version trước.

## 8. Next actions

Access admin + CRUD; UAT mobile; gắn cha cho 5 người Vũ đời 5 nếu muốn cây sạch tuyệt đối.
