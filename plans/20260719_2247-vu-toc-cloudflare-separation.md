# Plan — Tách Vũ Tộc Làng Chuông sang Cloudflare

**Thời điểm:** 2026-07-19 22:47 (UTC+7)  
**Trạng thái:** Thiết kế PDCA hoàn tất, chưa triển khai runtime  
**Report:** [../reports/pdca/20260719_2247-vu-toc-cloudflare-separation.md](../reports/pdca/20260719_2247-vu-toc-cloudflare-separation.md)  
**Memory:** [../memory/20260719_2247-vu-toc-cloudflare-separation.md](../memory/20260719_2247-vu-toc-cloudflare-separation.md)

## 1. Mục tiêu

- Tách Vũ Tộc Làng Chuông khỏi Django thành site Cloudflare độc lập.
- Tái sử dụng UX tốt của Trần Tộc Chanh Thôn: phả đồ GoJS, tìm kiếm, lọc đời, xem nhánh, mobile, modal hồ sơ và in.
- Giữ đúng mô hình dữ liệu riêng, chi tiết hơn của Vũ Tộc.
- Có CRUD an toàn mà không cần duy trì hosting Django.
- Không làm ảnh hưởng module Trần Tộc và hai thay đổi chưa commit hiện có.

## 2. Kết luận khả thi

**Khả thi.** Không nên chuyển Django nguyên khối lên Cloudflare. Nên tạo một ứng dụng Cloudflare full-stack mới:

- Cloudflare Workers Static Assets: giao diện viewer/admin.
- Worker API: API đọc công khai và CRUD riêng tư.
- D1: dữ liệu quan hệ.
- R2: ảnh thành viên và bản sao lưu xuất dữ liệu.
- Cloudflare Access: xác thực khu vực quản trị; Worker vẫn kiểm tra JWT ở API ghi.

Để public viewer không bị khóa cùng trang quản trị, dùng **một codebase, hai deployment/hostname**:

1. Public Worker: viewer và API chỉ đọc.
2. Admin Worker: CRUD, được Cloudflare Access bảo vệ.

Hai Worker dùng chung D1/R2. Đây là ranh giới bảo mật rõ hơn việc chỉ ẩn nút sửa trên frontend.

## 3. Dữ liệu hiện có và khác biệt

### Vũ Tộc — mô hình `FamilyMember`

- 397 người, 8 chi, đời 0–7; 203 nam, 194 nữ.
- 203 trực hệ, 126 dâu/rể, 68 cháu ngoại.
- Có `father`, `mother`, quan hệ phối ngẫu hai chiều, thứ tự sinh, loại thành viên, tính Đinh, ngày sinh/mất, âm lịch, ghi chú, ảnh, riêng tư, bản tự khai và quan hệ xã hội.
- 246 bản ghi có cha, 257 có mẹ, 250 dòng liên kết M2M phối ngẫu, 49 có ghi chú, 1 có ảnh.
- 306 người gắn chi; **91 người không có `chi`** nên phải phân loại thủ công trước export.
- Có 1 bản tự khai (`draft`) gồm 28 người và 1 ảnh draft; media hiện chỉ có 1 ảnh thật + placeholder.
- Toàn bộ 397 bản ghi hiện đang `is_public=true`; phải rà soát trước khi công khai.

### Trần Tộc — mô hình `GenealogyPerson`

- 547 người, đời 4–13.
- Mô hình phụ hệ: `father_id`; 398 bản ghi vợ gắn vào 388 người.
- Không biểu diễn mẹ và vợ như người đầy đủ trong cây; dữ liệu vợ chủ yếu là tên/năm sinh.
- Viewer static hiện tốt hơn, nhưng schema không đủ cho Vũ Tộc.

### Quyết định

- Tái sử dụng/generic hóa UI từ `drop/genealogy-viewer/`.
- Không copy `genealogy_data.json` hoặc schema `GenealogyPerson`.
- Xuất Vũ Tộc trực tiếp từ `Family`, `Chi`, `FamilyMember` và các bảng quan hệ.

## 4. Schema D1 đề xuất

Mọi bảng nghiệp vụ đều có `family_id` dù bản đầu chỉ có một dòng họ:

- `families`: nhận diện, địa danh, cấu hình.
- `branches`: 8 chi, tên, mô tả, thứ tự.
- `persons`: `legacy_id`, mã người, tên, giới tính, chi, đời, loại, tính Đinh, ngày sinh/mất, ghi chú, ảnh, mức công khai, `version`, timestamps.
- `parent_relations`: con, cha/mẹ, loại quan hệ; không suy diễn mẹ từ phối ngẫu.
- `spouse_relations`: hai người, thứ tự bà, tình trạng, ngày cưới, ghi chú.
- `social_relations`: quan hệ mở rộng và quyền công khai.
- `draft_submissions`, `draft_persons`, `draft_spouse_relations`: để chuyển chức năng tự khai ở giai đoạn sau.
- `import_batches`: mỗi lần import/merge có trạng thái staging → validated → approved → applied.
- `audit_logs`: ai sửa gì, trước/sau, thời điểm.

Ràng buộc bắt buộc:

- Foreign key và index theo `family_id`, `branch_id`, `generation`, `father/mother`.
- Unique theo `(family_id, legacy_id)` và mã người theo họ; ID ổn định dùng UUID mới, Django ID chỉ giữ ở `legacy_id`.
- Chống vòng lặp cha/mẹ trong tầng dịch vụ.
- Ghi theo transaction; dùng `version`/`updated_at` để chống ghi đè khi hai phiên cùng sửa.

## 5. API và quyền

Public:

