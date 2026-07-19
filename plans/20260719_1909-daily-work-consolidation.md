# Plan — Tổng kết ngày 2026-07-19: Genealogy Viewer

- **Thời gian:** 2026-07-19 19:09 (UTC+7)
- **Phạm vi:** Toàn bộ kế hoạch, triển khai, kiểm chứng và handover của ngày 2026-07-19
- **Module chính:** `drop/genealogy-viewer`
- **Trạng thái:** Hoàn thành tổng hợp

## Mục tiêu

1. Đối chiếu `memory/README.md`, toàn bộ plan/report ngày 2026-07-19 và lịch sử Git.
2. Gộp 13 vòng công việc trong ngày thành một tài liệu bàn giao có thứ tự thời gian.
3. Phân biệt rõ hạng mục đã triển khai với hạng mục mới dừng ở thiết kế.
4. Ghi nhận thay đổi chưa commit ngoài phạm vi để tránh đưa nhầm vào commit tổng kết.
5. Cập nhật ba README SSOT và chỉ commit các tài liệu tổng kết.

## Nguồn đối chiếu

- 13 plan: `plans/20260719_*.md`
- 13 memory: `memory/20260719_*.md`
- 13 report: `reports/pdca/20260719_*.md`
- 13 commit từ `7cace8d` đến `2394a73`
- Git diff hiện tại
- Worker production: <https://giapha-genealogy-viewer.hacmieu.workers.dev>

## Danh mục kế hoạch trong ngày

| Giờ | Kế hoạch | Trạng thái |
|---|---|---|
| 11:59 | [Trần Tộc viewer + modal](./20260719_1159-tran-toc-viewer-modal.md) | Đã triển khai |
| 12:12 | [Chanh Thôn + portrait](./20260719_1212-chanh-thon-portrait.md) | Đã triển khai |
| 12:25 | [Sửa portrait và chiều cao node](./20260719_1225-uniform-node-portrait-fix.md) | Đã triển khai |
| 12:30 | [Zoom 1:1, center Tổ](./20260719_1230-initial-zoom-center-root.md) | Đã triển khai |
| 13:30 | [Scale mặc định 70%](./20260719_1330-initial-scale-70.md) | Đã triển khai |
| 14:44 | [Link Thân phụ/con trong modal](./20260719_1444-modal-family-links.md) | Đã triển khai |
| 14:49 | [Điều khiển zoom/pan](./20260719_1449-diagram-nav-controls.md) | Đã triển khai |
| 14:57 | [Zoom slider + panel thu gọn](./20260719_1457-zoom-slider-collapsible-controls.md) | Đã triển khai |
| 15:10 | [UX trích nhánh và in](./20260719_1510-print-person-subtree-ux.md) | Thiết kế xong, chưa code |
| 17:41 | [Tab mobile Phả đồ/Điều khiển](./20260719_1741-mobile-pane-tabs.md) | Đã triển khai |
| 17:47 | [Thứ tự tab + padding mobile](./20260719_1747-mobile-tab-order-padding.md) | Đã triển khai |
| 17:56 | [Lọc đời + nhánh hậu duệ](./20260719_1756-descendant-branch-filter.md) | Đã triển khai |
| 18:12 | [Fix tìm kiếm khi xem nhánh](./20260719_1812-branch-search-focus-fix.md) | Đã triển khai |

## Cách thực hiện tổng kết

1. Lập timeline theo report và commit.
2. Ghi rõ đầu ra, bằng chứng kiểm chứng và phiên bản deploy cuối từng chặng.
3. Tổng hợp file ảnh hưởng, giới hạn, rủi ro và rollback.
4. Đề xuất thứ tự việc tiếp theo:
   - MVP trích nhánh/in PDF;
   - ảnh thật và dữ liệu phối ngẫu có node;
   - xử lý GoJS evaluation/watermark;
   - kiểm tra dữ liệu metadata thế hệ.
5. Tạo:
   - `reports/pdca/20260719_1909-daily-work-consolidation.md`;
   - `memory/20260719_1909-daily-work-consolidation.md`;
   - cập nhật README SSOT.

## Rủi ro và giới hạn

- Đây là vòng tài liệu/handover; không thay đổi runtime, schema, API hay migration.
- Hai file đang có thay đổi chưa commit là `api/views.py` và
  `templates/core/relationships.html`; chúng thuộc luồng khác, không được stage trong commit tổng kết.
- Kết quả kiểm chứng runtime được kế thừa từ từng report đã ghi trong ngày; vòng tổng kết
  chỉ kiểm tra tính đầy đủ của tài liệu, lịch sử commit và trạng thái Git.

## Rollback

- Revert riêng commit tài liệu tổng kết.
- Không ảnh hưởng Worker đang chạy hoặc dữ liệu gia phả.
