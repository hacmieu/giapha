# PDCA: Sửa mobile Worker — tab Phả đồ / Điều khiển

- **Thời gian:** 2026-07-19 17:41
- **Trạng thái:** done
- **Plan:** `plans/20260719_1741-mobile-pane-tabs.md`
- **Memory:** `memory/20260719_1741-mobile-pane-tabs.md`

## Plan
Người dùng khẳng định đang xem Worker URL, mobile vẫn như bản cũ. Cần kiểm tra lại và sửa đúng nguyên nhân.

## Do
1. **Chẩn đoán:** curl + UA iPhone xác nhận Worker đã trả branding mới / JS v=15. Emulate 390×844: sidebar 329px + diagram 490px — UX cũ, đúng phàn nàn “để cả phả đồ và bảng điều khiển thì khó dùng”.
2. Thêm `nav.mobile-pane-tabs` (Phả đồ | Điều khiển), CSS ẩn sidebar mặc định trên mobile, diagram full height.
3. JS `setMobilePane()`; tìm kiếm → tự về tab Phả đồ.
4. Bump CSS v=13, JS v=16; deploy → `5841ad04`.

## Check
- Live HTML: `mobile-pane-tabs`, `genealogy-viewer.js?v=16`, `viewer.css?v=13`.
- Viewport 390: `tabs=flex`, `sidebar=none`, `diagramH=726` (trước 490), `scale=0.7`.
- Screenshot: mặc định full phả đồ + tab + nút 🧭; tab Điều khiển hiện sidebar đầy đủ.
- Lưu ý: trình duyệt có thể cache HTML cũ — cần hard refresh / query mới khi kiểm chứng.

## Act
- Ghi memory: phân biệt asset version vs UX mobile; quy ước tab mobile.
- Nhắc người dùng hard refresh trên điện thoại (đóng tab hoặc xoá cache) vì CF/browser có thể giữ HTML cũ dù server đã mới.
