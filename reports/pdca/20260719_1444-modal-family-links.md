# PDCA: Link Thân phụ / con trong modal hồ sơ

- **Thời gian:** 2026-07-19 14:44
- **Trạng thái:** done
- **Plan:** `plans/20260719_1444-modal-family-links.md`
- **Memory:** `memory/20260719_1444-modal-family-links.md`

## Plan
Yêu cầu: modal phải link tới Thân phụ và các con (trước đây chỉ có text, mục con chỉ ghi số lượng). Đánh giá khả thi: có `key`/`fatherId` trong data tĩnh → làm được, không bỏ qua.

## Do
1. `showPersonInfo`: thêm `personLink(person)` render `<button class="person-link" data-key>`; Thân phụ thành link; mục con đổi thành "Con trong phả đồ (N)" + danh sách tên các con là link (field wide). Tên đều qua `escapeHtml`.
2. `initPersonModal`: event delegation `click .person-link` → tìm person theo `data-key` → `showPersonInfo(person)` (modal giữ mở, diagram select + scroll node).
3. CSS: `.person-link` (nút dạng link màu vermilion, underline, hover đậm), `.person-link-list` (flex wrap).
4. Bump JS `?v=13`, CSS `?v=10`; `wrangler deploy` → version `083b339a`.

## Check
- Live, modal "Trần Quốc Lạ": Thân phụ "Trần Văn Lư" + 3 con đều là link.
- Click "Trần Văn Lư" → modal chuyển hồ sơ ngay: cha "Trần Văn Tỳ", 4 con ("Trần Quốc Bảo (Xá)", "Trần Quốc Lạ", "Trần Quốc Thái", "Trần Xuân Ngải") đều là link — điều hướng 2 chiều cha↔con hoạt động.
- Phối ngẫu giữ text ("Lê Thị Đũi") vì data chỉ có chuỗi tên, không có node.

## Act
- Ghi memory: pattern event delegation cho modal, giới hạn dữ liệu phối ngẫu.
- Bước sau (tuỳ chọn): bổ sung node phối ngẫu vào pipeline export `gojs_data.json` phía Django nếu muốn link cả vợ/chồng.
