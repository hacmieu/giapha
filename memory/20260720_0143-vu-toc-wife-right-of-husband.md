# Memory — Vợ luôn bên phải chồng

**Thời điểm:** 2026-07-20 01:43 (UTC+7)

## Quy ước

Trong ô gia đình Cloudflare/Django-style:

- Chồng: `familySlot = 0` (trái)
- Vợ theo `wifeOrder`: `familySlot = 1..N` (phải)

`groupTemplate` GridLayout dùng `SortingAscending` + `comparer` theo `familySlot`. Không dựa vào thứ tự insert nodeDataArray.

## Kiểm chứng live

TỎ PHỤ trái / TỔ MẪU phải; Vũ Văn Kế trái / Vợ Vũ Văn Kế phải.
