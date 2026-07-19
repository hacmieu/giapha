# PDCA: Nút phóng to / thu nhỏ / điều hướng trên phả đồ

- **Thời gian:** 2026-07-19 14:49
- **Trạng thái:** done
- **Plan:** `plans/20260719_1449-diagram-nav-controls.md`
- **Memory:** `memory/20260719_1449-diagram-nav-controls.md`

## Plan
Yêu cầu: phải có nút phóng to, thu nhỏ và điều hướng trên viewer.

## Do
1. Bọc diagram trong `.diagram-stage`, thêm cụm `.diagram-controls` nổi góc phải dưới: d-pad ▲◀⌂▶▼ (pan 4 hướng + Về Tổ) và cột ＋/－/⛶ (phóng to / thu nhỏ / fit toàn cảnh). Sửa đồng bộ cả 2 index.html.
2. JS: tách `applyInitialView()` dùng chung cho listener load và nút Về Tổ; thêm `zoomInDiagram/zoomOutDiagram` (commandHandler) và `panDiagram(dx,dy)` bước 60% viewport.
3. CSS: nút 36px nền trắng mờ + shadow, hover màu ink; mobile 32px, đủ aria-label/title.
4. Bump JS `?v=14`, CSS `?v=11`; deploy → version `f78bc300`.

## Check
- Accessibility tree trên live có đủ 8 nút.
- CDP test: zoom in 0.7→0.735; zoom out về 0.667; pan phải dịch position.x 15402→16261; Về Tổ khôi phục đúng scale 0.7 / x 15402.
- Screenshot xác nhận cụm nút góc phải dưới, không che node.

## Act
- Ghi memory: overlay đặt trong `.diagram-stage`, API điều khiển global, nhớ sửa 2 index.html đồng bộ.
- Gợi ý sau: có thể thêm phím tắt (+/−/mũi tên) map vào cùng các hàm này.
