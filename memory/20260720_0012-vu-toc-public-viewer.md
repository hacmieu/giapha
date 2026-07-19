# Memory — Viewer công khai Vũ Tộc Làng Chuông

**Thời điểm:** 2026-07-20 00:12 (UTC+7)  
**Report:** [../reports/pdca/20260720_0012-vu-toc-public-viewer.md](../reports/pdca/20260720_0012-vu-toc-public-viewer.md)

## Quyết định tái sử dụng

1. Viewer là asset tĩnh trong `public/` của Worker (`index.html` + `css/viewer.css` + `js/viewer.js`), gọi trực tiếp `/api/public`. Không port nguyên viewer Trần Tộc (schema JSON tĩnh khác); viết mới bám API mới gọn hơn.
2. GoJS dựng cây bằng `TreeModel` với `nodeParentKeyProperty="fatherId"`. Bắt buộc `delete` `fatherId` khi cha không nằm trong tập node công khai — GoJS không chấp nhận `null`/khóa mồ côi.
3. Chỉ cây chính (`main`) vào diagram; quan hệ ngoài (`external`) chỉ truy cập qua tìm kiếm + modal để không làm sai dòng chính.
4. Màu node theo `lineageRole`: Đinh xanh, con gái hồng, con gái đóng suất Đinh nâu, dâu/rể xanh lục.
5. Route hồ sơ là `/api/public/people/:id` (không phải `/person/`) — khớp `routeParameter` trong `src/index.ts`.
6. Lọc chi làm bằng dim (`opacity`) qua `setDataProperty`, giữ nguyên cây thay vì rebuild model.
7. GoJS bản CDN eval hiển thị watermark "Not for production" → cần giấy phép trước khi công bố chính thức.

## Bằng chứng

- Deploy public version `31114806-c7db-4646-9d19-31d58004c3b4`.
- Live: assets 200, tree 306/8, person + search (gồm external) OK.
- Browser: cây render, màu vai trò đúng, click node mở modal cha/mẹ/con/vợ có link điều hướng.

## Next

Cấu hình Cloudflare Access cho admin + form CRUD; nhập `wife_order` 2 cặp còn thiếu; xử lý giấy phép GoJS.
