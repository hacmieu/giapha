# Plan: Mobile Worker — tách Phả đồ / Điều khiển thành tab

- **Thời gian:** 2026-07-19 17:41
- **Trạng thái:** done
- **Liên quan:** `plans/20260719_1457-zoom-slider-collapsible-controls.md`

## Bối cảnh
Người dùng báo mobile trên Worker URL (`giapha-genealogy-viewer.hacmieu.workers.dev`) vẫn như bản cũ. Kiểm tra xác nhận:
- Asset đã mới (JS v=15, CSS v=12, branding Trần tộc).
- UX mobile vẫn cũ: sidebar chiếm ~39vh (~329px) chồng lên diagram (~490px) → nhìn chật, khó dùng — đúng góp ý trước đó chưa được áp vào sidebar (chỉ ẩn cụm zoom/nav sau nút 🧭).

## Giải pháp
1. Thêm tab mobile `Phả đồ | Điều khiển` dưới header (chỉ hiện ≤768px).
2. Mặc định tab Phả đồ: ẩn sidebar, diagram full chiều cao (`~726px` trên iPhone 390×844).
3. Tab Điều khiển: ẩn diagram, hiện sidebar full.
4. Tìm kiếm chọn người → tự chuyển về tab Phả đồ và scroll tới node.
5. `setMobilePane()` + `requestUpdate()` khi quay lại diagram.
6. Bump CSS `?v=13`, JS `?v=16`.

## Check items
- [x] curl live: HTML có `mobile-pane-tabs`, JS v=16, CSS v=13
- [x] viewport 390: tabs=flex, sidebar=none, diagramH=726, scale=0.7
- [x] Tab Điều khiển mở sidebar; tab Phả đồ full diagram + nút 🧭
- [x] Deploy version 5841ad04
