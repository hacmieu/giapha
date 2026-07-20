# PDCA Report — Backlog còn lại & hướng xử lý Admin

**Thời điểm:** 2026-07-20 15:18 (UTC+7)  
**Plan:** [../../plans/20260720_1518-vu-toc-remaining-and-admin.md](../../plans/20260720_1518-vu-toc-remaining-and-admin.md)

## Context

User hỏi: còn gì chưa xong, và Admin xử lý thế nào. Đây là vòng **đánh giá + chốt hướng**, chưa triển khai code Admin UI.

## Plan

Xem plan liên kết: backlog P0–P2 và Phase A→D cho Admin (Access → UI CRUD → mở rộng → cắt Django).

## Do

- Rà README Cloudflare, `auth.ts`, `admin-api.ts`, `wrangler.jsonc`, memory gần đây.
- Probe live:
  - Public `/` → 200
  - Admin `/` → 200 (HTML mở)
  - Admin `POST /api/admin/people` → 401 (fail-closed đúng khi thiếu JWT)
  - Admin `/api/health` → `mode: admin`
- Viết plan/memory/report + cập nhật README SSOT.
- Cập nhật `cloudflare/vu-toc-lang-chuong/README.md` mục trạng thái/backlog Admin.

## Check

| Kiểm tra | Kết quả |
|----------|---------|
| Public viewer live | PASS (đã deploy các vòng trước) |
| Admin API không JWT | PASS 401 |
| Admin Access configured | FAIL / chưa — `CF_ACCESS_*` trống |
| Admin UI CRUD | FAIL / chưa có |
| social_relations CRUD | FAIL / chưa có endpoint admin |
| Scope derivation admin | FAIL / còn luật cứng không-chi⇒external |

## Act — next iteration đề xuất

1. **Ngay:** Phase A Access (user tạo app Zero Trust + cung cấp team domain/AUD).
2. **Sau Access:** Phase B `admin.html` MVP (people + parent + spouse).
3. **Song song kỹ thuật:** sửa `createPerson`/`updatePerson` theo data-contract.
4. Không commit WIP Django (`api/views.py`, `relationships.html`) vào vòng này trừ khi user yêu cầu.

## Changed files

- `plans/20260720_1518-vu-toc-remaining-and-admin.md`
- `memory/20260720_1518-vu-toc-remaining-and-admin.md`
- `reports/pdca/20260720_1518-vu-toc-remaining-and-admin.md`
- `plans/README.md`, `memory/README.md`, `reports/README.md`
- `cloudflare/vu-toc-lang-chuong/README.md`

## Risks / rollback

Chỉ tài liệu + README; không đổi runtime. Rollback = revert commit docs.
