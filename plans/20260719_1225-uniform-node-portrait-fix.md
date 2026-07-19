# Plan: Sửa lỗi hiển thị portrait + đồng đều chiều cao node

- **Thời gian:** 2026-07-19 12:25
- **Trạng thái:** done
- **Liên quan:** `plans/20260719_1212-chanh-thon-portrait.md`

## Bối cảnh
Người dùng báo 2 lỗi trên viewer https://giapha-genealogy-viewer.hacmieu.workers.dev:
1. Portrait trong node GoJS không hiển thị (khung trống + icon ảnh vỡ).
2. Node cao thấp không đều (người có năm sinh cao hơn, tên dài xuống 2 dòng cao hơn).

## Nguyên nhân
1. File SVG portrait bị hỏng encoding: attribute chứa `\"` escape (sinh từ chuỗi escape khi tạo file) và ký tự Unicode lỗi (`gia t�c`) → browser không parse được SVG → `naturalWidth = 0` → GoJS `errorFunction` xoá source → khung trống ở cả node lẫn modal.
2. Panel Vertical dùng `minSize` không cố định, TextBlock tên wrap tự do, dòng năm sinh chỉ hiện khi có dữ liệu → chiều cao lệch nhau.

## Giải pháp
1. **Node GoJS:** vẽ portrait bằng shape GoJS thuần (Spot panel `isClipping` + đầu Circle + vai Ellipse tô màu theo thế hệ) — không phụ thuộc tải ảnh ngoài, render tức thì.
2. **Đồng đều chiều cao:** Panel Vertical `desiredSize: 108×138`, tên cố định 2 dòng (`height: 32, maxLines: 2, OverflowEllipsis`), dòng năm sinh luôn giữ chỗ (`" "` khi trống).
3. **SVG portrait (dùng cho modal):** viết lại 2 file SVG sạch, XML hợp lệ.
4. Bump cache `?v=9`, deploy Wrangler, verify bằng browser.

## Check items
- [x] `node --check` JS pass
- [x] Heights sample qua CDP: tất cả 165px (root 166 do viền dày 3px)
- [x] Portrait node hiển thị (silhouette màu theo thế hệ)
- [x] Modal hiển thị portrait SVG (naturalWidth > 0)
- [x] Deploy version 94cc4222
