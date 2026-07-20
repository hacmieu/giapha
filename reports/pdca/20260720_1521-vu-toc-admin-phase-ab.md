# PDCA Report — Admin Phase A/B

**Thời điểm:** 2026-07-20 15:21 (UTC+7)  
**Plan:** [../../plans/20260720_1521-vu-toc-admin-phase-ab.md](../../plans/20260720_1521-vu-toc-admin-phase-ab.md)

## Context

Tiếp tục backlog: khóa Admin + UI CRUD MVP.

## Plan

Xem plan liên kết.

## Do

- Tạo Access app `Vũ Tộc Làng Chuông Admin` (self_hosted) + policy email `hacmieu@gmail.com`.
- Set wrangler admin vars: team `hopamde.cloudflareaccess.com`, AUD `78a42cfd…`.
- Sửa `resolveTreeScope` / `resolveLineageRole` trong `admin-api.ts`.
- Thêm `listAdminMeta`, `listAdminPeople`; route GET admin.
- Admin `/` rewrite → `admin.html`; thêm CSS/JS CRUD.
- Deploy admin `68a597a3…` + public `30f88c6b…`.

## Check

| Kiểm tra | Kết quả |
|----------|---------|
| `npm run typecheck` | PASS |
| `node --check public/js/admin.js` | PASS |
| Admin `/` không JWT | PASS 302 → `hopamde.cloudflareaccess.com` login |
| Admin API không JWT | PASS 302 (Access edge trước Worker) |
| Admin UI sau login | NOT-RUN (cần browser login email) |
| Public viewer | PASS deploy |

## Act

- User login Access bằng `hacmieu@gmail.com` và UAT lưu/tìm/thêm quan hệ.
- Thêm email khác vào Access policy nếu cần.
- Next: social_relations + upload R2 (Phase C).

## Changed files

- `src/admin-api.ts`, `src/index.ts`, `wrangler.jsonc`
- `public/admin.html`, `public/css/admin.css`, `public/js/admin.js`
- `cloudflare/.../README.md`, PDCA/SSOT logs

## Risks / rollback

- Access policy chỉ 1 email — người khác sẽ bị deny.
- Rollback Access: xóa app trong Zero Trust; rollback Worker: version trước.
- Không mutation D1 schema.
