# Plan — Vợ luôn bên phải chồng

**Thời điểm:** 2026-07-20 01:43 (UTC+7)

## Mục tiêu

Trong ô gia đình (`fam:<husbandId>`), chồng luôn nằm trái, vợ (các bà theo `wifeOrder`) luôn nằm phải.

## Cách làm

- Gán `familySlot`: chồng `0`, vợ `1..N` theo thứ tự.
- `groupTemplate` GridLayout dùng `comparer` theo `familySlot`.
- Không đổi schema/API.

## Check

Browser family view: TỎ PHỤ trái, TỔ MẪU phải; các cặp khác tương tự.
