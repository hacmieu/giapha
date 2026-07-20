# Memory — Backlog Vũ Tộc & Admin

**Thời điểm:** 2026-07-20 15:18 (UTC+7)

## Snapshot

Public viewer Cloudflare **đã dùng được nội bộ**. Admin **chưa dùng được để CRUD trên UI**: chỉ có API + Worker admin, Access chưa gắn, HTML admin đang trùng viewer public.

## Quy ước Admin

1. Hai Worker chung D1/R2: `public` chỉ đọc; `admin` ghi.
2. Bảo vệ kép: Cloudflare Access ở edge **và** Worker verify `Cf-Access-Jwt-Assertion`.
3. UI admin là static forms gọi `/api/admin/*` — không mang Django Admin sang.
4. `DEPLOYMENT_MODE=local` chỉ cho máy dev.

## Việc còn mở (nhớ khi làm tiếp)

- P0: Access + AUD/team domain; UI CRUD; sửa scope khi create/update person.
- P1: social_relations, upload R2, wife_order thiếu, gắn lại Nguyễn.
- P2: GoJS license, domain/restrict view, cắt Django, test exporter.

## Liên kết

- Plan: `plans/20260720_1518-vu-toc-remaining-and-admin.md`
- Report: `reports/pdca/20260720_1518-vu-toc-remaining-and-admin.md`
- Live public: https://vu-toc-lang-chuong-public.hacmieu.workers.dev
- Live admin: https://vu-toc-lang-chuong-admin.hacmieu.workers.dev
