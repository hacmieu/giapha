# Memory — Nối 8 chi Vũ Tộc về Thủy Tổ

**Thời điểm:** 2026-07-20 00:40 (UTC+7)  
**Report:** [../reports/pdca/20260720_0040-vu-toc-root-unify.md](../reports/pdca/20260720_0040-vu-toc-root-unify.md)

## Quyết định tái sử dụng

1. Thủy Tổ Vũ Tộc là **TỎ PHỤ (django id 1)** + **TỔ MẪU (id 2)**, đời 0, không gán chi. Cả 8 cụ tổ chi có `father_id=1, mother_id=2`.
2. Luật cũ `chi_id IS NULL ⇒ tree_scope=external` **sai** với Thủy Tổ và dâu đời gốc → cắt liên kết cha–con vì `getPublicTree` chỉ nối khi cả cha lẫn con đều `main`.
3. Luật đúng: **main = người có chi + toàn bộ tổ tiên trực hệ (đệ quy father/mother)**. Đã đưa vào `compute_main_ids()` trong exporter.
4. `lineage_role` không được phụ thuộc `chi_id`; nam `is_dinh` luôn là `dinh` (Thủy Tổ bị ghi nhầm `member_type=child_out`).
5. Sau vá: main 306→**318** (+2 Thủy Tổ, +10 bà dâu đời gốc). Gốc dòng máu hội tụ về TỎ PHỤ (subtree 199 = đủ 8 chi).
6. Còn ~10 mảnh rời do nguồn **thiếu `father_id`** (vd Nguyễn Hiếu chi 2) — vấn đề dữ liệu, không phải viewer.
7. Bài học: khi public tree lọc quan hệ theo `tree_scope`, mọi mắt xích trên đường về gốc phải cùng `main`, nếu không cây sẽ gãy thành rừng.

## Bằng chứng

- `exports/fix-root.sql` chạy remote: 25 + 2 changes.
- `/api/public/tree`: main 318, 1 gốc dòng máu chính TỎ PHỤ (đời 0).
- Browser: cây liền khối, Fit thấy toàn bộ tỏa từ một đỉnh.

## Next

Bổ sung cha còn thiếu cho ~10 mảnh rời nếu muốn gộp tuyệt đối; tiếp tục Access + CRUD admin.
