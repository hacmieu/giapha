# Memory — Admin Phase A/B đã lên

**Thời điểm:** 2026-07-20 15:21 (UTC+7)

## Đã làm

1. Cloudflare Access self-hosted cho `vu-toc-lang-chuong-admin.hacmieu.workers.dev`
   - Org/team: `hopamde.cloudflareaccess.com`
   - AUD: `78a42cfd728a3fe6937e5663ba48b46a7c049c408471e59bec5f0e5a9fb7b94e`
   - Policy allow: `hacmieu@gmail.com`
2. Wrangler admin env đã set `CF_ACCESS_TEAM_DOMAIN` + `CF_ACCESS_AUD`.
3. Admin UI: `/` trên Worker admin → `admin.html` (CRUD người, cha/mẹ, phối ngẫu).
4. API: `GET /api/admin/meta`, `GET /api/admin/people`.
5. `createPerson`/`updatePerson` không còn ép không-chi ⇒ external; tôn trọng `treeScope`/`lineageRole`.

## Cách dùng

1. Mở https://vu-toc-lang-chuong-admin.hacmieu.workers.dev/
2. Login Access bằng email được phép.
3. Tìm người → sửa/lưu; hoặc tạo mới; thêm quan hệ.

## Còn lại

- Thêm email khác vào Access policy nếu cần.
- social_relations CRUD, upload ảnh R2.
- UAT CRUD thật sau login (agent không có session Access).
