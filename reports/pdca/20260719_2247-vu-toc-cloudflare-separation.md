# PDCA Report — Phương án tách Vũ Tộc Làng Chuông

**Thời điểm:** 2026-07-19 22:47 (UTC+7)  
**Phạm vi:** Khảo sát và thiết kế; chưa sửa runtime, schema hay deploy  
**Plan:** [../../plans/20260719_2247-vu-toc-cloudflare-separation.md](../../plans/20260719_2247-vu-toc-cloudflare-separation.md)  
**Memory:** [../../memory/20260719_2247-vu-toc-cloudflare-separation.md](../../memory/20260719_2247-vu-toc-cloudflare-separation.md)

## 1. Context

Yêu cầu là tách Vũ Tộc khỏi Django, dùng UX của site Trần Tộc Chanh Thôn nhưng giữ mô hình dữ liệu Vũ Tộc chi tiết hơn, chạy hoàn toàn trên Cloudflare và vẫn CRUD được.

Repository hiện có:

- Vũ Tộc: Django `Family`/`Chi`/`FamilyMember` và các quan hệ.
- Trần Tộc: `Genealogy*`, snapshot GoJS và static Worker tại `drop/genealogy-viewer/`.
- Hai thay đổi chưa commit ở `api/views.py` và `templates/core/relationships.html`.

## 2. Plan

- Đọc Single Source of Truth và các ghi nhớ liên quan viewer/deploy.
- Đọc toàn bộ git diff hiện tại.
- So sánh schema, API, dữ liệu thật trong SQLite và package Cloudflare hiện có.
- Kiểm tra tài liệu Cloudflare hiện hành cho Workers Static Assets, D1 và Access.
- Chốt kiến trúc, lộ trình migration, checklist kiểm thử và rollback.

## 3. Do

Đã khảo sát:

- `memory/README.md`, `plans/README.md`, `reports/README.md`.
- `core/models.py`, `api/views.py`, `api/serializers.py`.
- `api/genealogy_views.py`, `api/genealogy_serializers.py`.
- `core/management/commands/import_json.py`.
- `drop/genealogy-viewer/` và `genealogy_data.json`.
- SQLite ở chế độ read-only.
- Tài liệu Cloudflare cập nhật tới 2026 về full-stack Workers, D1 và Access JWT.

Đã tạo phương án:

- Worker Static Assets + Worker API + D1 + R2 + Cloudflare Access.
- Một codebase, public/admin deployment tách biệt và dùng chung storage.
- Migration Vũ Tộc từ schema riêng; chỉ tái sử dụng UX Trần Tộc.

Follow-up từ khảo sát kiến trúc độc lập (architecture map, cùng phiên):

- Xác nhận không có tenant boundary đáng tin trong CRUD Vũ Tộc hiện tại.
- Bổ sung yêu cầu phân loại 91 người không chi, staging import, UUID + `legacy_id`, và không tái dùng auth draft theo IP.
- Ghi nhận gap test tự động và phụ thuộc GoJS CDN cần xử lý trước production.

Không thực hiện:

- Không sửa code runtime.
- Không chạy migration.
- Không deploy hoặc push.
- Không chạm vào hai diff đang mở.

## 4. Check

### Bằng chứng dữ liệu

- Vũ Tộc: 397 người, 117 Đinh, đời 0–7, 8 chi.
- Phân bố chi: 56, 58, 53, 41, 43, 6, 12, 37; tổng 306 người có chi.
- 203 nam, 194 nữ.
- 203 trực hệ, 126 dâu/rể, 68 cháu ngoại.
- 246 có cha, 257 có mẹ, 250 dòng spouse M2M, 49 ghi chú, 1 ảnh.
- 91 người không gắn chi; 1 draft gồm 28 người + 1 ảnh draft.
- Có bất nhất tên địa danh cần chủ họ xác nhận: yêu cầu là “Làng Chuông”, dữ liệu `Family.village` đang ghi “Làng Chương (Hữu Chung)”.
- Trần Tộc: 547 người, đời 4–13, 398 spouse records và 546 quan hệ cha-con; doc cũ còn lệch (522 links / đời 4–12).

### Bằng chứng kiến trúc

- Static Trần Tộc hiện không CRUD: chỉ đọc `public/data/gojs_data.json`.
- Vũ Tộc không thể dùng schema Trần Tộc vì cần mẹ, người phối ngẫu đầy đủ, 8 chi, loại thành viên, privacy, drafts và social relations.
- Django Vũ Tộc không có `family_id` trên `FamilyMember`; API/form chọn quan hệ đang query toàn cục → site Cloudflare phải tạo clan-scoped keys ngay.
- Cloudflare Workers hiện hỗ trợ full-stack static assets + API; D1 phù hợp dữ liệu quan hệ và Access yêu cầu Worker xác minh `Cf-Access-Jwt-Assertion` để bảo vệ đầy đủ.

### Git diff

- `api/views.py`: thêm prefetch và dữ liệu `wife_relations` cho graph.
- `templates/core/relationships.html`: thay đổi layout/hiển thị GoJS và nhóm vợ chồng.
- Hai diff liên quan module quan hệ Vũ Tộc nhưng đang dở dang; không được nhập chung vào việc tách site nếu chưa review/test riêng.

### Verification summary

- Khảo sát source/data: **PASS**.
- So sánh hai mô hình: **PASS**.
- Khả thi trên Cloudflare: **PASS về thiết kế**.
- Runtime tests: **NOT RUN** — chưa triển khai.
- Migration rehearsal: **NOT RUN**.
- Security/UAT/deploy: **NOT RUN**.

## 5. Act

Thứ tự hành động đề nghị:

1. Duyệt trường public/private và kiến trúc public/admin.
2. Chạy Vòng 0: backup, data dictionary, mapping và chuẩn hóa dữ liệu.
3. Tạo nền Worker/D1/R2/Access trên staging.
4. Migration và đối soát 397 người.
5. Port viewer, sau đó mới làm CRUD.
6. UAT, backup/restore và cutover có rollback.

Không nên:

- Đưa nguyên Django lên Worker.
- Dùng JSON tĩnh làm nguồn dữ liệu CRUD.
- Copy schema Trần Tộc cho Vũ Tộc.
- Mở public toàn bộ 397 hồ sơ chỉ vì cờ hiện tại đang là `true`.

## 6. Changed files

- `plans/20260719_2247-vu-toc-cloudflare-separation.md`
- `reports/pdca/20260719_2247-vu-toc-cloudflare-separation.md`
- `memory/20260719_2247-vu-toc-cloudflare-separation.md`
- Ba file `README.md` SSOT tương ứng.

Không có migration/schema/runtime impact trong vòng thiết kế này.

## 7. Risks & rollback

- Rủi ro lớn nhất là privacy và sai cạnh quan hệ khi chuyển dữ liệu.
- 91 người không chi và draft IP/possession-code là hai rủi ro isolation/security phải xử lý trước cutover.
- Mỗi import phải giữ ID cũ ở `legacy_id`, tạo UUID mới, có staging/checksum/đối soát; không tái dùng importer Django clear/replace.
- D1/R2 cần export định kỳ và diễn tập restore.
- Django giữ read-only cho tới khi production Cloudflare qua nghiệm thu.
- Nếu staging không đạt, xóa deployment/D1 staging; production Django không đổi.

## 8. Next actions

Hạng mục kế tiếp nên là một PDCA riêng: **Vòng 0 — data contract, privacy matrix, phân loại 91 người không chi và migration rehearsal Vũ Tộc**.
