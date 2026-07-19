# PDCA Report — Trần tộc Chanh Thôn + portrait

**Date:** 2026-07-19 12:12  
**Status:** done  
**Owner:** Cursor

## 1. Context

- Đổi brand từ Làng Chuông / Hải Phòng sang Trần tộc Chanh Thôn / Ninh Bình (Hà Nam cũ).
- Thêm portrait đẹp cho node và modal hồ sơ.

## 2. Plan

- Xem `plans/20260719_1212-chanh-thon-portrait.md`.
- Không đổi schema/API.

## 3. Do

- Cập nhật title/header/footer/ARIA/README.
- Thêm `public/img/portrait-dinh.svg` và `portrait-spouse.svg`.
- Node GoJS: Picture portrait + khung + monogram.
- Modal: khung portrait + monogram; hỗ trợ `data.photo` nếu có.
- Cache-bust `v=8`; deploy Worker Hacmieu.

## 4. Check

| Check | Kết quả |
|-------|---------|
| Branding scan (Làng Chuông/Hải Phòng) | PASS — không còn |
| `node --check` JS | PASS |
| Live `/` | PASS 200 |
| Live `/img/portrait-dinh.svg` | PASS 200 |
| HTML live chứa Chanh Thôn | PASS |
| Deploy version | `ba79cdf2-88da-47be-9162-2e22df4bd98a` |

**Live:** https://giapha-genealogy-viewer.hacmieu.workers.dev

## 5. Act

- Memory cập nhật nhận diện + portrait convention.
- Next: gắn ảnh thật theo thành viên khi import có photo.

## 6. Changed files

- `drop/genealogy-viewer/public/index.html`
- `drop/genealogy-viewer/public/css/viewer.css`
- `drop/genealogy-viewer/public/js/genealogy-viewer.js`
- `drop/genealogy-viewer/public/img/portrait-*.svg`
- `drop/genealogy-viewer/index.html`, `README.md`, zip
- `plans/`, `memory/`, `reports/pdca/` + README SSOT

## 7. Risks & rollback

- Portrait SVG là placeholder stylized, chưa phải ảnh lịch sử.
- Rollback: revert commit / Wrangler rollback.

## 8. Next actions

1. Import/map ảnh thật vào `photo` field.
2. Phân biệt đinh/phối ngẫu trên tree nếu schema có gender.
