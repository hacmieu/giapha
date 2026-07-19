# Memory: Portrait node GoJS + chiều cao node đồng đều

- **Thời gian:** 2026-07-19 12:25
- **Phạm vi:** `drop/genealogy-viewer/`

## Ghi nhớ kỹ thuật
1. **Không dùng `go.Picture` với file SVG ngoài cho node** — nếu ảnh lỗi/chậm sẽ để khung trống. Portrait node hiện vẽ bằng shape GoJS thuần: Spot panel `isClipping: true` (RoundedRectangle 52×62 làm mask) + Circle (đầu, `#d9b28c`) + Ellipse (vai, màu `getGenColor(generation)`).
2. **Chiều cao node cố định:** Panel Vertical `desiredSize: new go.Size(108, 138)`; tên `height: 32, maxLines: 2, OverflowEllipsis`; dòng năm sinh luôn render (text `" "` khi không có) → mọi node cao bằng nhau (165px, root 166px do stroke 3px).
3. **SVG assets phải là XML sạch:** lỗi trước do file SVG chứa `\"` escape và ký tự Unicode hỏng → browser trả `naturalWidth = 0`. Khi generate SVG bằng tool, kiểm tra bằng `fetch(...).text()` hoặc mở trực tiếp trên browser.
4. Modal vẫn dùng `<img>` tới `./img/portrait-dinh.svg` — hoạt động sau khi viết lại SVG.
5. Cache-bust hiện tại: `?v=9` (cả `index.html` và `public/index.html`).
6. Deploy: `wrangler deploy` (Node 22 ở `/tmp/node22/bin`), worker `giapha-genealogy-viewer` account hacmieu.
