# Plan — Sửa hồ sơ từ Public + ngoại tộc nhập họ

**Thời điểm:** 2026-07-20 15:46 (UTC+7)

## Vấn đề

1. User là admin nhưng trên **phả đồ công khai** không sửa được — Admin nằm hostname riêng, có Cloudflare Access.
2. Case **Vũ Thị Được** (01.04.001): ngoại tộc → lấy **Vũ Văn Khanh** → nhập họ thành Đinh; con (vd **Vũ Huy Hoàng**) chỉ có mẹ, thiếu cha trên modal.

## Hướng xử lý

### A. UX Admin từ Public

- Public = **chỉ xem** (an toàn, không cần Access).
- Modal hồ sơ: nút **Sửa hồ sơ trong Admin** + link footer **Quản trị (Admin)**.
- Admin deep-link `?ma=01.04.001` tự mở hồ sơ.

### B. Mô hình dữ liệu nhập tộc

| Trường | Sau nhập tộc |
|--------|----------------|
| `lineage_role` | `daughter_contributor` |
| `is_dinh` | `true` |
| `tree_scope` | `main` |
| Quan hệ vợ–chồng | giữ `spouse_relations` |
| Con chung | **father + mother** trong `parent_relations` |

Chồng (Đinh nam): `lineage_role=dinh` nếu thuộc chi (không để `spouse` nếu là huyết thống).

## Do

- UI public + admin deep-link
- Cập nhật `docs/data-contract.md`
- Vá D1 live: Vũ Thị Được, Vũ Văn Khanh, 5 con thêm cha
- PDCA + SSOT

## Status

**Done** — deploy public+admin; D1 patched.

Report: `reports/pdca/20260720_1546-vu-toc-admin-edit-and-nhap-toc.md`
