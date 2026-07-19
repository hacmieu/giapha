# Memory — Trần tộc Chanh Thôn + portrait

**Date:** 2026-07-19 12:12  
**Plan:** [plans/20260719_1212-chanh-thon-portrait.md](../plans/20260719_1212-chanh-thon-portrait.md)  
**Report:** [reports/pdca/20260719_1212-chanh-thon-portrait.md](../reports/pdca/20260719_1212-chanh-thon-portrait.md)

## Quyết định

1. Nhận diện chính thức của viewer: **Trần tộc Chanh Thôn**.
2. Địa danh hiển thị: **Chanh Thôn - Ninh Bình (Hà Nam cũ)** (khớp dữ liệu location “Chanh Thôn” trong snapshot).
3. Portrait: dùng SVG local (`portrait-dinh.svg` / `portrait-spouse.svg`) cho node + modal khi chưa có ảnh thật.
4. Khi snapshot/API có `photo`, modal ưu tiên URL thật; node vẫn dùng portrait mặc định cho đồng đều.
5. `GIAPHA_ASSET_BASE` tách đường dẫn asset cho entry root vs `public/`.

## Live

https://giapha-genealogy-viewer.hacmieu.workers.dev
