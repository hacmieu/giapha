# Memory — Tách Vũ Tộc sang Cloudflare

**Thời điểm:** 2026-07-19 22:47 (UTC+7)  
**Plan:** [../plans/20260719_2247-vu-toc-cloudflare-separation.md](../plans/20260719_2247-vu-toc-cloudflare-separation.md)  
**Report:** [../reports/pdca/20260719_2247-vu-toc-cloudflare-separation.md](../reports/pdca/20260719_2247-vu-toc-cloudflare-separation.md)

## Lesson learned

1. Vũ Tộc và Trần Tộc là hai data domain khác nhau, không chỉ khác thương hiệu:
   - Vũ Tộc: 397 người, 8 chi, cha + mẹ, người phối ngẫu là thành viên đầy đủ, dâu/rể, cháu ngoại, privacy và tự khai.
   - Trần Tộc: 547 người, phụ hệ, vợ là record phụ/text, phù hợp viewer nhưng không đủ cho CRUD Vũ Tộc.
2. Chỉ nên tái sử dụng UX của `drop/genealogy-viewer/`, không tái sử dụng JSON/schema Trần Tộc.
3. Static Drop không thể là nguồn CRUD. Bản Vũ Tộc cần Worker API + D1; ảnh dùng R2.
4. Public và admin nên tách ranh giới triển khai. Cloudflare Access bảo vệ admin, nhưng API ghi vẫn phải xác minh JWT.
5. Cờ `is_public=true` của toàn bộ 397 người không phải bằng chứng rằng mọi trường dữ liệu đều được phép công khai; cần privacy matrix trước migration.
6. Schema Django hiện không thật sự multi-tenant: `FamilyMember` không có `family_id` trực tiếp và nhiều API query toàn cục. Site độc lập giải quyết nhu cầu trước mắt, nhưng schema D1 vẫn nên mang `family_id`.
7. Hai diff `api/views.py` và `templates/core/relationships.html` là công việc quan hệ đang dở; không gộp vào package Cloudflare trước khi review/test riêng.
8. Cần xác nhận địa danh trước khi khóa branding: yêu cầu ghi “Làng Chuông”, còn dữ liệu hiện lưu “Làng Chương (Hữu Chung)”.
9. 91 người không có `chi` là blocker export: không thể suy ra họ chỉ qua branch nullable.
10. Không tái hiện draft Django dựa trên IP / possession code ngắn; import mới phải đi R2 → staging → duyệt → merge.
11. GoJS CDN ngoài và thiếu test tự động hiện hữu là nợ kỹ thuật cần đóng trước production.

## Reusable decision

- Kiến trúc chuẩn: một codebase Worker TypeScript, hai deployment public/admin, dùng chung D1 và R2.
- D1 phải mô hình hóa người, chi, cha/mẹ, phối ngẫu và quan hệ; không dùng một blob JSON làm source of truth.
- Viewer chỉ nhận DTO public đã lọc từ server.
- Migration: UUID mới + `legacy_id` Django, staging batch, checksum, đối soát cạnh, rollback Django read-only.
- Export hai lớp: canonical JSON versioned + projection GoJS cho viewer.

## Next

Thực hiện PDCA riêng cho Vòng 0: backup, data dictionary, privacy matrix, phân loại 91 người không chi, chuẩn hóa spouse/social relation và migration rehearsal.
