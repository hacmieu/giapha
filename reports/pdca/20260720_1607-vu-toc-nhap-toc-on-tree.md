# PDCA Report — Nhập tộc trên cây (badge NT)

Date: 2026-07-20  
Owner: Auto  
Phase: 2  
Status: done

## 1. Context

User muốn người nhập tộc **gắn vào cây** nhưng **khác biệt** so với Đinh/con gái thuần huyết thống.

## 2. Plan

- Role: `daughter_contributor`, `dinh_adopted`.
- Layout: couple group `fam:<chồng>` trên Dòng chính.
- Style: tím + NT badge.

## 3. Do

- `viewer.js`: `isNhapTocRole`, `buildLineageGraph`, `applyLineageView`, styling.
- `index.html`: legend nhập tộc.
- `data-contract.md`: mục hiển thị.

## 4. Check

- D1: 2 người `daughter_contributor` (01.04.001, 05.04.008).
- Deploy public (this turn).
- UAT: Vũ Văn Khanh + Vũ Thị Được cùng ô, bà có NT.

## 5. Act

- Exporter gán `daughter_contributor` khi `is_dinh` nữ.
- Admin: preset “Nhập tộc” khi promote dâu ngoại.

## 6. Changed files

- `public/js/viewer.js`, `public/index.html`, `docs/data-contract.md`
- PDCA/SSOT

## 7. Risks & rollback

- TreeLayout với graph phức t hơn TreeModel — theo dõi performance.
- Rollback: redeploy viewer v15.

## 8. Next actions

1. Hard refresh → Dòng chính → kiểm tra Vũ Thị Được.
2. Vũ Thị Nguyệt (05.04.008) tương tự.
