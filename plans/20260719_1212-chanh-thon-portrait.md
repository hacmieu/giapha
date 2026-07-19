# Plan — Trần tộc Chanh Thôn + portrait

**Date:** 2026-07-19 12:12  
**Status:** done

## Kết quả

- Live: https://giapha-genealogy-viewer.hacmieu.workers.dev
- Report: `reports/pdca/20260719_1212-chanh-thon-portrait.md`
- Memory: `memory/20260719_1212-chanh-thon-portrait.md`


## Mục tiêu

1. Đổi nhận diện viewer thành **Trần tộc Chanh Thôn**, địa danh **Chanh Thôn - Ninh Bình (Hà Nam cũ)**.
2. Thêm hình **portrait** đẹp cho node trên phả đồ và modal hồ sơ (không phụ thuộc ảnh thật vì snapshot chưa có photo).

## Phạm vi

- `drop/genealogy-viewer/public/**`
- `drop/genealogy-viewer/index.html`, README, zip
- PDCA logs + README SSOT
- Redeploy Worker Hacmieu

## Thiết kế portrait

- SVG portrait oval: khung đồng, nền giấy cổ, bóng dáng đinh.
- Node GoJS: Picture portrait 52×65.
- Modal: khung portrait lớn + monogram chồng lớp.
- Cache-bust `v=8`.

## Check

- Không còn “Làng Chuông / Hải Phòng” trong package.
- Live HTTP 200; modal + node dùng portrait.
- Deploy + push.
