# Memory — Single Source of Truth

Thư mục ghi nhớ vận hành / bài học tái sử dụng cho `giapha_django`.

## Mục lục (mới → cũ)

| File | Tóm tắt |
|------|---------|
| [20260719_1756-descendant-branch-filter.md](./20260719_1756-descendant-branch-filter.md) | Lọc “đến đời” giữ tổ tiên; subtree hậu duệ theo người/đời; dữ liệu có Đời 13 |
| [20260719_1747-mobile-tab-order-padding.md](./20260719_1747-mobile-tab-order-padding.md) | Tab Điều khiển trước; bẫy GoJS init khi div ẩn → initialViewPending |
| [20260719_1741-mobile-pane-tabs.md](./20260719_1741-mobile-pane-tabs.md) | Mobile Worker: tab Phả đồ/Điều khiển; mặc định diagram full-screen |
| [20260719_1510-print-person-subtree-ux.md](./20260719_1510-print-person-subtree-ux.md) | UX trích nhánh hậu duệ để in: chọn người → đến đời X → preview → PDF |
| [20260719_1457-zoom-slider-collapsible-controls.md](./20260719_1457-zoom-slider-collapsible-controls.md) | Zoom bằng slider (chống double-tap mobile); panel điều khiển ẩn sau nút 🧭 |
| [20260719_1449-diagram-nav-controls.md](./20260719_1449-diagram-nav-controls.md) | Cụm nút zoom/pan/Về Tổ nổi trên diagram; overlay đặt trong .diagram-stage |
| [20260719_1444-modal-family-links.md](./20260719_1444-modal-family-links.md) | Link Thân phụ/con trong modal (event delegation); phối ngẫu chỉ là chuỗi nên giữ text |
| [20260719_1330-initial-scale-70.md](./20260719_1330-initial-scale-70.md) | Chốt scale mặc định viewer = 0.7 (theo yêu cầu người dùng) |
| [20260719_1230-initial-zoom-center-root.md](./20260719_1230-initial-zoom-center-root.md) | Initial view zoom 1:1 center node Tổ; bẫy listener zoomToFit trùng; chờ cache CF sau deploy |
| [20260719_1225-uniform-node-portrait-fix.md](./20260719_1225-uniform-node-portrait-fix.md) | Node vẽ portrait bằng shape GoJS; chiều cao node cố định 108×138; SVG phải XML sạch |
| [20260719_1212-chanh-thon-portrait.md](./20260719_1212-chanh-thon-portrait.md) | Brand Trần tộc Chanh Thôn + portrait SVG node/modal |
| [20260719_1159-tran-toc-viewer-modal.md](./20260719_1159-tran-toc-viewer-modal.md) | Đổi nhận diện Trần Tộc; hồ sơ modal; monogram, escaping và cache-bust |
| [20260718_0119-deploy-genealogy-viewer-hacmieu.md](./20260718_0119-deploy-genealogy-viewer-hacmieu.md) | Deploy production Workers vào Hacmieu@gmail.com — `*.hacmieu.workers.dev` |
| [20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md](./20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md) | Redeploy temporary Workers (claim lại); live descriptive-homburg |
| [20260717_1851-genealogy-viewer-cloudflare-drop.md](./20260717_1851-genealogy-viewer-cloudflare-drop.md) | Tách genealogy-viewer thành static Drop; snapshot JSON; Wrangler temporary live URL |
| [../.codex/memory/giapha-pdca-memory.md](../.codex/memory/giapha-pdca-memory.md) | Memory PDCA Phase 1–2 (legacy path `.codex/memory`) |

## Quy ước

- Tên file: `YYYYMMDD_HHMM-<slug>.md`
- Mỗi entry: lesson learned + quyết định tái sử dụng + link plan/report
- Cập nhật bảng trên mỗi khi thêm file mới
