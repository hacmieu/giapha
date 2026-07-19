# PDCA — Báo cáo tổng kết ngày 2026-07-19

- **Thời gian tổng kết:** 2026-07-19 19:09 (UTC+7)
- **Phạm vi:** `drop/genealogy-viewer`
- **Production:** <https://giapha-genealogy-viewer.hacmieu.workers.dev>
- **Kết quả:** 13 vòng PDCA/tài liệu, 12 hạng mục đã triển khai, 1 hạng mục thiết kế

## Context

Ngày 2026-07-19 tập trung chuyển Genealogy Viewer từ bản static cơ bản thành một
viewer gia phả Trần tộc Chanh Thôn có hồ sơ modal, portrait, điều khiển phả đồ,
trải nghiệm mobile tách pane và khả năng vẽ nhánh hậu duệ. Công việc được triển
khai liên tục qua 13 commit và mỗi chặng đều có plan, memory, report riêng.

## Plan

Kế hoạch tổng hợp: [plans/20260719_1909-daily-work-consolidation.md](../../plans/20260719_1909-daily-work-consolidation.md).

- Đọc ba README SSOT.
- Đối chiếu 13 plan, 13 report, 13 memory và 13 commit trong ngày.
- Ghi lại timeline, bằng chứng, rủi ro, trạng thái chưa làm và handover.
- Không chạm vào hai thay đổi chưa commit ngoài phạm vi viewer.

## Do — Toàn bộ công việc trong ngày

### 1. Nhận diện và hồ sơ thành viên (11:59–12:25)

1. [Trần Tộc viewer và modal](./20260719_1159-tran-toc-viewer-modal.md)
   - Đổi nhận diện Vũ Tộc → Trần Tộc.
   - Thay chi tiết sidebar bằng native `<dialog>` responsive.
   - Escape dữ liệu hồ sơ; đóng bằng ×, backdrop, Escape và trả focus.
   - Gom nguồn deploy vào `public/`; dữ liệu 547 node/546 link.
   - Deploy `f8af8841-cbfd-4195-b367-8290166cb603`.
2. [Chanh Thôn và portrait](./20260719_1212-chanh-thon-portrait.md)
   - Chốt brand “Trần tộc Chanh Thôn — Ninh Bình (Hà Nam cũ)”.
   - Thêm portrait SVG cho node/modal, hỗ trợ `data.photo`.
   - Deploy `ba79cdf2-88da-47be-9162-2e22df4bd98a`.
3. [Sửa portrait và đồng đều node](./20260719_1225-uniform-node-portrait-fix.md)
   - Sửa SVG XML lỗi.
   - Dùng silhouette shape GoJS cho node; cố định panel `108×138`, tên hai dòng,
     giữ chỗ năm sinh.
   - Deploy cuối chặng `94cc4222`.

### 2. Initial view và điều hướng hồ sơ (12:30–14:44)

4. [Zoom 1:1 và center Tổ](./20260719_1230-initial-zoom-center-root.md)
   - Gỡ `initialAutoScale`/`zoomToFit` ghi đè.
   - Căn node Tổ giữa ngang, cách mép trên 24px.
   - Deploy cuối chặng `e4eb0a83`.
5. [Scale mặc định 70%](./20260719_1330-initial-scale-70.md)
   - Điều chỉnh initial scale từ `1` xuống `0.7`.
   - Deploy `7087d98c`.
6. [Link Thân phụ và con](./20260719_1444-modal-family-links.md)
   - Link cha/con hai chiều bằng event delegation.
   - Phối ngẫu vẫn là text vì snapshot chưa có node tương ứng.
   - Deploy `083b339a`.

### 3. Điều khiển phả đồ và UX in (14:49–15:10)

7. [Nút zoom/pan/Về Tổ](./20260719_1449-diagram-nav-controls.md)
   - Thêm d-pad, zoom, Fit và Về Tổ trên diagram.
   - Deploy `f78bc300`.
8. [Zoom slider và panel thu gọn](./20260719_1457-zoom-slider-collapsible-controls.md)
   - Thay ± bằng slider để tránh double-tap zoom trên mobile.
   - Panel điều khiển mặc định ẩn sau nút 🧭; zoom neo tâm.
   - Deploy `866d31ad`.
9. [Thiết kế trích nhánh và in](./20260719_1510-print-person-subtree-ux.md)
   - Thiết kế luồng chọn người → đời cuối → preview → in/PDF.
   - Đề xuất A4 ≤25 người, A3 26–60, >60 chia nhánh hoặc giảm đời.
   - **Chưa triển khai code/print test.**

### 4. Mobile và nhánh hậu duệ (17:41–18:17)

10. [Tab mobile Phả đồ/Điều khiển](./20260719_1741-mobile-pane-tabs.md)
    - Xác nhận Worker đã có asset mới nhưng UX mobile vẫn cùng lúc hiện sidebar + diagram.
    - Tách hai pane bằng tab; diagram từ 490px lên 726px ở viewport 390px.
    - Deploy `5841ad04`.
11. [Điều khiển trước + padding](./20260719_1747-mobile-tab-order-padding.md)
    - Đặt Điều khiển là tab mặc định; thêm padding vùng phả đồ.
    - Thêm `initialViewPending` xử lý GoJS khi div ban đầu `display:none`.
    - Deploy `aecde8c7`.
