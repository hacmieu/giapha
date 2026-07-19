# Memory: Mobile tab order + GoJS init khi div ẩn

- **Thời gian:** 2026-07-19 17:47
- **Phạm vi:** `drop/genealogy-viewer/`

## Ghi nhớ
1. **Thứ tự tab mobile (chốt theo người dùng):** `Điều khiển` trước, `Phả đồ` sau; mặc định mở Điều khiển (body có sẵn class `mobile-pane-controls` trong HTML).
2. **Bẫy GoJS + display:none:** khi diagram load lúc div ẩn, `viewportBounds.width = 0` → mọi tính toán center/position sai. Pattern xử lý: `applyInitialView()` kiểm tra `myDiagram.div.offsetWidth === 0` thì đặt cờ `initialViewPending` và thoát; `setMobilePane('diagram')` sau `requestUpdate()` sẽ áp lại. Áp dụng pattern này cho mọi thao tác vị trí tương lai (scrollToPart khi mở từ tìm kiếm đã tự về tab diagram trước).
3. Padding vùng phả đồ mobile: `.diagram-stage { padding: 12px 0 14px }` (media ≤768px), nhớ `box-sizing: border-box`.
4. Cache-bust hiện tại: JS `?v=17`, CSS `?v=14`. Deploy `aecde8c7`.
