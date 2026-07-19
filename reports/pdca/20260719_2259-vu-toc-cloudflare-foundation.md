# PDCA Report — Nền Cloudflare Vũ Tộc

**Thời điểm:** 2026-07-19 22:59 (UTC+7)  
**Plan:** [../../plans/20260719_2259-vu-toc-cloudflare-foundation.md](../../plans/20260719_2259-vu-toc-cloudflare-foundation.md)  
**Memory:** [../../memory/20260719_2259-vu-toc-cloudflare-foundation.md](../../memory/20260719_2259-vu-toc-cloudflare-foundation.md)

## 1. Context

Chủ dữ liệu xác nhận:

- Hệ thống đích bỏ Django hoàn toàn.
- 91 người không chi là quan hệ ngoài của admin.
- Làng Chuông là tên chính thức.
- Tạm thời public toàn bộ.
- Gia phả phải ghi được nhiều lớp thành viên, nhiều vợ và con theo từng bà.

## 2. Plan

- Chốt data contract cây chính/quan hệ ngoài.
- Tạo exporter canonical không phụ thuộc Django.
- Tạo schema D1 và Worker API CRUD.
- Rehearsal dữ liệu local, kiểm tra isolation và quan hệ nhiều vợ.
- Deploy remote theo từng lớp sau khi account được chốt; dừng nếu binding bắt buộc chưa sẵn sàng.

## 3. Do

Đã tạo `cloudflare/vu-toc-lang-chuong/` gồm:

- `docs/data-contract.md`.
- `scripts/export_vu_toc.py`.
- `migrations/0001_initial.sql`.
- Worker TypeScript: auth, HTTP validation, public API, admin CRUD.
- `wrangler.jsonc`: public/admin deployments, D1/R2/assets/observability.
- Static landing page, README, package scripts.

Đặc tính:

- `tree_scope=main|external`.
- `lineage_role`: Đinh, Đinh nhập tộc, con gái, con gái đóng suất Đinh, dâu/rể, hậu duệ con gái, external.
- `wife_person_id` + `wife_order`; `parent_relations(mother)` xác định con của bà nào.
- Public tree chỉ dùng `main`; public search/detail vẫn thấy `external`.
- Admin xác minh Access JWT ở Worker, kiểm tra same-origin, giới hạn body.
- CRUD người có optimistic versioning; cha/mẹ có cycle check; mọi mutation có audit event.

## 4. Check

### Export

- PASS: 397 người.
- PASS: 306 cây chính / 91 external.
- PASS: 8 chi; số người từng chi 56, 58, 53, 41, 43, 6, 12, 37.
- PASS: 246 cha / 257 mẹ / 503 parent relations.
- PASS: 125 cặp phối ngẫu, 125 cặp xác định được `wife_person_id`.
- PASS: 1 người có nhiều vợ.
- Cần nhập tay sau: 2 cặp của trường hợp nhiều vợ chưa có `wife_order` (Bà Cả/Bà Hai) trong nguồn.
- PASS: 1 draft / 28 draft people / 10 draft spouse relations.
- PASS: 0 orphan, 0 parent cycle, 0 duplicate legacy ID.

### D1 và API

- PASS: migration + seed trên SQLite rehearsal mới.
- PASS: local D1 có 397/306/91, 503 parent, 125 spouse, 0 foreign-key error.
- PASS: người hai vợ có 6 con; 6/6 con map được tới đúng `mother`.
- PASS: Worker binding generation + TypeScript strict.
- PASS: health, public tree, external isolation, CRUD, parent relation create/delete.
- PASS: public/admin deployment dry-run; bundle gzip 18.61 KiB.
- PASS: IDE lint.
- PASS: chọn account `Hacmieu@gmail.com's Account` (`716f…ab44`).
- PASS: tạo D1 APAC `vu-toc-lang-chuong` (`f6f21aeb-b32b-43c1-92b2-543681ec0ad6`).
- PASS: migration + import remote 1.075 queries; đối soát 397/306/91, 503 parent, 125 spouse, 0 FK error.

### Not run

- R2 creation và Worker deploy: **BLOCKED** — account trả code `10042`, cần bật R2 trong Cloudflare Dashboard.
- Cloudflare Access application/JWT thực tế.
- Port toàn bộ viewer Trần Tộc sang API mới.
- Upload ảnh nguồn vào R2.

## 5. Act

Bước tiếp theo:

1. Chủ account bật R2 trên Hacmieu.
2. Tạo R2 bucket và upload ảnh.
3. Deploy staging public/admin.
4. Tạo Access application, lấy team domain/audience.
5. Chạy UAT, port viewer Trần Tộc và xây form quản trị.

## 6. Changed files

- Toàn bộ package mới `cloudflare/vu-toc-lang-chuong/`.
- `plans/20260719_2259-vu-toc-cloudflare-foundation.md`.
- `reports/pdca/20260719_2259-vu-toc-cloudflare-foundation.md`.
- `memory/20260719_2259-vu-toc-cloudflare-foundation.md`.
- README SSOT tương ứng.

Không sửa hai diff runtime có sẵn ở `api/views.py` và `templates/core/relationships.html`.

## 7. Risks & rollback

- `wife_order` của hai bà chưa có trong nguồn, phải xác nhận thủ công; mapping mẹ–con đã đầy đủ.
- Tất cả public theo yêu cầu; schema đã có `visibility` để khóa sau.
- R2 chưa được account kích hoạt; Worker chưa deploy để tránh binding hỏng.
- Access vars đang để trống; admin production sẽ trả 503 cho tới khi cấu hình đúng.
- Artifact `exports/` chứa PII và bị gitignore.
- Chưa deploy nên rollback hiện tại chỉ cần bỏ package mới; dữ liệu Django không đổi.

## 8. Next actions

Bật R2 trong Cloudflare Dashboard account Hacmieu, sau đó tiếp tục tạo bucket và deploy staging.
