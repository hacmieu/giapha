# Memory: Zoom slider + bảng điều khiển dạng tab

- **Thời gian:** 2026-07-19 14:57
- **Phạm vi:** `drop/genealogy-viewer/` (index.html ×2, viewer.css, genealogy-viewer.js)

## Ghi nhớ
1. **Không dùng nút ＋/－ bấm lặp cho zoom trên viewer** — double-tap trên mobile kích hoạt browser zoom. Chuẩn hiện tại: `<input type="range">` 0.2–2 (bước 0.05) + `touch-action: manipulation` trên mọi nút điều khiển.
2. **Bảng điều khiển mặc định ẨN** — chỉ có nút tròn 🧭 (`.dc-toggle`, aria-expanded) góc phải dưới; bấm mới mở `#dcPanel` (slider, d-pad ▲◀⌂▶▼, "⛶ Toàn cảnh"). Nguyên tắc người dùng đặt ra: không phủ UI cố định lên phả đồ.
3. **Zoom theo slider phải neo tâm:** `setDiagramZoom` set `scale` rồi `centerRect` về tâm khung nhìn cũ (set scale trần sẽ neo góc trên-trái, bị trôi).
4. **Đồng bộ 2 chiều:** listener `ViewportBoundsChanged` → `syncZoomSlider()` cập nhật slider khi zoom bằng chuột/chạm/nút khác.
5. Cache-bust hiện tại: JS `?v=15`, CSS `?v=12`. Deploy version `866d31ad`.
