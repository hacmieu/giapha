# PDCA Report — Trần Tộc viewer và hồ sơ modal

**Date:** 2026-07-19 11:59  
**Owner:** Cursor  
**Phase:** 2 — static delivery  
**Status:** done

## 1. Context

- Đổi nhận diện viewer thành Trần Tộc.
- Thay chi tiết sidebar bằng modal hồ sơ.
- Áp dụng cách tổ chức thông tin từ các sản phẩm gia phả hiện đại, nhưng giữ tương tác phù hợp yêu cầu dự án.

## 2. Plan

- Xem `plans/20260719_1159-tran-toc-viewer-modal.md`.
- Không đổi schema, API hoặc database.
- Rollback: revert commit.

## 3. Do

- Đổi title/header/footer/ARIA từ Vũ Tộc sang Trần Tộc.
- Tạo nhận diện xanh mực–đỏ son–vàng đồng và ấn triện `陳`.
- Loại bỏ vùng chi tiết sidebar, thay bằng hướng dẫn ngắn.
- Thêm native dialog modal hồ sơ, responsive.
- Modal hiển thị monogram, mã gia phả, đời, năm sinh, nơi ở, thân phụ, phối ngẫu, số con và notes.
- Thêm HTML escaping cho dữ liệu hồ sơ.
- Thay 547 ảnh placeholder không tồn tại bằng monogram trên node.
- Thêm đóng modal bằng ×, backdrop và Escape; trả focus.
- Gom nguồn deploy vào `public/`, root index dùng asset trong `public/`; xóa duplicate cũ.
- Cache-bust JS/CSS (`v=7`).
- Deploy lên Worker account Hacmieu.

## 4. Check

- `node --check`: PASS.
- JSON schema/count: PASS — 547 nodes, 546 links.
- Linter HTML/CSS/JS: PASS.
- Branding scan: PASS — không còn “Vũ Tộc” trong package.
- Live browser:
  - title/header: PASS — “Trần Tộc Làng Chuông”.
  - GoJS: PASS — 547 node.
  - stats: PASS — 547 người/546 quan hệ.
  - modal người đầu tiên: PASS — thân thế, phối ngẫu, 3 người con.
  - modal người có notes: PASS — hiện “Ghi chép gia phả”.
  - Escape: PASS sau cache-bust.
  - lọc đời 4: PASS — 1 node; reset PASS.
- Deploy: PASS — version `f8af8841-cbfd-4195-b367-8290166cb603`.
- Live: https://giapha-genealogy-viewer.hacmieu.workers.dev

## 5. Act

- Ghi memory về cấu trúc hồ sơ, monogram, escaping và cache-bust.
- Việc sau: bổ sung ảnh thật, ngày mất, mẹ và nguồn tư liệu khi schema có dữ liệu.
- Có thể cân nhắc hover preview nhẹ; modal tiếp tục là hồ sơ đầy đủ.

## 6. Changed files

- `drop/genealogy-viewer/index.html`
- `drop/genealogy-viewer/public/index.html`
- `drop/genealogy-viewer/public/css/viewer.css`
- `drop/genealogy-viewer/public/js/genealogy-viewer.js`
- `drop/genealogy-viewer/README.md`
- Xóa duplicate cũ: `drop/genealogy-viewer/{css,js,data}/`
- `plans/20260719_1159-tran-toc-viewer-modal.md`
- `memory/20260719_1159-tran-toc-viewer-modal.md`
- `reports/pdca/20260719_1159-tran-toc-viewer-modal.md`
- README SSOT trong `memory/`, `plans/`, `reports/`

## 7. Risks & rollback

- Snapshot chỉ có một phần hồ sơ; modal chỉ trình bày dữ liệu thực có.
- `fatherId` orphan được trình bày “Chưa xác định”, không suy đoán.
- Rollback bằng revert commit và Wrangler rollback.

## 8. Next actions

1. Bổ sung ảnh thật/giới tính/ngày mất/mẹ vào snapshot.
2. Thêm nguồn tư liệu và timeline khi backend cung cấp.
3. Đánh giá hover preview sau khi có phản hồi người dùng.
