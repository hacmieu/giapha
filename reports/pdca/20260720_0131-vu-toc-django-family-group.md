# PDCA Report — Gom gia đình vợ chồng kiểu Django

**Thời điểm:** 2026-07-20 01:31 (UTC+7)  
**Plan:** [../../plans/20260720_0131-vu-toc-django-family-group.md](../../plans/20260720_0131-vu-toc-django-family-group.md)

## Context

View Gia đình mở rộng Cloudflare nối vợ–chồng bằng dashed link rời nên không ổn định như Django. Tham chiếu chính: `templates/core/relationships.html` (Group `fam_<husband>` + TreeLayout).

## Plan

Port groupTemplate + projection `fam:<husbandId>`; dòng chính giữ spouse text.

## Do

- Thêm `diagram.groupTemplate` (GridLayout ngang, viền hồng nét đứt).
- `selectGraphData` tạo family groups theo `wifePersonId`/`wifeOrder`, gán `group`, redirect father links group↔group, giữ mother dashed.
- Bỏ spouse link rời trong family/relations (tránh trùng với ô group).
- TreeLayout kiểu Django cho family/relations.
- Legend “Ô gia đình”; sửa boot gọi `updateStats`.
- Cache-bust `?v=11`.

## Check

- PASS `node --check public/js/viewer.js`.
- PASS deploy public `404847bd-4b5a-4516-b0e9-ad0b86ffc686`.
- PASS browser UAT family view:
  - Stats: 315 người / 395 links · Đời 0–7.
  - Visual: chồng + vợ trong khối hồng nét đứt; dòng cha xanh từ ô gia đình xuống đời sau; nhãn mẹ dashed.
  - Legend có “Ô gia đình (chồng+vợ)”.

## Act

- Khi nhiều vợ: hiện đã nhãn `Bà N`; có thể sau này tách con theo mẹ chính xác hơn (Django cũng chưa làm trên layout).
- Không commit các thay đổi WIP Django `api/views.py` / `relationships.html` sẵn có — đó là nguồn tham chiếu, không thuộc delivery Cloudflare này.
- Next: UAT thêm trường hợp con gái + chồng (rể) trong cùng group.

## Changed files

- `cloudflare/vu-toc-lang-chuong/public/js/viewer.js`
- `cloudflare/vu-toc-lang-chuong/public/index.html`
- `plans/20260720_0131-vu-toc-django-family-group.md`
- `memory/20260720_0131-vu-toc-django-family-group.md`
- `reports/pdca/20260720_0131-vu-toc-django-family-group.md`
- README SSOT tương ứng

## Risks / rollback

Chỉ frontend; rollback Worker version trước. Graph lớn với group nặng hơn lineage; lazy-load graph vẫn giữ.
