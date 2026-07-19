# Memory — Nền Cloudflare Vũ Tộc

**Thời điểm:** 2026-07-19 22:59 (UTC+7)  
**Plan:** [../plans/20260719_2259-vu-toc-cloudflare-foundation.md](../plans/20260719_2259-vu-toc-cloudflare-foundation.md)  
**Report:** [../reports/pdca/20260719_2259-vu-toc-cloudflare-foundation.md](../reports/pdca/20260719_2259-vu-toc-cloudflare-foundation.md)

## Quyết định tái sử dụng

1. Cloudflare là hệ thống đích độc lập; không giữ Django làm backend.
2. `tree_scope` phải tách cây chính khỏi quan hệ ngoài:
   - 306 `main`.
   - 91 `external`.
3. External vẫn là person đầy đủ, public/search/detail được; chỉ bị loại khỏi tính đời, chi và layout cây chính.
4. Vai trò gia phả không đồng nhất với giới tính: tách `lineage_role`, `is_dinh`, `member_type`.
5. Quan hệ nhiều vợ cần hai lớp:
   - `wife_person_id` + `wife_order` xác định bà.
   - `parent_relations(mother)` xác định con của bà nào.
6. Dữ liệu hiện có map đủ 6/6 người con của trường hợp hai vợ tới đúng mẹ; chỉ thiếu thứ tự Bà Cả/Bà Hai của 2 cặp.
7. Export phải deterministic bằng UUIDv5, giữ Django ID trong `legacy_id`, kiểm tra duplicate trước seed.
8. Artifact canonical/seed chứa PII phải gitignore; chỉ commit code/schema/report.
9. Public/admin là hai deployment dùng chung D1/R2; API admin vẫn tự xác minh Access JWT.
10. Máy hiện dùng Node 18; project đóng gói local Node 22 để Wrangler 4.112 chạy tái lập được.
11. D1 remote import không nhận `BEGIN TRANSACTION` trong SQL file; Wrangler remote import tự rollback khi lỗi. Seed generator không được bọc `BEGIN/COMMIT`.
12. Account Hacmieu chưa bật R2 (API code `10042`); không deploy Worker có R2 binding trước khi chủ account kích hoạt dịch vụ.

## Bằng chứng

- Export: 397 người, 8 chi, 503 parent relations, 125 spouse relations.
- Integrity: 0 orphan, 0 cycle, 0 duplicate legacy ID, 0 D1 FK error.
- Worker: typecheck, API smoke và hai deploy dry-run đều pass.
- Remote D1 APAC `f6f21aeb-b32b-43c1-92b2-543681ec0ad6`: 397/306/91, 0 FK error.

## Next

Bật R2 trên account Hacmieu; sau đó tạo bucket, Access và deploy staging. Không đưa admin lên production khi audience/team domain còn trống.
