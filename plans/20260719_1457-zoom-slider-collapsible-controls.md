# Plan: Thanh trượt zoom + bảng điều khiển thu gọn (tab)

- **Thời gian:** 2026-07-19 14:57
- **Trạng thái:** done
- **Liên quan:** `plans/20260719_1449-diagram-nav-controls.md`

## Bối cảnh
Phản hồi người dùng về cụm nút vừa thêm:
1. Nút ＋/－ trên mobile bị lỗi UX: bấm liên tiếp (double-tap) làm trình duyệt zoom trang ngay chỗ đó → nên dùng thanh trượt (slider).
2. Bảng điều khiển hiện cố định che phả đồ, "không nên tham quá" → chỉ hiện khi cần, làm dạng tab/toggle.

## Thiết kế
1. **Toggle tab 🧭** (nút tròn 42px, góc phải dưới) — mặc định panel ẩn (`hidden`); bấm mở/đóng, có `aria-expanded`/`aria-controls`.
2. **Panel thu gọn** gồm: hàng zoom `－ [slider] ＋` (input range 0.2–2, bước 0.05), d-pad ▲◀⌂▶▼, nút "⛶ Toàn cảnh" full-width.
3. **JS:**
   - `setDiagramZoom(v)`: set scale neo vào tâm khung nhìn (centerRect) để không bị trôi.
   - `syncZoomSlider()`: listener `ViewportBoundsChanged` đồng bộ slider khi zoom bằng chuột/chạm.
   - `toggleDiagramControls()`: mở/đóng panel; bỏ `zoomInDiagram`/`zoomOutDiagram`.
4. **Chống double-tap zoom mobile:** `touch-action: manipulation` trên `.dc-btn` và `.zoom-slider`.
5. Bump JS `?v=15`, CSS `?v=12`; sửa đồng bộ 2 index.html; deploy + verify.

## Check items
- [x] `node --check` pass
- [x] Mặc định chỉ thấy nút 🧭 (panel collapsed trong accessibility tree)
- [x] Bấm 🧭 → hiện slider (value đồng bộ 0.7) + d-pad + Toàn cảnh
- [x] Kéo slider → scale 1.2, tâm khung nhìn lệch ≤1px
- [x] Zoom ngoài slider (commandHandler) → slider tự đồng bộ 1.15
- [x] Deploy version 866d31ad
