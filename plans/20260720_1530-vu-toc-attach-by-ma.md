# Plan — Gắn nhánh theo Mã (legacy/person_code)

**Thời điểm:** 2026-07-20 15:30 (UTC+7)

## Vấn đề

- Public hiện Mã `django:389` nhưng Admin quan hệ đang đòi UUID → khó gắn.
- “Final Test Member” vẫn `external` / version 1 → lần sửa trước chưa commit vào D1 (hoặc chỉ xem trên public).

## Hướng (đồng ý với user)

Mã là khóa nghiệp vụ để gắn người mới vào người đã có trên cây chính:

1. Tìm người đích bằng Mã (`legacy_id` hoặc `person_code`).
2. Nếu đích thuộc `tree_scope=main` → cho phép gắn cha/mẹ/phối ngẫu.
3. Sau khi gắn, có thể nâng người mới lên `main` (+ đời/chi nếu cần).

## Do

- API admin: resolve ref = UUID | `django:…` | person_code.
- Parent/spouse POST nhận Mã.
- UI: hiện Mã rõ; ô quan hệ nhập Mã; nút “Gắn vào cây chính”.
- PDCA/SSOT + deploy admin.

## Status

**Done** (2026-07-20): API resolve + parent/spouse theo Mã; UI Admin gắn nhánh; deploy admin `70fee6bd`.

Report: `reports/pdca/20260720_1530-vu-toc-attach-by-ma.md`  
Memory: `memory/20260720_1530-vu-toc-attach-by-ma.md`
