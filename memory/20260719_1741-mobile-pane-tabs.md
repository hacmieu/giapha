# Memory: Mobile Worker — tab Phả đồ / Điều khiển

- **Thời gian:** 2026-07-19 17:41
- **Phạm vi:** `drop/genealogy-viewer/`

## Ghi nhớ
1. **“Mobile bản cũ” trên Worker ≠ asset cũ.** Thường là UX: sidebar + diagram chồng nhau. Kiểm tra bằng viewport 390px + đo `sidebar.offsetHeight` / `myDiagramDiv.offsetHeight`, không chỉ nhìn title.
2. **Quy ước mobile ≤768px:** tab `Phả đồ | Điều khiển`. Mặc định chỉ Phả đồ full-screen; sidebar ẩn (`display:none`). Class body `mobile-pane-controls` khi mở tab Điều khiển.
3. Desktop không hiện tab; sidebar vẫn nằm cạnh diagram như cũ.
4. Sau khi hiện lại diagram: gọi `myDiagram.requestUpdate()` vì GoJS không tự resize khi parent từ `display:none`.
5. Cache browser/edge có thể giữ HTML cũ dù curl đã thấy bản mới — verify bằng `Network.setCacheDisabled` + query string mới.
6. Cache-bust hiện tại: JS `?v=16`, CSS `?v=13`. Deploy `5841ad04`.