12. [Lọc đời và vẽ nhánh hậu duệ](./20260719_1756-descendant-branch-filter.md)
    - “Xem Đến Đời” giữ mọi thế hệ trước để không đứt quan hệ.
    - Vẽ subtree từ người được chọn đến đời cuối tùy chọn, mặc định mọi hậu duệ.
    - Banner nhánh + nút khôi phục toàn cây.
    - Stats/dropdown lấy từ dữ liệu thật; phát hiện Đời 13 có 211 người.
    - Deploy `075f9bea-f92e-43f7-87c0-c0302c3b4637`.
13. [Fix tìm người khi đang xem nhánh](./20260719_1812-branch-search-focus-fix.md)
    - Thêm `focusPersonOnDiagram`: người ngoài model nhánh sẽ tự khôi phục full tree,
      rồi select/scroll/mở modal.
    - Áp dụng cho autocomplete, legacy search và link cha/con.
    - Bản production cuối ngày: JS `?v=20`, Worker
      `ed9f076e-c26e-483b-b3c5-dfef50082272`.

## Check

### Bằng chứng đã pass trong ngày

- 13 commit từ `7cace8d` đến `2394a73` đã có trên `origin/deploy-to-hadeovh`.
- JavaScript syntax (`node --check`) pass ở các vòng thay đổi JS.
- Dữ liệu: 547 người, 546 quan hệ, Đời 4–13.
- Browser/CDP đã kiểm tra:
  - modal, Escape, links cha/con;
  - portrait và chiều cao node;
  - initial scale `0.7`, center Tổ;
  - slider, pan, Fit, Về Tổ;
  - mobile viewport 390px và hai tab;
  - filter đến Đời 10: 116 node hiện, không orphan;
  - nhánh Trần Văn Lư: 32 người; giới hạn Đời 11: 5 người;
  - chuyển từ nhánh cũ sang người ngoài nhánh rồi vẽ nhánh mới: pass.
- Production cuối ngày đã phục vụ `genealogy-viewer.js?v=20`.

### Chưa chạy / chưa hoàn thành

- Chưa triển khai preview/in A4/A3 hoặc `window.print()` cho kế hoạch 15:10.
- Chưa nhập ảnh chân dung thật.
- Chưa có node/ID riêng cho phối ngẫu nên chưa link được vợ/chồng.
- GoJS vẫn là evaluation build và còn watermark.

### Git diff tại thời điểm tổng kết

Có hai thay đổi chưa commit, ngoài phạm vi viewer:

- `api/views.py`: thêm prefetch và payload `wife_relations`.
- `templates/core/relationships.html`: thay đổi lớn về layout/legend/logic sơ đồ quan hệ.

Hai file này **không được stage hoặc commit** trong vòng tổng kết này.

## Changed files trong chuỗi viewer

- `drop/genealogy-viewer/index.html`
- `drop/genealogy-viewer/public/index.html`
- `drop/genealogy-viewer/public/css/viewer.css`
- `drop/genealogy-viewer/public/js/genealogy-viewer.js`
- `drop/genealogy-viewer/public/img/portrait-dinh.svg`
- `drop/genealogy-viewer/public/img/portrait-spouse.svg`
- `drop/genealogy-viewer/README.md`
- Bộ plan/memory/report và ba README SSOT.

Không có thay đổi schema, database migration hay API trong chuỗi viewer.

## Risks

1. Cây toàn bộ rất rộng; người dùng cần Fit/Về Tổ hoặc trích nhánh.
2. `generation` phải nhất quán với quan hệ cha-con; traversal giới hạn theo giá trị này.
3. Portrait hiện là placeholder, không phải tư liệu lịch sử.
4. Browser/Cloudflare cache có thể giữ HTML cũ sau deploy; tiếp tục cache-bust asset.
5. Hai index (`index.html` và `public/index.html`) phải được giữ đồng bộ.
6. GoJS trong container ẩn phải trì hoãn initial view đến khi viewport có kích thước.

## Act / Handover

### Quyết định tái sử dụng

- Mọi luồng nhảy đến người dùng `focusPersonOnDiagram`.
- Filter tree dùng `generation <= X`, không dùng exact generation.
- Stats và option đời lấy từ node data thật.
- Mobile dùng hai pane, không nhồi sidebar và phả đồ cùng màn hình.
- Node dùng GoJS native shape làm fallback; ảnh thật chỉ là lớp nâng cấp.
- Điều khiển nổi phải thu gọn; zoom mobile ưu tiên slider.

### Thứ tự đề xuất cho vòng tiếp theo

1. Triển khai MVP “Trích nhánh & In” dựa trên subtree đã có.
2. Thử print thực tế A4/A3 với nhánh 5, 25, 60 và >60 người.
3. Bổ sung `photo`, spouse node/ID và nguồn tư liệu trong pipeline export.
4. Xử lý license/build GoJS production để bỏ watermark.
5. Review và kiểm thử riêng hai thay đổi chưa commit ở API/relationships trước khi commit.

### Rollback

- Runtime: dùng nút “Xem toàn bộ phả đồ” để thoát subtree.
- Deployment: Wrangler rollback về version trước.
- Source: revert commit theo từng vòng; không có migration cần đảo.
