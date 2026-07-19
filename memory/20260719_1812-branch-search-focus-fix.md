# Memory — Fix tìm kiếm khi đang xem nhánh (focusPersonOnDiagram)

- **Thời gian:** 2026-07-19 18:12
- **Module:** `drop/genealogy-viewer`
- **Deploy:** Worker version `ed9f076e-c26e-483b-b3c5-dfef50082272`, JS `?v=20`

## Vấn đề
Đang xem một nhánh hậu duệ (model GoJS = subtree) → tìm người khác qua autocomplete và
click → không có gì xảy ra vì `findNodeForKey` trả `null` (người đó không nằm trong
model nhánh), khối xử lý bị bỏ qua im lặng.

## Cách sửa (public/js/genealogy-viewer.js)
- Thêm `focusPersonOnDiagram(match)`:
  - Nếu node không có trong model hiện tại và `branchViewRootKey` đang set →
    `showFullTree()` (khôi phục model 547 người, ẩn banner) rồi tìm lại node.
  - Select + `scrollToPart` node nếu có; luôn `showPersonInfo(match)`.
- Dùng chung cho: autocomplete `onSelect`, `searchPerson()` (legacy), click
  `.person-link` (Thân phụ / con) trong modal.
- `index.html`: bump `genealogy-viewer.js?v=20`.

## Kiểm chứng (trên bản live)
1. Vẽ nhánh Trần Văn Lư → model 32 người, banner hiện.
2. `focusPersonOnDiagram(Trần Văn Ất)` (ngoài nhánh) → model về 547, banner ẩn,
   node được chọn, modal mở đúng "Trần Văn Ất".
3. Vẽ nhánh Trần Đình Bơn → model 39 người, banner "Nhánh Trần Đình Bơn · tất cả
   con cháu · 39 người". Screenshot xác nhận.

## Lưu ý
- Người không có con cháu (vd Trần Văn Ất) thì modal không có nút "Vẽ phả đồ nhánh
  này" — đó là hành vi đúng, không phải lỗi.
