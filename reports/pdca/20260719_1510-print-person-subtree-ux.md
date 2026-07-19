# PDCA: Thiết kế UX trích nhánh phả đồ để in

- **Thời gian:** 2026-07-19 15:10
- **Trạng thái:** design-done, chưa triển khai
- **Plan:** `plans/20260719_1510-print-person-subtree-ux.md`
- **Memory:** `memory/20260719_1510-print-person-subtree-ux.md`

## Plan

Thiết kế trải nghiệm cho khách chọn một người, lấy toàn bộ hậu duệ đến đời X do họ chọn, xem trước và in riêng đoạn cây đó. Mục tiêu phụ: không làm màn hình viewer hiện tại nặng và khó dùng hơn.

## Do

1. Đọc cấu trúc UI hiện tại: sidebar đang chứa chọn gia phả, tìm kiếm, lọc thế hệ, chế độ xem và export; diagram có panel điều khiển thu gọn.
2. Xác nhận dữ liệu static có `key`, `fatherId`, `generation`, đủ để tạo subtree trong browser.
3. Xác nhận export hiện tại chỉ tạo PNG từ toàn diagram; chưa có print layout hoặc subtree.
4. Thiết kế chế độ riêng `Trích nhánh & In` với 3 bước:
   - chọn người gốc;
   - chọn đời cuối hợp lệ;
   - preview trang giấy và in/PDF.
5. Đề xuất đường tắt từ modal hồ sơ và quy tắc chia trang/khổ giấy để bảo đảm đọc được.

## Check

### Passed

- Luồng có một mục tiêu rõ ràng và không nhồi thêm điều khiển vào sidebar.
- Hoạt động trên dữ liệu hiện tại, không cần schema/API/migration.
- Có xử lý người trùng tên, đời không hợp lệ, cây quá rộng và node thiếu quan hệ.
- Có chiến lược desktop/mobile: mobile chuyển hẳn sang workspace in.
- Có giới hạn in: A4 ≤25 người, A3 26–60, >60 chia nhánh hoặc giảm đời.

### Not run

- Chưa viết code subtree traversal.
- Chưa dựng preview hoặc thử print A4/A3.
- Chưa kiểm thử browser/mobile vì đây là vòng thiết kế.

## Act

### Quyết định

Đề xuất triển khai MVP trước:
1. Tab `Xem phả đồ | Trích nhánh & In`.
2. Chọn người + đến đời.
3. Preview một trang.
4. `window.print()` / Save as PDF với `@media print`.

Chỉ thêm chia nhiều trang theo nhánh sau khi đo cây thực tế >60 node.

### Affected files dự kiến

- `drop/genealogy-viewer/public/index.html`
- `drop/genealogy-viewer/index.html`
- `drop/genealogy-viewer/public/js/genealogy-viewer.js`
- `drop/genealogy-viewer/public/css/viewer.css`
- Tuỳ độ dài: `drop/genealogy-viewer/public/js/subtree-print.js`

### Migration / API / rollback

- Migration: không.
- API: không.
- Rollback: gỡ tab/workspace in; viewer và dữ liệu cũ không đổi.

### Handover

Kế hoạch chi tiết và wireframe nằm tại `plans/20260719_1510-print-person-subtree-ux.md`. Khi người dùng duyệt hướng này, vòng PDCA tiếp theo sẽ triển khai MVP và kiểm thử bản in thật.
