# PDCA Report — Nối 8 chi Vũ Tộc về Thủy Tổ

**Thời điểm:** 2026-07-20 00:40 (UTC+7)  
**Report trước:** [20260720_0012-vu-toc-public-viewer.md](./20260720_0012-vu-toc-public-viewer.md)

## 1. Context

Chủ dữ liệu nhận ra phả đồ đang vẽ 8 chi thành 8 gốc rời, không chụm về một Thủy Tổ, và gợi ý "tìm lại trong Django, có 2 chỗ ghi".

## 2. Plan

- Soi lại DB Django xác minh có Thủy Tổ chung không.
- Nếu có, tìm nguyên nhân exporter cắt liên kết và sửa cả exporter lẫn D1 live.

## 3. Do

- Xác minh trong `db.sqlite3`: **TỎ PHỤ (id 1)** + **TỔ MẪU (id 2)** là Thủy Tổ đời 0; **cả 8 cụ tổ chi đều có `father_id=1`, `mother_id=2`**.
- Tìm ra lỗi phân loại: exporter dùng luật `chi_id IS NULL ⇒ external`, đẩy nhầm Thủy Tổ (không gán chi) ra external. Truy vấn cây công khai chỉ nối cha–con khi **cả hai** đều `main`, nên liên kết cụ tổ chi → Thủy Tổ bị loại.
- Sửa `scripts/export_vu_toc.py`:
  - `compute_main_ids()`: dòng chính = người có chi **+ toàn bộ tổ tiên trực hệ** (đệ quy father/mother).
  - `lineage_role()`: bỏ phụ thuộc `chi_id`; nam đã tính Đinh luôn là Đinh (kể cả Thủy Tổ bị ghi nhầm `member_type=child_out`).
- Vá D1 remote (`exports/fix-root.sql`):
  - Đưa tổ tiên của người `main` về `main` (lặp 2 lần cho phủ kín) → +12 người.
  - Sửa `lineage_role` cho nhóm vừa nâng.
  - Ép nam `is_dinh` về vai trò `dinh` (sửa TỎ PHỤ).

## 4. Check

- PASS: `/api/public/tree` main = **318** (trước 306): +2 Thủy Tổ, +10 bà dâu đời gốc.
- PASS: gốc dòng máu (không tính dâu/rể) hội tụ về **TỎ PHỤ (đời 0)** với subtree **199** người = đủ 8 chi (38+33+33+29+27+25+8+5 + tổ).
- PASS (browser): cây liền một khối, TỎ PHỤ → Vũ Văn Kế (đời 1) → Vũ Văn Chế (đời 2)… ; Fit thấy toàn bộ tỏa từ một đỉnh.
- KNOWN GAP: còn ~10 mảnh rời nhỏ (vd Nguyễn Hiếu chi 2, vài người đời 5) do **nguồn thiếu `father_id`**, không liên quan Thủy Tổ.

## 5. Act

- Nếu muốn gộp nốt các mảnh rời: bổ sung `father_id` cho các cá nhân thiếu trong nguồn/qua admin.
- Lần export lại sau này sẽ tự đúng nhờ `compute_main_ids()`.

## 6. Changed files

- `cloudflare/vu-toc-lang-chuong/scripts/export_vu_toc.py` (luật main + lineage_role).
- `cloudflare/vu-toc-lang-chuong/exports/fix-root.sql` (vá D1 live, gitignored).
- README SSOT `reports/`, `memory/`.

## 7. Risks & rollback

- Vá D1 chỉ đổi `tree_scope`/`lineage_role`, idempotent; rollback bằng cách đặt lại external nếu cần.
- Số main tăng 306→318 là đúng bản chất (Thủy Tổ + dâu đời gốc thuộc dòng chính).

## 8. Next actions

Bổ sung cha còn thiếu cho ~10 mảnh rời (tùy chọn); tiếp tục Access + form CRUD admin.
