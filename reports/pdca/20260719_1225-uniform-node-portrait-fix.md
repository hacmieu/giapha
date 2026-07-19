# PDCA: Sửa portrait không hiển thị + đồng đều chiều cao node

- **Thời gian:** 2026-07-19 12:25
- **Trạng thái:** done
- **Plan:** `plans/20260719_1225-uniform-node-portrait-fix.md`
- **Memory:** `memory/20260719_1225-uniform-node-portrait-fix.md`

## Plan
Người dùng báo lỗi hiển thị (khung portrait trống, icon ảnh vỡ trên node) và yêu cầu mọi node cao bằng nhau.

## Do
1. **Chẩn đoán:** kiểm tra trên live bằng CDP — `<img>` portrait trong modal có `complete: true` nhưng `naturalWidth: 0` → SVG không parse được. Đọc lại file SVG phát hiện attribute chứa `\"` escape hỏng (vd `ry=\"3.8\"`) và ký tự Unicode lỗi trong `aria-label`.
2. **Viết lại 2 SVG** `portrait-dinh.svg`, `portrait-spouse.svg` với XML sạch.
3. **Node template GoJS** (`public/js/genealogy-viewer.js`):
   - Bỏ `go.Picture` (phụ thuộc tải ảnh) → vẽ silhouette bằng shape thuần: Spot panel `isClipping` + đầu (Circle) + vai (Ellipse màu theo `getGenColor`).
   - Panel Vertical `desiredSize: 108×138`; tên cố định 2 dòng (`height: 32, maxLines: 2, OverflowEllipsis`); dòng năm sinh luôn giữ chỗ.
   - Bỏ monogram overlay trên node (gọn hơn, monogram vẫn còn trong modal).
4. Bump cache `?v=9` cả 2 index.html, `wrangler deploy` 2 lần (JS trước, SVG sau). Version cuối: `94cc4222`.

## Check
- `node --check` pass.
- CDP sample 12 node đầu: heights `[166,165,165,...]` — đồng đều (166 là node Tổ đời 4 có viền 3px).
- Screenshot live: node hiển thị silhouette màu theo thế hệ, tên 2 dòng không làm lệch chiều cao.
- Modal mở với node "Trần Quốc Lạ": portrait SVG hiển thị, đủ thân thế/gia đình.

## Act
- Ghi memory quy ước: portrait node dùng shape GoJS thuần, không dùng Picture với ảnh ngoài; SVG assets phải là XML sạch.
- Bước sau (tuỳ chọn): khi có ảnh chân dung thật, thêm lại `go.Picture` với fallback là silhouette hiện tại (giữ silhouette làm lớp nền, ảnh đè lên khi tải thành công).
