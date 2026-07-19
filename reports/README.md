# Reports — Single Source of Truth

Báo cáo PDCA / bằng chứng Check / handover.

## Mục lục (mới → cũ)

| File | Tóm tắt |
|------|---------|
| [pdca/20260720_0109-vu-toc-view-modes-stage-reset.md](./pdca/20260720_0109-vu-toc-view-modes-stage-reset.md) | Bỏ lọc Chi; reset stage; 3 data views; graph API 397 người/629 links; deploy live |
| [pdca/20260720_0054-vu-toc-viewer-feature-parity.md](./pdca/20260720_0054-vu-toc-viewer-feature-parity.md) | Clone UX Trần Tộc → Vũ Tộc: autocomplete, 🧭/slider/d-pad, modal dialog+vẽ nhánh, export; deploy live |
| [pdca/20260720_0040-vu-toc-root-unify.md](./pdca/20260720_0040-vu-toc-root-unify.md) | Nối 8 chi về Thủy Tổ TỎ PHỤ/TỔ MẪU: sửa luật main=có chi+tổ tiên; vá D1 live; main 306→318 |
| [pdca/20260720_0012-vu-toc-public-viewer.md](./pdca/20260720_0012-vu-toc-public-viewer.md) | Viewer công khai GoJS đọc /api/public: cây 306, màu theo vai trò, tìm kiếm, lọc chi, modal hồ sơ; deploy live |
| [pdca/20260720_0007-vu-toc-r2-deploy.md](./pdca/20260720_0007-vu-toc-r2-deploy.md) | Staging live: public tree 306 + R2 media; admin API 401 không JWT; Access/UI viewer còn mở |
| [pdca/20260719_2259-vu-toc-cloudflare-foundation.md](./pdca/20260719_2259-vu-toc-cloudflare-foundation.md) | D1 remote Hacmieu 397/306/91; foundation Worker/CRUD trước bước R2 deploy |
| [pdca/20260719_2247-vu-toc-cloudflare-separation.md](./pdca/20260719_2247-vu-toc-cloudflare-separation.md) | PDCA thiết kế Vũ Tộc Cloudflare: khả thi; bổ sung isolation/draft/GoJS risks từ architecture map |
| [pdca/20260719_1909-daily-work-consolidation.md](./pdca/20260719_1909-daily-work-consolidation.md) | Báo cáo ngày 19/07: timeline 13 vòng, checks, risks, handover và việc tiếp theo |
| [pdca/20260719_1812-branch-search-focus-fix.md](./pdca/20260719_1812-branch-search-focus-fix.md) | PDCA done: fix search khi xem nhánh (focusPersonOnDiagram); deploy ed9f076e |
| [pdca/20260719_1756-descendant-branch-filter.md](./pdca/20260719_1756-descendant-branch-filter.md) | PDCA done: lọc đến đời + subtree hậu duệ tùy chọn; deploy 075f9bea |
| [pdca/20260719_1747-mobile-tab-order-padding.md](./pdca/20260719_1747-mobile-tab-order-padding.md) | PDCA done: Điều khiển mặc định, padding phả đồ, fix init khi ẩn; deploy aecde8c7 |
| [pdca/20260719_1741-mobile-pane-tabs.md](./pdca/20260719_1741-mobile-pane-tabs.md) | PDCA done: mobile tab Phả đồ/Điều khiển, diagram 726px full; deploy 5841ad04 |
| [pdca/20260719_1510-print-person-subtree-ux.md](./pdca/20260719_1510-print-person-subtree-ux.md) | PDCA design: trích subtree theo người/đời, preview in/PDF; chưa triển khai |
| [pdca/20260719_1457-zoom-slider-collapsible-controls.md](./pdca/20260719_1457-zoom-slider-collapsible-controls.md) | PDCA done: slider zoom neo tâm + panel toggle 🧭; deploy 866d31ad |
| [pdca/20260719_1449-diagram-nav-controls.md](./pdca/20260719_1449-diagram-nav-controls.md) | PDCA done: d-pad pan + zoom + Về Tổ trên diagram; deploy f78bc300 |
| [pdca/20260719_1444-modal-family-links.md](./pdca/20260719_1444-modal-family-links.md) | PDCA done: modal link cha↔con điều hướng 2 chiều; deploy 083b339a |
| [pdca/20260719_1330-initial-scale-70.md](./pdca/20260719_1330-initial-scale-70.md) | PDCA done: scale mặc định 0.7; deploy 7087d98c |
| [pdca/20260719_1230-initial-zoom-center-root.md](./pdca/20260719_1230-initial-zoom-center-root.md) | PDCA done: load zoom 1:1 center Tổ, gỡ zoomToFit ghi đè; deploy e4eb0a83 |
| [pdca/20260719_1225-uniform-node-portrait-fix.md](./pdca/20260719_1225-uniform-node-portrait-fix.md) | PDCA done: fix SVG hỏng, silhouette shape GoJS, node cao đồng đều; deploy 94cc4222 |
| [pdca/20260719_1212-chanh-thon-portrait.md](./pdca/20260719_1212-chanh-thon-portrait.md) | PDCA done: Trần tộc Chanh Thôn + portrait; deploy Hacmieu |
| [pdca/20260719_1159-tran-toc-viewer-modal.md](./pdca/20260719_1159-tran-toc-viewer-modal.md) | PDCA done: Trần Tộc UI, hồ sơ modal, browser check và deploy Hacmieu |
| [20260718_0119-deploy-genealogy-viewer-hacmieu.md](./20260718_0119-deploy-genealogy-viewer-hacmieu.md) | Deploy done trên Hacmieu — https://giapha-genealogy-viewer.hacmieu.workers.dev |
| [20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md](./20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md) | Redeploy done + claim URL mới (Descriptive Homburg) |
| [20260717_1851-genealogy-viewer-cloudflare-drop.md](./20260717_1851-genealogy-viewer-cloudflare-drop.md) | PDCA done: static Drop package + live Workers temporary URL |
| [pdca/2026-03-29-phase1-2-kickoff.md](./pdca/2026-03-29-phase1-2-kickoff.md) | Kickoff quy trình PDCA Phase 1–2 |
| [templates/pdca-report-template.md](./templates/pdca-report-template.md) | Template report PDCA |
| [templates/handover-template.md](./templates/handover-template.md) | Template handover |

## Quy ước

- Tên file mới: `YYYYMMDD_HHMM-<slug>.md` (ở root `reports/` hoặc `reports/pdca/`)
- Bắt buộc có đủ mục: Context, Plan, Do, Check, Act, Changed files, Risks, Next actions
- Cập nhật bảng trên mỗi khi thêm report
