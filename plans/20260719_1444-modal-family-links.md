# Plan: Link điều hướng Thân phụ / con trong modal hồ sơ

- **Thời gian:** 2026-07-19 14:44
- **Trạng thái:** done
- **Liên quan:** `plans/20260719_1159-tran-toc-viewer-modal.md`

## Bối cảnh
Người dùng yêu cầu: trong modal hồ sơ, "Thân phụ" và các con phải là link mở được hồ sơ người đó (hiện chỉ là text tĩnh, mục con chỉ ghi số lượng "N người").

## Khả thi
Khả thi hoàn toàn: dữ liệu tĩnh `gojs_data.json` có `key` + `fatherId` cho từng người; `showPersonInfo(data)` nhận trực tiếp node data → chỉ cần render link mang `data-key` và bắt click. Riêng "Phối ngẫu" (`spouses`) chỉ là chuỗi tên, không có key trong phả đồ → giữ nguyên text (đúng giới hạn dữ liệu).

## Thiết kế
1. `showPersonInfo`:
   - Thân phụ: render `<button class="person-link" data-key="...">` thay vì text.
   - Con: thay "N người" bằng danh sách tên các con, mỗi tên là một `person-link`, tiêu đề "Con trong phả đồ (N)".
   - Tên người luôn qua `escapeHtml`.
2. `initPersonModal`: event delegation trên modal — click `.person-link` → tìm person theo `data-key` trong `genealogyData` → gọi lại `showPersonInfo(person)` (modal giữ mở, diagram tự select + scroll tới node).
3. CSS `.person-link` (button dạng link màu vermilion, underline) + `.person-link-list` (flex wrap).
4. Bump cache JS `?v=13`, CSS `?v=10`; deploy; verify click-through trên live.

## Check items
- [x] `node --check` pass
- [x] Modal Trần Quốc Lạ: Thân phụ "Trần Văn Lư" + 3 con đều là link
- [x] Click Thân phụ → modal chuyển sang hồ sơ Trần Văn Lư (cha "Trần Văn Tỳ", 4 con là link)
- [x] Deploy version 083b339a
