# PDCA — Fix: tìm người mới khi đang xem nhánh, phả đồ không đổi

- **Thời gian:** 2026-07-19 18:12
- **Module:** `drop/genealogy-viewer`
- **Live:** https://giapha-genealogy-viewer.hacmieu.workers.dev

## Plan
- Người dùng báo: vẽ nhánh xong → tìm người khác → click kết quả → phả đồ đứng yên.
- Nguyên nhân: model GoJS lúc đó chỉ chứa nhánh; `findNodeForKey` cho người ngoài nhánh
  trả `null` nên autocomplete `onSelect` không làm gì (silent fail).
- Kế hoạch: hàm chung `focusPersonOnDiagram` — nếu node không tồn tại và đang xem nhánh
  thì tự `showFullTree()` rồi nhảy tới người đó. Chi tiết:
  `plans/20260719_1812-branch-search-focus-fix.md`.

## Do
- `public/js/genealogy-viewer.js`:
  - Thêm `focusPersonOnDiagram(match)` (khôi phục full tree khi cần, select + scroll,
    luôn mở modal hồ sơ).
  - Áp dụng cho autocomplete `onSelect`, `searchPerson()`, và click link Thân phụ/con
    trong modal.
- `index.html` + `public/index.html`: bump `?v=20`.
- Deploy: `wrangler deploy` → version `ed9f076e-c26e-483b-b3c5-dfef50082272`.

## Check
- `node --check` pass; live HTML đã trả `?v=20`.
- Browser automation trên bản live:
  1. Vẽ nhánh Trần Văn Lư → model 32 người, banner hiện. ✅
  2. Chọn Trần Văn Ất (ngoài nhánh) → model về 547 người, banner ẩn, node được chọn,
     modal mở đúng người. ✅ (trước fix: không có gì xảy ra)
  3. Chọn Trần Đình Bơn rồi vẽ nhánh → model 39 người, banner đúng, root hiển thị
     đầu phả đồ (screenshot). ✅

## Act
- Ghi memory: `memory/20260719_1812-branch-search-focus-fix.md`.
- Cập nhật SSOT README (memory/plans/reports), commit + push.
- Ghi nhận: mọi luồng "nhảy tới một người" nên đi qua `focusPersonOnDiagram` để
  không tái phát lỗi silent-fail khi model là subtree.
