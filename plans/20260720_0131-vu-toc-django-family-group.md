# Plan — Gom gia đình vợ chồng kiểu Django

**Thời điểm:** 2026-07-20 01:31 (UTC+7)

## Mục tiêu

Port cách Django gom vợ–chồng vào một family group trên phả đồ Vũ Tộc Cloudflare, áp dụng cho view **Gia đình mở rộng** (và Quan hệ khác khi có phối ngẫu).

## Tham chiếu Django

`templates/core/relationships.html` + `api/views.py`:

1. Tạo node nhóm `fam_<husbandId>` (`isGroup`, `isFamily`).
2. Gán `group` cho chồng và các vợ (theo `wife_order`).
3. `groupTemplate` = GridLayout ngang + viền hồng nét đứt.
4. Link cha → con đi từ `fam_<cha>` đến `fam_<con>` (hoặc person nếu chưa có nhóm).
5. Link mẹ giữ dạng dashed hồng person→person (thông tin).
6. Không cần spouse link rời để “ghép đôi” — grouping đã làm việc đó.

## Phạm vi Do

- `public/js/viewer.js`: groupTemplate + projection family/relations.
- Cache-bust `index.html`.
- PDCA/SSOT logs. Không đổi schema/API.

## Giữ nguyên

- View **Dòng chính**: vẫn TreeModel, spouse chỉ là text trên thẻ (kiểu Trần Tộc drop).

## Check

- Typecheck/syntax.
- Browser: family view hiện chồng + vợ trong khối hồng; con nối từ khối cha.
- Deploy + push.
