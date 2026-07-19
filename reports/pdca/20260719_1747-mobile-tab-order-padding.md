# PDCA: Tab Điều khiển trước + padding vùng phả đồ mobile

- **Thời gian:** 2026-07-19 17:47
- **Trạng thái:** done
- **Plan:** `plans/20260719_1747-mobile-tab-order-padding.md`
- **Memory:** `memory/20260719_1747-mobile-tab-order-padding.md`

## Plan
Người dùng yêu cầu: (1) tab Điều khiển đứng trước và là màn hình đầu tiên trên mobile, sau đó mới sang Phả đồ; (2) tab Phả đồ cần padding trên/dưới.

## Do
1. Đảo thứ tự nút tab và đặt mặc định active = Điều khiển ở cả 2 index.html (`body class="mobile-pane-controls"`).
2. Thêm `padding: 12px 0 14px` cho `.diagram-stage` trong media query mobile.
3. Sửa `applyInitialView()`: nếu div diagram đang ẩn (offsetWidth 0) → cờ `initialViewPending`, áp lại khi người dùng mở tab Phả đồ (tránh cây bị đặt sai vị trí do viewport = 0 khi load nền).
4. Bump JS `?v=17`, CSS `?v=14`; deploy → version `aecde8c7`.

## Check
- Viewport 390×844: load mặc định vào tab Điều khiển (sidebar full, đủ tìm kiếm/lọc/legend).
- Bấm "Phả đồ": cây hiện đúng view chuẩn — `scale = 0.7`, node Tổ trong khung nhìn, `diagramH = 700`, padding `12px 0 14px`.
- Desktop giữ nguyên bố cục 2 cột (tab chỉ hiện trên mobile).

## Act
- Ghi memory bẫy GoJS init khi `display:none` + pattern `initialViewPending`.
- Theo dõi phản hồi tiếp về flow "Điều khiển trước": nếu khách quen thao tác, có thể nhớ tab gần nhất bằng `localStorage`.
