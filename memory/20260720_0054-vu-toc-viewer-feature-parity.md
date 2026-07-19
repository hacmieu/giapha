# Memory — Clone viewer Trần Tộc → Vũ Tộc

**Thời điểm:** 2026-07-20 00:54 (UTC+7)  
**Plan:** [../plans/20260720_0054-vu-toc-viewer-feature-parity.md](../plans/20260720_0054-vu-toc-viewer-feature-parity.md)  
**Report:** [../reports/pdca/20260720_0054-vu-toc-viewer-feature-parity.md](../reports/pdca/20260720_0054-vu-toc-viewer-feature-parity.md)

## Quyết định tái sử dụng

1. Clone UX Trần Tộc (CSS + cấu trúc sidebar/modal/controls) nhưng **giữ** data contract Vũ: API `/api/public`, lọc Chi, loại `spouse` khỏi TreeModel, search gồm `external`.
2. Autocomplete Trần Tộc hỗ trợ sẵn `data.results` → gắn thẳng `/api/public/search` (minChars 2).
3. Lọc đời dùng `node.visible` + relayout (giữ tổ tiên), không chỉ dim — khớp Trần Tộc.
4. Modal dùng `<dialog>` + section Thân thế / Gia đình / Vẽ nhánh / Ghi chép; person-link điều hướng 2 chiều.
5. Panel 🧭 thu gọn: slider zoom neo tâm, d-pad pan 60% viewport, Về Tổ, Toàn cảnh.
6. Vẽ nhánh hậu duệ từ modal + banner quay full tree; khi đang xem nhánh mà search người ngoài nhánh → `showFullTree()` trước.
7. Mobile: mặc định tab **Phả đồ** (`mobile-pane-diagram`); tab Điều khiển ẩn diagram — nhớ `requestUpdate`/`initialViewPending` khi hiện lại.

## Bằng chứng

- Deploy `b08388fb-…fbc0`; browser: autocomplete, modal TỎ PHỤ (8 con + vẽ nhánh 196), panel 🧭, banner nhánh.

## Next

Access + CRUD admin; UAT mobile.
