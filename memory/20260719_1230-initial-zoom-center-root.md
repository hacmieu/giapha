# Memory: Initial view viewer — zoom 1:1 center node Tổ

- **Thời gian:** 2026-07-19 12:30
- **Phạm vi:** `drop/genealogy-viewer/public/js/genealogy-viewer.js`

## Ghi nhớ kỹ thuật
1. **Initial view quy ước:** load lên là `scale = 1`, node Tổ căn giữa ngang, cách mép trên 24px. Thực hiện trong listener `InitialLayoutCompleted` khai báo ngay tại `initDiagram()`:
   ```js
   d.scale = 1;
   var root = d.findTreeRoots().first();
   d.position = new go.Point(b.centerX - d.viewportBounds.width / 2, b.y - 24);
   ```
2. **Bẫy đã gặp:** `applyGenealogyData` từng gắn thêm listener `InitialLayoutCompleted` gọi `zoomToFit()` — listener này chạy SAU nên ghi đè scale=1 (kết quả scale 0.83). Khi chỉnh initial view phải rà TẤT CẢ listener/`initialAutoScale`/`zoomToFit` trong file.
3. `InitialLayoutCompleted` fire lại mỗi lần thay `myDiagram.model` (kể cả khi lọc thế hệ) → view tự về 1:1 + center root của tập đang hiển thị. Đây là hành vi mong muốn.
4. **Cache HTML Cloudflare:** ngay sau deploy, `cf-cache-status: HIT` có thể trả HTML cũ vài chục giây → verify bằng `curl` tới khi thấy `?v=` mới rồi mới test browser. Cache-bust hiện tại: JS `?v=11`, CSS `?v=9`.
