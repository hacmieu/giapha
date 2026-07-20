# Plan — Admin Phase A/B: Access checklist + UI CRUD MVP

**Thời điểm:** 2026-07-20 15:21 (UTC+7)

## Mục tiêu

1. Sửa admin `tree_scope`/`lineage_role` theo data-contract (không ép không-chi ⇒ external).
2. Thêm API list người + chi cho admin UI.
3. Xây `admin.html` + `admin.js` CRUD tối thiểu (people / parent / spouse).
4. Worker admin: `/` phục vụ admin UI; thử gắn Access nếu API cho phép, không thì checklist cho user.

## Phạm vi

- `src/admin-api.ts`, `src/index.ts`, `public/admin.html`, `public/js/admin.js`, `public/css/admin.css`
- PDCA/SSOT
- Deploy `--env admin` (và public nếu asset chung đổi)

## Không làm vòng này

- social_relations CRUD, upload R2, custom domain (P1/P2).

## Check

- typecheck
- local/dev syntax
- deploy admin; HTML `/` hiện form; API vẫn 401 không JWT
- Access: PASS nếu tạo được app; else ghi bước user phải làm
