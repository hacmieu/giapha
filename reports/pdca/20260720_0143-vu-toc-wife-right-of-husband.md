# PDCA Report — Vợ luôn bên phải chồng

**Thời điểm:** 2026-07-20 01:43 (UTC+7)  
**Plan:** [../../plans/20260720_0143-vu-toc-wife-right-of-husband.md](../../plans/20260720_0143-vu-toc-wife-right-of-husband.md)

## Context

Ô gia đình đã gom chồng+vợ nhưng chưa khóa thứ tự ngang.

## Plan

`familySlot` + GridLayout comparer.

## Do

- Chồng `familySlot=0`, vợ `1..N` theo `wifeOrder`.
- `groupTemplate` GridLayout: `SortingAscending` + comparer theo `familySlot`.
- Sort `nodeDataArray` theo group/slot; cache-bust `?v=12`.

## Check

- PASS `node --check public/js/viewer.js`.
- PASS deploy `3f9d4336-c14d-4434-b6d3-38accb099fee`.
- PASS browser: TỎ PHỤ trái / TỔ MẪU phải; Vũ Văn Kế trái / vợ phải.

## Act

- Giữ quy ước này cho mọi view dùng family group.
- Nhiều vợ: thứ tự phải theo `wifeOrder` tăng dần.

## Changed files

- `cloudflare/vu-toc-lang-chuong/public/js/viewer.js`
- `cloudflare/vu-toc-lang-chuong/public/index.html`
- PDCA/SSOT logs + README

## Risks / rollback

Chỉ frontend; rollback Worker version trước.
