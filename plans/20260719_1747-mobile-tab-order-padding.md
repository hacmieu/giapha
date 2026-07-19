# Plan: Mobile — tab Điều khiển trước, padding vùng phả đồ

- **Thời gian:** 2026-07-19 17:47
- **Trạng thái:** done
- **Liên quan:** `plans/20260719_1741-mobile-pane-tabs.md`

## Bối cảnh
Góp ý sau bản tab mobile đầu tiên:
1. Thứ tự phải là "Điều khiển" trước rồi mới sang "Phả đồ" — người dùng thiết lập bộ lọc/tìm kiếm trước, xem cây sau.
2. Tab Phả đồ cần chút padding trên và dưới (cây đang chạm sát thanh tab và mép màn hình).

## Giải pháp
1. **Đảo thứ tự tab** (2 index.html): `Điều khiển | Phả đồ`; mặc định active = Điều khiển (`body class="mobile-pane-controls"`, aria-selected tương ứng). Desktop không đổi (tab chỉ hiện ≤768px).
2. **Padding:** `.diagram-stage { padding: 12px 0 14px }` trong media query mobile, nền paper.
3. **Xử lý GoJS load khi div ẩn:** vì mặc định mobile giờ mở tab Điều khiển, diagram init lúc `display:none` (viewport width 0) → `applyInitialView()` phát hiện `div.offsetWidth === 0`, đặt cờ `initialViewPending`; khi bấm sang tab Phả đồ, `setMobilePane('diagram')` gọi `requestUpdate()` rồi áp lại initial view.
4. Bump JS `?v=17`, CSS `?v=14`; deploy + verify viewport 390×844.

## Check items
- [x] `node --check` pass
- [x] Mặc định mobile: tab Điều khiển selected, sidebar full màn hình
- [x] Sang Phả đồ: scale 0.7, node Tổ trong khung nhìn (initial view pending được áp), padding `12px 0 14px`
- [x] Deploy version aecde8c7
