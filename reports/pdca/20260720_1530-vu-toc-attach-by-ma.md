# PDCA Report — Gắn nhánh theo Mã

Date: 2026-07-20  
Owner: Auto  
Phase: 2  
Status: done

## 1. Context

- Mục tiêu: Cho phép gắn người/quan hệ ngoài vào cây chính bằng **Mã** (`legacy_id` / `person_code`), không bắt copy UUID.
- Phạm vi: Admin API resolve + parent/spouse nhận Mã; UI Admin “Gắn vào cây chính theo Mã”; promote `tree_scope=main`.
- Không bao gồm: CRUD social_relations; upload R2 từ admin; tự gắn `django:389` (cần Mã cha trên cây chính do user chọn).

## 2. Plan

- Giả định: Mỗi người đã có `legacy_id` (vd `django:389`); người neo trên cây chính có `tree_scope=main`.
- Rủi ro chính: Gắn nhầm Mã; gắn vào parent `external` → public vẫn không thấy; version conflict khi promote.
- File dự kiến: `src/admin-api.ts`, `src/index.ts`, `public/admin.html`, `public/js/admin.js`, PDCA/SSOT.
- Rollback: redeploy admin version trước; quan hệ đã tạo có thể DELETE qua API.

## 3. Do

- `resolvePersonRef`: UUID | `legacy_id` | `person_code`.
- `GET /api/admin/people/resolve?ma=` / `?ref=`.
- `POST` parent/spouse resolve Mã trước khi insert; trả hint nếu parent chưa main.
- UI: hiện Mã trong list/form; form gắn nhánh (Mã con + Mã cha/mẹ + promote + đời); nút “Đưa lên cây chính”; phối ngẫu theo Mã.
- Deploy admin: Version `70fee6bd-e7df-467e-a698-273a158109f9`.

## 4. Check

- Lệnh: `npm run typecheck` → pass.
- `npm run deploy:admin` → OK, assets `admin.html` + `admin.js` uploaded.
- `GET /api/health` admin → 200.
- `GET /api/admin/people/resolve?ma=django:389` không JWT → 401 (Access fail-closed) — đúng kỳ vọng.
- UAT gắn thật `django:389` → cha trên main: cần login Access (chưa chạy trong vòng này).

## 5. Act

- User: mở Admin → tìm `django:389` → nhập Mã cha/mẹ trên cây chính → “Gắn nhánh theo Mã” (+ đời nếu cần).
- Phase C: social_relations CRUD + R2 photo.
- Cân nhắc: optional soft-warn khi parent không main (đã có hint JSON).

## 6. Changed files

- `cloudflare/vu-toc-lang-chuong/src/admin-api.ts`
- `cloudflare/vu-toc-lang-chuong/src/index.ts`
- `cloudflare/vu-toc-lang-chuong/public/admin.html`
- `cloudflare/vu-toc-lang-chuong/public/js/admin.js`
- `plans/20260720_1530-vu-toc-attach-by-ma.md`
- `reports/pdca/20260720_1530-vu-toc-attach-by-ma.md`
- `memory/20260720_1530-vu-toc-attach-by-ma.md`
- SSOT README indexes + `cloudflare/vu-toc-lang-chuong/README.md`

## 7. Risks & rollback

- Rủi ro: Admin UI gắn thành công nhưng quên promote → vẫn `external` trên public.
- Rollback: `wrangler rollback` admin hoặc redeploy commit trước.

## 8. Next actions

1. User gắn `Final Test Member` (`django:389`) vào Mã cha/mẹ trên main + kiểm tra public.
2. Phase C admin (social + photo).
3. Bổ sung allow-list Access nếu cần thêm email.
