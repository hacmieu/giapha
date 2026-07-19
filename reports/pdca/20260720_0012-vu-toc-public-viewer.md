# PDCA Report — Viewer công khai Vũ Tộc Làng Chuông

**Thời điểm:** 2026-07-20 00:12 (UTC+7)  
**Plan:** [../../plans/20260719_2259-vu-toc-cloudflare-foundation.md](../../plans/20260719_2259-vu-toc-cloudflare-foundation.md)  
**Report trước:** [20260720_0007-vu-toc-r2-deploy.md](./20260720_0007-vu-toc-r2-deploy.md)

## 1. Context

Sau khi deploy staging, trang public chỉ hiện landing tạm (một đoạn chữ). Chủ dữ liệu mở URL và không thấy phả đồ. Cần thay landing bằng viewer thật, đọc trực tiếp API `/api/public`, tương đương trải nghiệm Trần Tộc nhưng dùng data model Vũ Tộc.

## 2. Plan

- Viết viewer tĩnh tự chứa (HTML + CSS + JS) trong `public/`, không phụ thuộc Django.
- Dùng GoJS `TreeModel` với `fatherId` để dựng cây chính.
- Node tô màu theo `lineageRole`, có đời và dấu "đã mất".
- Panel: tìm kiếm (gồm quan hệ ngoài qua `/api/public/search`), lọc theo chi, chú giải, điều khiển zoom.
- Modal hồ sơ đọc `/api/public/people/:id`: thông tin, cha/mẹ, vợ/chồng (kèm vợ thứ), con — có link điều hướng.
- Deploy public và kiểm tra live trên trình duyệt.

## 3. Do

- Thay `public/index.html`: layout sidebar + stage, modal hồ sơ, nạp GoJS 2.3 + `viewer.js`.
- Thêm `public/css/viewer.css`: giao diện giấy cổ, màu theo vai trò, responsive < 820px.
- Thêm `public/js/viewer.js`:
  - Nạp `/api/public/tree`, dựng `go.TreeModel` (xóa `fatherId` mồ côi để tránh lỗi GoJS).
  - Template node: chấm màu + tên + "Đời N · đã mất"; dim node ngoài chi khi lọc.
  - Lọc chi bằng `setDataProperty(dim)` và cuộn tới node đầu của chi.
  - Tìm kiếm debounce 220ms gọi API, hiển thị `tree_scope`/vai trò; chọn → focus node + mở modal.
  - Modal render cha/mẹ, vợ/chồng (nhãn "vợ thứ N"), con; link `.person-link` điều hướng.
  - Điều khiển ＋ － ⤢ ⌂ (zoom in/out/fit/về Tổ).

## 4. Check

- PASS: deploy `vu-toc-lang-chuong-public` (version `31114806-…c3b4`), upload 3 asset.
- PASS: `/js/viewer.js`, `/css/viewer.css` HTTP 200.
- PASS: `/api/public/tree` → 306 node, 8 chi.
- PASS: `/api/public/people/:id` trả person + parents/children/spouses.
- PASS: `/api/public/search?q=Vũ` trả cả `external` (vợ, con gái…).
- PASS (browser): cây render dọc; màu đúng — xanh Đinh, hồng con gái, nâu con gái đóng suất Đinh; hiện đời + "đã mất".
- PASS (browser): click node mở modal "Vũ Văn Thặng · Đời 2 · Đinh" với cha (Vũ Văn Dậu) và mẹ; link điều hướng có.
- PASS (browser): sidebar 8 chi, ô tìm kiếm, chú giải, nút zoom hiển thị.

## 5. Act

Bước tiếp theo:

1. Cấu hình Cloudflare Access cho admin (team domain + AUD) rồi xây form CRUD.
2. Nhập tay `wife_order` cho 2 cặp nhiều vợ còn thiếu.
3. Cân nhắc giấy phép GoJS (bản eval hiện có watermark) hoặc thay layout thuần cho production.
4. Tùy chọn: gắn domain riêng, thêm nút quan hệ ngoài trong modal.

## 6. Changed files

- `cloudflare/vu-toc-lang-chuong/public/index.html` (viết lại thành viewer).
- `cloudflare/vu-toc-lang-chuong/public/css/viewer.css` (mới).
- `cloudflare/vu-toc-lang-chuong/public/js/viewer.js` (mới).
- README SSOT `reports/`, `memory/`.

## 7. Risks & rollback

- GoJS bản eval hiển thị watermark "Not for production" — cần giấy phép nếu công bố chính thức.
- Viewer chỉ đọc; không đụng dữ liệu nên rollback = deploy lại bản landing cũ.
- Quan hệ ngoài không nằm trong cây; chỉ truy cập qua tìm kiếm/modal (đúng thiết kế để không sai dòng chính).

## 8. Next actions

Cấu hình Cloudflare Access cho admin và xây form CRUD; xử lý giấy phép GoJS trước khi công bố rộng.
