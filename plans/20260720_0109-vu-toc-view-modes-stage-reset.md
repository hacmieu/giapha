# Plan — View modes và reset stage Vũ Tộc

**Thời điểm:** 2026-07-20 01:09 (UTC+7)

## Mục tiêu

- Mọi thao tác dữ liệu ở sidebar dựng lại đúng model và reset stage (layout, zoom, vị trí, selection).
- Bỏ `Lọc theo Chi`.
- Thêm ba view dữ liệu:
  1. `Dòng chính`: cha → con trong cây Vũ Tộc.
  2. `Gia đình mở rộng`: có vợ, con gái, chồng của con gái và quan hệ phối ngẫu.
  3. `Quan hệ khác`: gồm người ngoài, parent/spouse và `social_relations`.

## Phạm vi

- API mới `GET /api/public/graph`: trả allow-list 397 hồ sơ public cùng parent/spouse/social relations.
- Viewer lazy-load graph khi chọn view mở rộng.
- `Xem đến đời`, `Chế độ layout`, `View`, tìm kiếm và quay full tree đều đi qua một hàm reset stage thống nhất.
- Không đổi schema/migration, không thay đổi dữ liệu D1.

## File dự kiến

- `cloudflare/vu-toc-lang-chuong/src/public-api.ts`
- `cloudflare/vu-toc-lang-chuong/src/index.ts`
- `cloudflare/vu-toc-lang-chuong/public/index.html`
- `cloudflare/vu-toc-lang-chuong/public/js/viewer.js`
- `cloudflare/vu-toc-lang-chuong/public/css/viewer.css`
- PDCA/SSOT tương ứng.

## Check

- TypeScript strict.
- API graph: 397 people, 503 parent, 125 spouse, 1 social.
- Browser: không còn lọc Chi; đổi view và lọc đời reset stage; family view có spouse; relations view có external/social.

## Risks / rollback

- Quan hệ khác có 397 node, Force layout nặng hơn cây chính; chỉ lazy-load khi chọn.
- `social_relations` hiện chỉ có 1 bản ghi nên view quan hệ khác chủ yếu thể hiện external parent/spouse.
- Rollback bằng deploy Worker version trước; không có migration/data mutation.
