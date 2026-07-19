# Plan — Nền Cloudflare độc lập cho Vũ Tộc

**Thời điểm:** 2026-07-19 22:59 (UTC+7)  
**Trạng thái:** Superseded cho phần R2/deploy bởi [20260720_0007-vu-toc-r2-deploy.md](./20260720_0007-vu-toc-r2-deploy.md); D1 foundation vẫn giữ  
**Report:** [../reports/pdca/20260719_2259-vu-toc-cloudflare-foundation.md](../reports/pdca/20260719_2259-vu-toc-cloudflare-foundation.md)  
**Memory:** [../memory/20260719_2259-vu-toc-cloudflare-foundation.md](../memory/20260719_2259-vu-toc-cloudflare-foundation.md)

## Mục tiêu

- Bỏ Django khỏi kiến trúc đích.
- Tạo data contract đúng đặc thù Vũ Tộc.
- Xuất dữ liệu canonical và rehearsal D1.
- Dựng Worker API public/admin, D1 schema và R2 binding.

## Quyết định nghiệp vụ

- Địa danh canonical: **Làng Chuông**.
- 397 hồ sơ đều public ở giai đoạn đầu.
- 306 người có chi thuộc cây chính.
- 91 người không chi thuộc `external`: vẫn tìm/xem/ghi quan hệ được nhưng không tham gia tính đời, thống kê chi hay layout cây chính.
- Cây chính hỗ trợ: Đinh, Đinh nhập tộc, con gái, con gái đóng suất Đinh, hậu duệ con gái, dâu/rể.
- Một Đinh có nhiều vợ; quan hệ mẹ–con quyết định chính xác con của bà nào.

## Do

1. Tạo package `cloudflare/vu-toc-lang-chuong/`.
2. Viết exporter SQLite read-only → canonical JSON + D1 seed + checksum + validation.
3. Tạo D1 schema có family scope, tree scope, lineage role, cha/mẹ, phối ngẫu, draft, import batch và audit.
4. Tạo public API và admin CRUD có Access JWT, optimistic versioning, cycle check.
5. Rehearsal migration và chạy API local.
6. Chọn account Hacmieu, tạo/migrate/seed D1 remote và đối soát.

## Check

- Export đúng 397/306/91 và 8 chi.
- Không orphan, không chu trình, không trùng legacy ID.
- 125 cặp phối ngẫu; wife identity đầy đủ.
- Người hai vợ có 6 con và cả 6 đều map được tới đúng mẹ.
- TypeScript, D1 foreign keys, public/external isolation, CRUD và deploy dry-run phải pass.

## Rollback

- Chưa thay đổi Django runtime và chưa deploy Worker/site; chỉ D1 remote đã được tạo.
- D1 remote đã có dữ liệu; rollback remote dùng export backup rồi xóa database theo phê duyệt riêng.
- Xóa local `.wrangler`/`exports` là quay lại trạng thái trước rehearsal.
- Dữ liệu nguồn `db.sqlite3` chỉ được mở read-only.
