# Memory: Cụm nút điều khiển nổi trên phả đồ

- **Thời gian:** 2026-07-19 14:49
- **Phạm vi:** `drop/genealogy-viewer/` (index.html ×2, viewer.css, genealogy-viewer.js)

## Ghi nhớ
1. **Cấu trúc:** `#myDiagramDiv` nay nằm trong `.diagram-stage` (position relative) — mọi overlay lên phả đồ đặt trong stage này, KHÔNG đặt trong `#myDiagramDiv` vì GoJS thay innerHTML.
2. **API điều khiển** (global, dùng cho onclick):
   - `applyInitialView()` — view chuẩn (scale 0.7, Tổ giữa trên, cách mép 24px); là hàm duy nhất định nghĩa initial view, listener `InitialLayoutCompleted` và nút "Về Tổ" đều gọi nó.
   - `goToRoot()`, `zoomInDiagram()`, `zoomOutDiagram()` (dùng `commandHandler.increaseZoom/decreaseZoom` — tôn trọng min/max zoom của GoJS), `panDiagram(dx, dy)` bước 60% viewport.
3. Hai bản `index.html` (gốc + `public/`) phải sửa đồng bộ khi thay HTML.
4. Cache-bust hiện tại: JS `?v=14`, CSS `?v=11`. Deploy version `f78bc300`.
