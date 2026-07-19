# PDCA Report — View modes và reset stage Vũ Tộc

**Thời điểm:** 2026-07-20 01:09 (UTC+7)  
**Plan:** [../../plans/20260720_0109-vu-toc-view-modes-stage-reset.md](../../plans/20260720_0109-vu-toc-view-modes-stage-reset.md)

## Context

Sidebar thay đổi model/filter nhưng giữ viewport cũ nên người dùng dễ nhìn vào vùng trống hoặc sai ngữ cảnh. `Lọc theo Chi` không còn cần thiết. Viewer cũng thiếu projection có phối ngẫu/con gái/chồng con gái và projection quan hệ ngoài.

## Plan

Xem plan liên kết ở trên.

## Do

- Thêm `GET /api/public/graph`, chỉ trả people/relations public và không lộ trường hồ sơ riêng.
- Thêm `Dòng chính`, `Gia đình mở rộng`, `Quan hệ khác`; tách select `View` khỏi `Bố cục`.
- Family view hiện main + phối ngẫu trực tiếp, cả cha/mẹ/spouse links.
- Relations view hiện 397 people + synthetic social target khi chưa có `to_person_id`.
- Gom filter/view/layout/search/full-tree qua rebuild + reset stage; graph reset về Thủy Tổ scale 0.7.
- Bỏ HTML/JS/CSS của `Lọc theo Chi`.
- JSON export theo đúng model hiện tại; thêm legend spouse/external.

## Check

- PASS `npm run typecheck`.
- PASS `node --check public/js/viewer.js` và autocomplete.
- PASS IDE lints: 0 lỗi trên file sửa.
- PASS live API graph: 397 people, 503 parent, 125 spouse, 1 social.
- PASS browser UAT:
  - Không còn `branchFilter`.
  - Family: 315 node / 503 links, có node phối ngẫu và link cha/mẹ/vợ-chồng.
  - Relations: 398 node (397 people + 1 social target) / 629 links.
  - Đổi view dựng lại stage và center Thủy Tổ ở scale đọc được.
- PASS deploy public version `bae558de-0437-4d87-9977-95f1c3d07a68`.

## Act

- Giữ API graph lazy-load để cây chính tải nhanh.
- Khi có CRUD social relation, bổ sung dữ liệu thực; code viewer không cần đổi contract.
- Tăng query version asset khi deploy thay đổi JS/CSS để tránh browser giữ bản cũ.

## Changed files

- `cloudflare/vu-toc-lang-chuong/src/public-api.ts`
- `cloudflare/vu-toc-lang-chuong/src/index.ts`
- `cloudflare/vu-toc-lang-chuong/public/index.html`
- `cloudflare/vu-toc-lang-chuong/public/js/viewer.js`
- `cloudflare/vu-toc-lang-chuong/public/css/viewer.css`
- `plans/20260720_0109-vu-toc-view-modes-stage-reset.md`
- `memory/20260720_0109-vu-toc-view-modes-stage-reset.md`
- README SSOT và report này.

## Risks / rollback

Không migration, không mutation D1. Graph 397 node nặng hơn main, nhưng chỉ tải theo yêu cầu. Rollback bằng Worker version trước.

## Follow-up từ audit (2026-07-20)

- Fixed: `collectDescendants()` đi theo cả `fatherId` và `motherId` (con của con gái).
- Fixed: `getPublicPerson` + modal hiển thị `socialRelations`.
- Còn mở: admin `createPerson`/`updatePerson` vẫn ép không-chi ⇒ `external` (sai tổ tiên/spouse chưa gán chi).
- Còn mở: exporter vẫn expect 91 external trong khi live còn 82.
- Còn mở: projection server-side `?mode=` và fixture tests; hiện client projection đủ dùng.

## Next actions

- Làm CRUD cho `social_relations` để view Quan hệ khác có dữ liệu gia tộc thật.
- Sửa admin scope derivation theo tổ tiên/quan hệ, không chỉ `branch_id`.
- Cập nhật exporter validation count và (tuỳ chọn) mode projection phía server.
- UAT nội dung: xác nhận các spouse relation hiện có đã đủ chồng của con gái; bổ sung quan hệ còn thiếu qua admin sau.
