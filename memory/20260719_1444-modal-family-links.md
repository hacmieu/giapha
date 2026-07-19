# Memory: Điều hướng gia đình trong modal hồ sơ

- **Thời gian:** 2026-07-19 14:44
- **Phạm vi:** `drop/genealogy-viewer/public/js/genealogy-viewer.js`, `public/css/viewer.css`

## Ghi nhớ
1. **Điều hướng trong modal:** Thân phụ và các con render bằng `<button class="person-link" data-key="...">`; click được bắt bằng event delegation trong `initPersonModal` (không gắn handler từng nút vì `personModalBody.innerHTML` bị thay mỗi lần mở hồ sơ) → gọi lại `showPersonInfo(person)`, modal giữ mở, diagram tự select + scroll node tương ứng.
2. **Phối ngẫu KHÔNG link được:** trường `spouses` trong `gojs_data.json` chỉ là chuỗi tên (vợ không phải node trong TreeModel) → giữ text. Muốn link cần bổ sung node phối ngẫu vào data pipeline phía Django.
3. Mục con hiển thị danh sách tên đầy đủ kèm số lượng "Con trong phả đồ (N)" thay vì chỉ "N người".
4. `field()` luôn escape; khi cần nhúng HTML đã kiểm soát dùng `fieldRaw()` (chỉ dùng với markup tự sinh, tên người vẫn qua `escapeHtml` trong `personLink`).
5. Cache-bust hiện tại: JS `?v=13`, CSS `?v=10`. Deploy version `083b339a`.
