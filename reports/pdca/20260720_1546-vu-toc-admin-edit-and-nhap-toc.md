# PDCA Report — Admin edit link + nhập tộc Vũ Thị Được

Date: 2026-07-20  
Owner: Auto  
Phase: 2  
Status: done

## 1. Context

- User kỳ vọng sửa trên public khi là admin; thực tế CRUD chỉ trên Worker admin (Access).
- Case Vũ Thị Được / Vũ Văn Khanh / con chung thiếu quan hệ cha.

## 2. Plan

- Làm rõ public read-only; cầu nối sang Admin.
- Quy ước `daughter_contributor` + `is_dinh` cho con gái nhập tộc.
- Bổ sung `parent_relations` father cho con theo mẹ.

## 3. Do

- `viewer.js`: section Quản trị + link Admin `?ma=`
- `index.html`: footer Quản trị
- `admin.js`: `openFromQuery()` từ `?ma=`
- `data-contract.md`: mục ngoại tộc nhập họ
- D1 remote:
  - `01.04.001` → `daughter_contributor`, `is_dinh=1`
  - `01.04.002` → `dinh` (từ `spouse`)
  - 5 con `01.05.014–019` → thêm cha `01.04.002`

## 4. Check

- `wrangler d1 execute --remote`: 7 lệnh OK (2 update people + 5 insert father)
- Deploy public + admin (pending this turn)
- Modal Vũ Huy Hoàng sau deploy: Thân phụ = Vũ Văn Khanh (verify user)

## 5. Act

- Phase sau: inline edit trên public khi có JWT (optional, cần Access trên cả 2 host)
- Rà soát exporter: con theo mẹ thiếu father trong seed Django
- Case tương tự khác trong chi 1

## 6. Changed files

- `cloudflare/vu-toc-lang-chuong/public/js/viewer.js`
- `cloudflare/vu-toc-lang-chuong/public/index.html`
- `cloudflare/vu-toc-lang-chuong/public/css/viewer.css`
- `cloudflare/vu-toc-lang-chuong/public/js/admin.js`
- `cloudflare/vu-toc-lang-chuong/public/admin.html`
- `cloudflare/vu-toc-lang-chuong/docs/data-contract.md`
- PDCA/SSOT indexes

## 7. Risks & rollback

- D1 patch: DELETE 5 parent_relations id `a1b2c3d4-e001-4001-8001-*`; revert people version/role.
- UI: redeploy commit trước.

## 8. Next actions

1. User hard refresh public → mở Vũ Huy Hoàng → kiểm tra Thân phụ.
2. Sửa hồ sơ qua nút Admin trong modal.
3. Exporter: sinh father khi có spouse + mother link.
