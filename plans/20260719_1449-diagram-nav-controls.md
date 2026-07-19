# Plan: Nút phóng to / thu nhỏ / điều hướng trên phả đồ

- **Thời gian:** 2026-07-19 14:49
- **Trạng thái:** done
- **Liên quan:** `plans/20260719_1330-initial-scale-70.md`

## Bối cảnh
Người dùng yêu cầu có nút phóng to, thu nhỏ và điều hướng ngay trên phả đồ (trước đó chỉ có nút Fit trong sidebar, còn lại phải dùng chuột/scroll).

## Thiết kế
1. **HTML** (cả `public/index.html` và `index.html` gốc): bọc `<main id="myDiagramDiv">` trong `.diagram-stage` (position relative); thêm `.diagram-controls` nổi góc phải dưới gồm:
   - `nav-pad` (grid 3×3): ▲ ◀ ⌂ ▶ ▼ — pan 4 hướng + "Về Tổ" ở giữa.
   - `zoom-stack`: ＋ (phóng to), － (thu nhỏ), ⛶ (Fit toàn cảnh).
2. **JS** (`genealogy-viewer.js`):
   - Tách logic initial view thành `applyInitialView()` (scale 0.7, Tổ giữa trên) — listener `InitialLayoutCompleted` và nút ⌂ (`goToRoot`) dùng chung.
   - `zoomInDiagram()` / `zoomOutDiagram()` qua `commandHandler.increaseZoom/decreaseZoom`.
   - `panDiagram(dx, dy)`: dịch position 60% khung nhìn theo hướng.
3. **CSS**: `.dc-btn` 36px bo góc, nền trắng mờ, hover đổi màu ink; mobile thu còn 32px.
4. Bump JS `?v=14`, CSS `?v=11`; deploy; verify từng nút qua CDP.

## Check items
- [x] `node --check` pass
- [x] 8 nút hiện trong accessibility tree (Di chuyển lên/trái/phải/xuống, Về Tổ, Phóng to, Thu nhỏ, Xem toàn cảnh)
- [x] Zoom in: 0.7 → 0.735; zoom out hoạt động; pan phải dịch x 15402 → 16261; Về Tổ khôi phục đúng (scale 0.7, x 15402)
- [x] Deploy version f78bc300
