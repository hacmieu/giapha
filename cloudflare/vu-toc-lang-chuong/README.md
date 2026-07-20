# Vũ Tộc Làng Chuông — Cloudflare

Ứng dụng độc lập, không chạy Django:

- Workers Static Assets: giao diện.
- Worker API: public read + admin CRUD.
- D1: dữ liệu quan hệ.
- R2: ảnh.
- Cloudflare Access: bảo vệ deployment admin.

## Trạng thái remote

- Account: `Hacmieu@gmail.com's Account`.
- D1 APAC: `f6f21aeb-b32b-43c1-92b2-543681ec0ad6` (397 người đã seed).
- R2: `vu-toc-lang-chuong-media` (ảnh đã upload `--remote`).
- Public: https://vu-toc-lang-chuong-public.hacmieu.workers.dev — **viewer dùng được**.
- Admin: https://vu-toc-lang-chuong-admin.hacmieu.workers.dev — **API ghi 401 khi thiếu JWT; Access edge + UI CRUD chưa làm**.
- Access JWT (`CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD`) còn trống.

Backlog & hướng Admin: xem `../../plans/20260720_1518-vu-toc-remaining-and-admin.md`.

## Yêu cầu

- Node.js 22+ (project có local `node@22` để chạy Wrangler trên máy hiện tại).
- Python 3 chỉ dùng cho lần export nguồn SQLite.

## Migration nguồn một lần

```bash
npm run export:legacy
```

Artifact nằm trong `exports/`, chứa dữ liệu cá nhân nên bị `.gitignore`.

Kiểm định hiện tại:

- 397 người.
- 306 người cây chính / 91 quan hệ ngoài.
- 8 chi.
- 246 quan hệ cha / 257 quan hệ mẹ.
- 125 cặp phối ngẫu; có 1 người nhiều phối ngẫu.
- 0 orphan và 0 chu trình cha/mẹ.

## Chạy local

```bash
npm run cf:types
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Local mode cho phép API admin không cần Access JWT. Không dùng local mode ở production.

## Deploy

Hai deployment dùng chung D1/R2:

```bash
npm run deploy:public
npm run deploy:admin
```

Trước khi deploy admin:

1. Tạo Cloudflare Access application cho hostname admin.
2. Chỉ allow email quản trị.
3. Điền `CF_ACCESS_TEAM_DOMAIN` và `CF_ACCESS_AUD` trong cấu hình/biến môi trường.
4. Worker vẫn xác minh `Cf-Access-Jwt-Assertion`; không chỉ dựa vào việc ẩn giao diện.

## API hiện có

Public:

- `GET /api/health`
- `GET /api/public/tree` — chỉ cây chính.
- `GET /api/public/graph` — toàn bộ public people + parent/spouse/social (lazy-load cho view mở rộng).
- `GET /api/public/search?q=...` — có thể tìm cả quan hệ ngoài.
- `GET /api/public/people/:id` — hồ sơ, quan hệ, socialRelations.
- `GET /api/public/media/:key`

Admin (cần Access JWT khi `DEPLOYMENT_MODE=admin`):

- `POST /api/admin/people`
- `PATCH|DELETE /api/admin/people/:id`
- `POST|DELETE /api/admin/parent-relations[/:id]`
- `POST|DELETE /api/admin/spouse-relations[/:id]`

Chưa có: UI forms, CRUD `social_relations`, upload media từ admin.

Mọi sửa đổi ghi `audit_events`; update/delete người dùng optimistic versioning.
