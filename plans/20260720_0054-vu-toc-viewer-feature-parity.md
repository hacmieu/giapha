# Plan — Clone viewer Trần Tộc → Vũ Tộc Làng Chuông

**Thời điểm:** 2026-07-20 00:54 (UTC+7)  
**Mục tiêu:** Đưa trải nghiệm viewer Vũ Tộc ngang tầm Trần Tộc Chanh Thôn (sidebar → diagram controls → modal), giữ data contract Vũ Tộc (`/api/public`, chi, quan hệ ngoài).

## Audit gap (Trần Tộc có / Vũ Tộc thiếu hoặc yếu)

| Nhóm | Trần Tộc | Vũ Tộc hiện tại | Hành động |
|------|----------|-----------------|-----------|
| Stats sidebar | Người / quan hệ / khoảng đời | Người / chi / ghi chú ngoài | Clone đầy đủ + giữ lọc Chi |
| Tìm kiếm | Autocomplete diacritic, clear, keyboard | Dropdown API thô | Port `autocomplete-search.js` + API |
| Lọc đời | `visible` + relayout (không đứt cha–con) | Dim opacity | Clone `filterByGeneration` |
| Chế độ | Tree / Force | Không | Clone Tree + Force |
| Export | Ảnh PNG + JSON | Không | Clone |
| Diagram controls | Toggle 🧭, slider zoom, d-pad pan, Fit | 4 nút đơn giản | Clone panel Trần Tộc |
| Banner nhánh | Vẽ nhánh hậu duệ + quay full | Không | Clone từ modal |
| Modal | `<dialog>`, portrait+monogram, Thân thế/Gia đình/Vẽ nhánh/Ghi chép, link điều hướng | Modal đơn giản | Clone layout + API person |
| Tooltip node | Có | Không | Clone |
| Mobile tabs | Điều khiển / Phả đồ, default diagram | Có nhưng default controls | Clone đúng Trần Tộc |
| Footer | Có | Không | Thêm |
| Chọn gia phả | 1 option | Không cần | Bỏ (1 họ) |

## Scope Do

- Viết lại `public/index.html`, `css/viewer.css`, `js/viewer.js`.
- Port `js/autocomplete-search.js`.
- Giữ: lọc theo Chi, API `/api/public/*`, màu đời Vũ (0+), loại spouse khỏi TreeModel.
- Không đụng admin CRUD / Access trong vòng này.

## Check

- Deploy public; browser: load Tổ, search, modal links, vẽ nhánh, Fit, slider, mobile tab.
- API tree/search/person vẫn 200.

## Risks

- Force layout chậm với ~200 node máu — chấp nhận như Trần Tộc.
- GoJS eval watermark vẫn còn (dùng nội bộ gia tộc).
- Export JSON là snapshot tree API (main), không gồm toàn bộ external.

## Rollback

Redeploy bản asset trước (version Worker cũ) hoặc `git checkout` các file `public/`.
