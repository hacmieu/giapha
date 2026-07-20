# Plan — Nhập tộc trên cây Dòng chính (nhận biết NT)

**Thời điểm:** 2026-07-20 16:07 (UTC+7)

## Vấn đề

Người nhập tộc (vd **Vũ Thị Được**) chỉ hiện dòng chữ ♀ trên thẻ chồng — không có thẻ riêng trên cây, khó nhận ra vai trò đặc biệt.

## Hướng

Trên view **Dòng chính**:

1. `daughter_contributor` / `dinh_adopted` → **ô gia đình** cạnh chồng/vợ (giống Gia đình mở rộng).
2. Nhận biết: nền tím nhạt, viền tím đứt nét, badge **NT**, chữ “Nhập tộc”.
3. Dâu/rể thuần (`spouse`) vẫn chỉ ♀/♂ trên thẻ — không lên cây.

## Do

- `buildLineageGraph()` + `applyLineageView()` thay TreeModel thuần.
- Legend + `data-contract.md`.
- Deploy public.

## Status

**Done** — report `20260720_1607-vu-toc-nhap-toc-on-tree.md`.
