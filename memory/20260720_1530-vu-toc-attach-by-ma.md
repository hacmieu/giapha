# Memory — Gắn nhánh theo Mã

- Khóa nghiệp vụ gắn nhánh = **Mã** (`legacy_id` ưu tiên, rồi `person_code`), không phải UUID nội bộ.
- Admin resolve: `GET /api/admin/people/resolve?ma=django:389`.
- Parent/spouse POST nhận Mã; response có `hint` nếu parent chưa `main`.
- Sau gắn: set `tree_scope=main` (+ `generation` / lineage_role) thì mới hiện trên phả đồ public “Dòng chính”.
- UI Admin: khối “Gắn vào cây chính theo Mã” — chọn con (auto Mã) → nhập Mã cha/mẹ → Gắn (+ optionally promote).
- Case mẫu: `django:389` “Final Test Member” từng chỉ `external`/version 1 — cần gắn cha main rồi promote.
