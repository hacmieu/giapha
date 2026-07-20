# Plans — Single Source of Truth

Kế hoạch PDCA (Plan) trước khi triển khai.

## Mục lục (mới → cũ)

| File | Tóm tắt |
|------|---------|
| [20260720_1521-vu-toc-admin-phase-ab.md](./20260720_1521-vu-toc-admin-phase-ab.md) | Admin Phase A/B: sửa scope, API list, UI CRUD MVP, Access checklist/deploy |
| [20260720_1518-vu-toc-remaining-and-admin.md](./20260720_1518-vu-toc-remaining-and-admin.md) | Backlog P0–P2; Admin = Access + UI forms trên Worker (không Django); Phase A→D |
| [20260720_0143-vu-toc-wife-right-of-husband.md](./20260720_0143-vu-toc-wife-right-of-husband.md) | Ép GridLayout ô gia đình: chồng trái, vợ phải theo familySlot/wifeOrder |
| [20260720_0131-vu-toc-django-family-group.md](./20260720_0131-vu-toc-django-family-group.md) | Port gom vợ–chồng kiểu Django (`fam_<chồng>` + groupTemplate) sang view Gia đình mở rộng |
| [20260720_0109-vu-toc-view-modes-stage-reset.md](./20260720_0109-vu-toc-view-modes-stage-reset.md) | Reset stage khi dùng sidebar; bỏ lọc Chi; thêm Dòng chính / Gia đình mở rộng / Quan hệ khác |
| [20260720_0054-vu-toc-viewer-feature-parity.md](./20260720_0054-vu-toc-viewer-feature-parity.md) | Clone UX Trần Tộc → Vũ Tộc: sidebar, controls 🧭, modal dialog, vẽ nhánh, autocomplete, export |
| [20260720_0007-vu-toc-r2-deploy.md](./20260720_0007-vu-toc-r2-deploy.md) | Done: R2 + deploy staging public/admin Hacmieu; live tree 306, media OK, admin JWT fail-closed |
| [20260719_2259-vu-toc-cloudflare-foundation.md](./20260719_2259-vu-toc-cloudflare-foundation.md) | Nền D1 schema/export/Worker CRUD; D1 remote seed 397; R2 sau đó mở ở 0007 |
| [20260719_2247-vu-toc-cloudflare-separation.md](./20260719_2247-vu-toc-cloudflare-separation.md) | Phương án tách Vũ Tộc Cloudflare CRUD: UX Trần Tộc, schema riêng, phân loại 91 người không chi, import staging |
| [20260719_1909-daily-work-consolidation.md](./20260719_1909-daily-work-consolidation.md) | Kế hoạch tổng hợp/handover toàn bộ 13 vòng công việc ngày 19/07 |
| [20260719_1812-branch-search-focus-fix.md](./20260719_1812-branch-search-focus-fix.md) | Fix: tìm người mới khi đang xem nhánh thì phả đồ không đổi |
| [20260719_1756-descendant-branch-filter.md](./20260719_1756-descendant-branch-filter.md) | Sửa lọc đời và vẽ nhánh hậu duệ đến đời tùy chọn |
| [20260719_1747-mobile-tab-order-padding.md](./20260719_1747-mobile-tab-order-padding.md) | Tab Điều khiển trước + padding vùng phả đồ mobile |
| [20260719_1741-mobile-pane-tabs.md](./20260719_1741-mobile-pane-tabs.md) | Tách sidebar mobile thành tab Phả đồ / Điều khiển |
| [20260719_1510-print-person-subtree-ux.md](./20260719_1510-print-person-subtree-ux.md) | Thiết kế tab Trích nhánh & In, chọn người gốc và đời cuối |
| [20260719_1457-zoom-slider-collapsible-controls.md](./20260719_1457-zoom-slider-collapsible-controls.md) | Thanh trượt zoom + bảng điều khiển thu gọn dạng tab |
| [20260719_1449-diagram-nav-controls.md](./20260719_1449-diagram-nav-controls.md) | Nút phóng to / thu nhỏ / điều hướng trên phả đồ |
| [20260719_1444-modal-family-links.md](./20260719_1444-modal-family-links.md) | Link điều hướng Thân phụ / con trong modal hồ sơ |
| [20260719_1330-initial-scale-70.md](./20260719_1330-initial-scale-70.md) | Đổi scale mặc định khi load xuống 70% |
| [20260719_1230-initial-zoom-center-root.md](./20260719_1230-initial-zoom-center-root.md) | Load mặc định zoom 1:1, căn giữa node Tổ |
| [20260719_1225-uniform-node-portrait-fix.md](./20260719_1225-uniform-node-portrait-fix.md) | Sửa portrait không hiển thị; node cao đồng đều |
| [20260719_1212-chanh-thon-portrait.md](./20260719_1212-chanh-thon-portrait.md) | Đổi địa danh Chanh Thôn / Ninh Bình; thêm portrait SVG |
| [20260719_1159-tran-toc-viewer-modal.md](./20260719_1159-tran-toc-viewer-modal.md) | Đổi Vũ Tộc → Trần Tộc; chuyển hồ sơ sidebar sang modal; áp dụng UX gia phả hiện đại |
| [20260718_0119-deploy-genealogy-viewer-hacmieu.md](./20260718_0119-deploy-genealogy-viewer-hacmieu.md) | Deploy vào account Hacmieu (không temporary) — done |
| [20260718_0109-deploy-genealogy-viewer-hacmieu-account.md](./20260718_0109-deploy-genealogy-viewer-hacmieu-account.md) | Plan chờ auth (superseded bởi 0119) |
| [20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md](./20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md) | Redeploy Drop/Workers vì miss claim lần trước |
| [20260717_1851-genealogy-viewer-cloudflare-drop.md](./20260717_1851-genealogy-viewer-cloudflare-drop.md) | Plan tách module genealogy-viewer → Cloudflare Drop (static HTML/JS/JSON) |

## Quy ước

- Tên file: `YYYYMMDD_HHMM-<slug>.md`
- Mỗi plan: mục tiêu, scope, rủi ro, file ảnh hưởng, rollback, checklist Do
- Sau khi xong: cập nhật status + link report/memory trong bảng trên
