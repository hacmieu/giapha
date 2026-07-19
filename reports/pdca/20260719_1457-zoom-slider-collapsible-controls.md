# PDCA: Thanh trượt zoom + bảng điều khiển thu gọn

- **Thời gian:** 2026-07-19 14:57
- **Trạng thái:** done
- **Plan:** `plans/20260719_1457-zoom-slider-collapsible-controls.md`
- **Memory:** `memory/20260719_1457-zoom-slider-collapsible-controls.md`

## Plan
Người dùng góp ý: (1) nút ＋/－ dễ dính double-tap zoom trên mobile → dùng thanh trượt; (2) bảng điều khiển không nên hiện cố định che phả đồ → làm tab bấm mới hiện.

## Do
1. HTML (2 file index.html): panel `#dcPanel` mặc định `hidden`, chứa hàng zoom `－ [slider 0.2–2] ＋`, d-pad ▲◀⌂▶▼, nút "⛶ Toàn cảnh"; nút toggle tròn 🧭 với `aria-expanded`/`aria-controls`.
2. JS: `setDiagramZoom` (neo tâm bằng centerRect), `syncZoomSlider` (listener `ViewportBoundsChanged`), `toggleDiagramControls`; xoá `zoomInDiagram`/`zoomOutDiagram`.
3. CSS: `.dc-panel` card trắng bo 12px, `.dc-toggle` nút tròn 42px (đổi màu ink khi mở), `touch-action: manipulation` chống double-tap zoom; responsive mobile.
4. Bump JS `?v=15`, CSS `?v=12`; deploy → version `866d31ad`.

## Check
- Load mặc định: chỉ thấy nút 🧭, panel ở trạng thái collapsed.
- Bấm 🧭: panel mở, slider đồng bộ đúng 0.7.
- Kéo slider lên 1.2: scale đổi đúng, tâm khung nhìn lệch chỉ 1px (không trôi).
- Zoom bằng cách khác (decreaseZoom): slider tự cập nhật 1.15.
- Nút Về Tổ khôi phục view chuẩn; screenshot xác nhận panel gọn, không che node khi đóng.

## Act
- Ghi memory nguyên tắc: không phủ điều khiển cố định lên phả đồ; zoom dùng slider + touch-action manipulation.
- Gợi ý sau: nếu người dùng vẫn thấy vướng trên mobile, có thể tự đóng panel sau N giây không tương tác.