- `GET /api/public/tree`
- `GET /api/public/persons/:id`
- `GET /api/public/search`
- Chỉ trả trường được phép công khai; không trả dữ liệu riêng rồi ẩn bằng JavaScript.

Admin:

- CRUD người, chi, cha/mẹ, phối ngẫu, quan hệ xã hội, ảnh.
- Import/export JSON; duyệt bản tự khai ở giai đoạn sau.
- Luồng import chuẩn: upload nguồn lên R2 → parse vào staging → báo cáo validation → duyệt tường minh → merge transaction.
- Mọi endpoint ghi xác minh Cloudflare Access JWT, kiểm tra email/role cho phép và ghi audit log.
- CSRF/origin check cho request trình duyệt; validate payload ở server.
- Không mang sang cơ chế draft Django dựa trên IP hoặc chỉ possession code ngắn.

Ảnh:

- Lưu R2 bằng object key, không lưu URL cố định trong D1.
- Ảnh công khai đi qua endpoint/route có kiểm tra visibility; bucket không public mặc định.
- Export canonical JSON versioned; đồng thời sinh projection GoJS cho viewer.

## 6. Các vòng triển khai

### Vòng 0 — Đóng băng và đặc tả dữ liệu

- Sao lưu `db.sqlite3`, media và export JSON có checksum.
- Chốt trường public/private.
- Xác nhận tên địa danh chính thức: yêu cầu dùng “Làng Chuông”, nhưng bản ghi `Family.village` hiện là “Làng Chương (Hữu Chung)”.
- Phân loại 91 người không có chi: thủy tổ, chờ gán chi, hay lỗi dữ liệu.
- Viết data dictionary Vũ Tộc và mapping Django → D1.
- Dọn bất nhất legacy: `SocialLink.link_type='blood_out'` không còn trong choices hiện tại; chuẩn hóa 250 dòng M2M phối ngẫu thành cặp duy nhất.
- Rà soát license/availability GoJS (viewer Trần đang load CDN ngoài).

### Vòng 1 — Nền Cloudflare

- Tạo package Worker TypeScript độc lập, D1 migrations và R2 binding.
- Tách viewer Trần Tộc thành shell dùng cấu hình thương hiệu/dataset.
- Thiết lập public/admin deployments và Access.

### Vòng 2 — Migration dữ liệu Vũ Tộc

- Viết exporter chỉ đọc từ SQLite.
- Import staging D1 theo thứ tự family → chi → persons → relations.
- Reconcile ID và tạo báo cáo lỗi, không bỏ qua dữ liệu im lặng.

### Vòng 3 — Viewer ngang/tốt hơn Trần Tộc

- Tree, modal, search, lọc đời, subtree, mobile, zoom/pan, in/PDF.
- Bổ sung đặc thù Vũ Tộc: 8 chi, cha và mẹ, dâu/rể, cháu ngoại, nhiều loại quan hệ.

### Vòng 4 — CRUD quản trị

- Danh sách/tìm kiếm, form người, quan hệ cha-mẹ/phối ngẫu, upload ảnh.
- Preview thay đổi quan hệ trước khi lưu.
- Audit log, export và phục hồi thử nghiệm.

### Vòng 5 — Cutover

- UAT trên staging, đối soát dữ liệu, kiểm tra quyền và mobile.
- Deploy production, gắn domain, quan sát lỗi.
- Giữ Django read-only trong thời gian rollback; chỉ ngừng hosting sau khi nghiệm thu.

## 7. Check bắt buộc

- Tổng người = 397; từng chi lần lượt = 56, 58, 53, 41, 43, 6, 12, 37; 91 người không gắn chi được giải thích.
- Đối soát giới tính, loại thành viên, đời, cha, mẹ, phối ngẫu, ghi chú, ngày và ảnh.
- Không có orphan, vòng quan hệ hoặc liên kết sang family khác.
- Public API không lộ trường private; API ghi bị từ chối nếu thiếu/sai JWT.
- CRUD create/update/delete/restore và xung đột version đều có test.
- Viewer đạt parity với bản Trần Tộc trên desktop/mobile.
- Export mới có thể import lại và cho cùng checksum logic.

## 8. Rủi ro và rollback

- **Rò rỉ dữ liệu:** mặc định hồ sơ chi tiết là private cho tới khi duyệt.
- **Sai quan hệ khi chuyển đổi:** giữ `legacy_id`, import staging, đối soát từng cạnh.
- **Mất ảnh:** R2 private + checksum + bản sao export.
- **CRUD phá cây:** transaction, validation chu trình, version và audit.
- **Cloudflare sự cố/cấu hình sai:** export định kỳ; Django cũ giữ read-only cho tới khi qua thời gian ổn định.
- **Hai diff đang mở:** không gộp `api/views.py` và `templates/core/relationships.html` vào nhánh/package tách site.
- **Không có tenant boundary trong Django hiện tại:** `FamilyMember` không có `family_id` trực tiếp; API/form chọn cha-mẹ/phối ngẫu đang query toàn cục; site Cloudflare phải tạo `family_id`/`clan_id` tường minh ngay từ đầu.
- **Import Django hiện tại không an toàn để tái dùng:** importer có thể clear/replace, thiếu staging/audit; phải viết pipeline mới.
- **Thiếu test tự động hiện hữu:** `core/tests.py`, `api/tests.py`, `accounts/tests.py` gần như trống; site mới phải có test migration + API + quyền từ Vòng 1.

## 9. Tiêu chí hoàn thành

- Vũ Tộc chạy độc lập, không gọi endpoint Django.
- Public xem được; chỉ người được cấp quyền mới CRUD được.
- Đối soát đủ dữ liệu và quan hệ.
- Có backup/restore đã chạy thử.
- Có report deploy, URL production và hướng dẫn vận hành.
