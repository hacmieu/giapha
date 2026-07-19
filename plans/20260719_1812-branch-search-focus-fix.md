# Plan — Fix: tìm người mới khi đang xem nhánh thì phả đồ không đổi

- **Thời gian:** 2026-07-19 18:12
- **Module:** `drop/genealogy-viewer` (static viewer trên Cloudflare Workers)
- **Liên quan:** `plans/20260719_1756-descendant-branch-filter.md`

## Bối cảnh / Vấn đề
Sau khi vẽ phả đồ một nhánh hậu duệ (model GoJS bị thay bằng subtree), người dùng tìm
một người khác qua ô tìm kiếm và click vào kết quả → **phả đồ không thay đổi, không có
gì xảy ra**.

## Phân tích nguyên nhân (Plan)
- `onSelect` của autocomplete gọi `myDiagram.findNodeForKey(match.key)`.
- Khi đang ở chế độ xem nhánh, model chỉ chứa các node trong nhánh → người ngoài nhánh
  không có node → `node` là `null` → toàn bộ khối `select / scrollToPart / showPersonInfo`
  bị bỏ qua, không có phản hồi gì.
- Lỗi tương tự tồn tại ở `searchPerson()` (legacy) và link Thân phụ/con trong modal.

## Giải pháp
1. Thêm hàm dùng chung `focusPersonOnDiagram(match)`:
   - Tìm node theo key; nếu không có **và** đang ở chế độ xem nhánh (`branchViewRootKey`)
     → gọi `showFullTree()` để khôi phục phả đồ đầy đủ, rồi tìm lại node.
   - Select + scroll tới node (nếu có), luôn mở modal hồ sơ.
2. Dùng hàm này ở 3 chỗ: autocomplete `onSelect`, `searchPerson()`, và click
   `.person-link` (Thân phụ/con) trong modal.
3. Bump cache-bust `?v=20`, deploy Worker, verify bằng browser automation.

## Check dự kiến
- Vẽ nhánh A → tìm và chọn người ngoài nhánh → phả đồ về 547 người, node được chọn,
  banner nhánh ẩn, modal mở đúng người.
- Từ người mới, vẽ nhánh B → banner và model cập nhật đúng nhánh B.
