# Data contract Vũ Tộc Làng Chuông

## Nguyên tắc

- Cloudflare là hệ thống mới độc lập; Django/SQLite chỉ là nguồn migration một lần.
- `family_id` bắt buộc trên mọi dữ liệu nghiệp vụ.
- ID mới là UUID ổn định; ID Django chỉ lưu ở `legacy_id`.
- Mọi hồ sơ hiện công khai. Schema vẫn có `visibility` để khóa người xem ở giai đoạn sau.
- Cây chính và mạng quan hệ ngoài là hai projection của cùng một kho người; không xóa người ngoài.

## Phạm vi cây

`tree_scope`:

- `main`: dòng chính = người có chi **+ tổ tiên trực hệ** của họ (ví dụ Thủy Tổ TỎ PHỤ/TỔ MẪU không gán chi).
- `external`: quan hệ ngoài / ghi chú — không tham gia layout cây chính. Gồm người không thuộc nhánh tổ tiên–chi, và **tạm thời** họ Nguyễn/Nguyên không phải dâu-rể (`spouse_in`).

API cây mặc định chỉ trả `tree_scope=main`. Hồ sơ chi tiết / tìm kiếm vẫn thấy `external`; giao diện không nối họ làm thay đổi dòng chính.

## Vai trò gia phả

`lineage_role` độc lập với giới tính:

- `dinh`: nam trực hệ (kể cả Thủy Tổ đã tính Đinh).
- `dinh_adopted`: Đinh nhập tộc/con nuôi thuộc họ.
- `daughter`: con gái trong họ.
- `daughter_contributor`: con gái **nhập tộc / đóng suất Đinh** (`gender=female`, `is_dinh=true`) — ví dụ dâu ngoại tộc xin vào họ.
- `spouse`: dâu/rể (kể cả bản ghi tên kiểu `Vợ …` bị gán nhầm trong nguồn).
- `daughter_descendant`: con/cháu của con gái.
- `external`: quan hệ ngoài / họ Nguyễn ghi chú tạm.

Quy tắc projection:

1. `main` = có chi **hoặc** là tổ tiên (father/mother đệ quy) của người có chi. Không còn luật cứng “không chi ⇒ external” (sẽ cắt Thủy Tổ).
2. Họ **Nguyễn/Nguyên** với `member_type ≠ spouse_in` tạm thời `external` (ngoại tộc viết để biết thêm; gắn lại sau khi quan hệ rõ). Dâu/rể họ Nguyễn vẫn là `spouse` trên thẻ.
3. Người có chi vẫn ở cây chính nếu không bị luật Nguyễn tạm loại, kể cả con gái, dâu/rể và hậu duệ con gái đã ghi vào chi.
4. `is_dinh` không được suy diễn từ giới tính; giữ nguyên dữ liệu nguồn. Nam `is_dinh` luôn `lineage_role=dinh`.
5. Con của một bà được xác định bằng `parent_relations` có `relation_type=mother`; không suy diễn từ thứ tự vợ.
6. Một người có thể có nhiều phối ngẫu. `spouse_relations.wife_person_id` xác định bà nào; `wife_order` lưu Bà Cả/Bà Hai khi dữ liệu có.

## Ngoại tộc nhập họ (ví dụ: Vũ Thị Được)

Khi một phụ nữ ngoại tộc lấy chồng trong họ rồi được công nhận Đinh:

1. **Trước nhập tộc** (tuỳ chọn lưu lịch sử): `lineage_role=spouse` hoặc `external`, `tree_scope=external`.
2. **Sau nhập tộc**: `lineage_role=daughter_contributor`, `is_dinh=true`, `tree_scope=main`, gán `branch_id` + `generation`.
3. Giữ quan hệ vợ–chồng (`spouse_relations`) với chồng (thường là Đinh nam trong chi).
4. **Con chung**: phải có **cả cha lẫn mẹ** trong `parent_relations` — chỉ ghi mẹ (con theo dòng mẹ) sẽ khiến modal thiếu Thân phụ và cây dòng chính không nối đúng.

Admin: mở từ public qua nút **Sửa hồ sơ trong Admin** → `?ma=person_code`.

## Hiển thị nhập tộc trên cây (Dòng chính)

- `daughter_contributor` / `dinh_adopted` được **gắn cạnh chồng/vợ** (ô gia đình `fam:<chồng>`), không chỉ chữ trên thẻ.
- Nhận biết: nền tím nhạt, **viền tím đứt nét**, badge **NT** trên ảnh, chữ “Nhập tộc” dưới tên.
- Dâu/rể thuần (`spouse`) vẫn chỉ hiện ♀/♂ trên thẻ chồng — không lên cây riêng.

## Quyền riêng tư

- Giá trị migration ban đầu: `visibility=public`.
- Public API chỉ dùng allow-list trường, không serialize toàn bộ hàng D1.
- Ảnh nằm trong R2 private; API quyết định có trả ảnh theo `visibility`.
- Draft luôn `admin_only`, không mang sang session key, địa chỉ IP hoặc draft code cũ như một cơ chế đăng nhập.

## Dữ liệu canonical

Exporter sinh:

- `exports/vu-toc-canonical.json`: dữ liệu chuẩn, không commit Git.
- `exports/vu-toc-seed.sql`: dữ liệu để import D1, không commit Git.
- `exports/vu-toc-validation.json`: số liệu và lỗi máy đọc.
- `exports/vu-toc-validation.md`: báo cáo không chứa danh sách tên.
- `exports/SHA256SUMS`: checksum toàn bộ artifact.

Các lỗi orphan, trùng ID, vòng cha/mẹ hoặc sai số tổng phải làm exporter trả exit code khác 0.
