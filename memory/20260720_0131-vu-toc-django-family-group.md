# Memory — Gom gia đình vợ chồng kiểu Django

**Thời điểm:** 2026-07-20 01:31 (UTC+7)

## Bài học

- Viewer Trần Tộc drop **không** gom vợ chồng: spouse chỉ là chuỗi trên thẻ + TreeModel theo `fatherId`.
- Gom thật nằm ở Django `templates/core/relationships.html` (+ `genogram_gojs.html`):
  - Tạo `Group` `fam_<husbandId>`.
  - Chồng + vợ(s) nhận `group`.
  - `groupTemplate` = GridLayout ngang + viền hồng nét đứt.
  - Link cha đi từ/tới **family group**, không person→person.
  - Link mẹ dashed hồng là cạnh thông tin person→person.
- Cloudflare Vũ Tộc trước đây dùng spouse dashed link rời → bố cục tách vợ khỏi chồng; đã port projection Django sang view `family`/`relations`.

## Quy ước giữ

| View | Cách vẽ phối ngẫu |
|------|-------------------|
| Dòng chính | Text trên thẻ (compact) |
| Gia đình mở rộng / Quan hệ khác | Ô `fam:<husbandId>` chứa chồng + vợ |

## Chi tiết kỹ thuật

- `wifePersonId` xác định vợ; fallback theo gender.
- Nhiều vợ: cùng group, nhãn `Bà N` theo `wifeOrder`.
- Không tạo spouse link ngoài group — grouping đã thể hiện quan hệ.
- Con nối từ `fam:cha` → `fam:con` (hoặc person nếu chưa lập gia đình).
