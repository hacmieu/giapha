# Memory — Tách tạm họ Nguyễn khỏi cây chính

**Thời điểm:** 2026-07-20 00:45 (UTC+7)

## Quyết định

1. Họ **Nguyễn/Nguyên** không phải `spouse_in` = ngoại tộc ghi chú → `tree_scope=external`, `lineage_role=external` (tách tạm, gắn lại sau).
2. Dâu/rể họ Nguyễn (`spouse_in`) **giữ** trên thẻ Vợ/Chồng của Đinh.
3. Bản ghi tên kiểu `Vợ …` / `Chồng …` bị gán nhầm blood → `lineage_role=spouse` để không thành gốc rời trên phả đồ.
4. Exporter: `is_nguyen_external_note()` loại khỏi `compute_main_ids()`.

## Bằng chứng

- D1 vá: 37 changes.
- Main tree: 318→**315** (bớt Nguyễn Hiếu, Nguyễn Thị Ngà, Nguyễn Văn Tấu…).
- Gốc dòng máu chính: TỎ PHỤ (197). Còn 5 mảnh Vũ đời 5 thiếu father (Giỏi/Hoàng/Linh/Soi/Xoan) — dữ liệu nguồn, không phải Nguyễn.
- Search vẫn thấy Nguyễn Hiếu / Nguyễn Thị Ngà với `tree_scope=external`.
