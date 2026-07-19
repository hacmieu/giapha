# Plan: UX trích nhánh phả đồ của một người để in

- **Thời gian:** 2026-07-19 15:10
- **Trạng thái:** design-done
- **Phạm vi:** đề xuất UX/UI, chưa triển khai code
- **Liên quan:** `plans/20260719_1457-zoom-slider-collapsible-controls.md`

## Mục tiêu

Cho khách:
1. Chọn một người làm gốc nhánh.
2. Chọn đời cuối cần lấy (ví dụ người ở Đời 8, lấy đến Đời 11).
3. Xem trước đúng cây hậu duệ trong khoảng Đời 8–11.
4. In hoặc lưu PDF mà không kéo theo 547 người của phả đồ đầy đủ.

## Giả định cần chốt

- “Từ người đó đến đời X” được hiểu là **người được chọn + toàn bộ hậu duệ**, dừng ở đời tuyệt đối X.
- Không lấy anh/chị/em, chú/bác hoặc nhánh họ hàng ngang của người gốc.
- Phối ngẫu hiện chỉ là chuỗi `spouses`, được in trong thẻ người nhưng không tạo node/link riêng.
- Dữ liệu hiện có `key`, `fatherId`, `generation`, đủ để duyệt cây con; không cần API hay migration cho bản static.

## Hướng UX đề xuất

### 1. Hai chế độ cấp cao, không nhồi thêm sidebar

Đặt switch/tab ở đầu vùng nội dung:

```text
┌───────────────────────────────────────────────────────────────┐
│  [ Xem phả đồ ]   [ Trích nhánh & In ]                       │
├───────────────────────────────────────────────────────────────┤
│                         nội dung chế độ                        │
└───────────────────────────────────────────────────────────────┘
```

- Mặc định: `Xem phả đồ`.
- Chọn `Trích nhánh & In`: ẩn sidebar xem cây và mở workspace chuyên cho tác vụ in.
- Trên mobile: tab “Trích nhánh & In” mở thành màn hình toàn chiều rộng, tránh vừa cây vừa bảng điều khiển.
- Trong modal hồ sơ thêm nút phụ `Trích nhánh người này` để vào thẳng chế độ in và điền sẵn người gốc.

### 2. Luồng 3 bước

```text
┌ Thiết lập đoạn phả đồ ────────────────────────────────────────┐
│ 1  Người gốc                                                 │
│    [ Tìm theo tên hoặc mã gia phả…                       ▾ ]  │
│    Trần Văn Lư · Đời 10 · 4 nhánh con                        │
│                                                               │
│ 2  Lấy hậu duệ đến                                           │
│    [ Đời 12 ▾ ]                                               │
│    Dự kiến: 37 người · 3 đời · phù hợp giấy A3 ngang          │
│                                                               │
│                         [ Xem trước đoạn phả đồ ]              │
└───────────────────────────────────────────────────────────────┘
```

- `Người gốc`: autocomplete đang có, hiển thị thêm đời và mã để phân biệt người trùng tên.
- `Đến đời`: chỉ liệt kê từ đời của người gốc đến đời hậu duệ sâu nhất thực tế. Không cho chọn đời nhỏ hơn đời người gốc.
- Hiển thị kết quả ước tính trước khi render: số người, số đời, số nhánh con trực tiếp và khổ giấy gợi ý.
- Dùng nhãn **“Đến đời thứ X”**, không dùng “X đời”, để tránh nhầm giữa đời tuyệt đối và độ sâu tương đối.

### 3. Preview là sản phẩm in, không phải cây tương tác thu nhỏ

```text
┌ Trần tộc Chanh Thôn · Nhánh Trần Văn Lư · Đời 10–12 ─────────┐
│ [← Sửa lựa chọn]  A4/A3 [A3 ngang ▾] [Chi tiết ▾] [In / PDF] │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│                 [Trần Văn Lư · Đời 10]                        │
│                     ├────────┬────────┐                        │
│                   ...      ...      ...                        │
│                                                               │
│  37 người · Dữ liệu cập nhật 19/07/2026                       │
└───────────────────────────────────────────────────────────────┘
```

- Header in ghi rõ tên tộc, người gốc, khoảng đời, ngày xuất.
- Preview có nền trắng đúng trang giấy; không dùng nền lưới của viewer.
- Tuỳ chọn khổ: `Tự động`, `A4 ngang`, `A3 ngang`.
- Tuỳ chọn nội dung: tên + đời (mặc định); năm sinh; nơi ở; phối ngẫu; mã gia phả.
- Hai hành động cuối: `In / Lưu PDF` (chính), `Tải PNG` (phụ).
- Khi quay lại sửa lựa chọn phải giữ nguyên người gốc và đời đã chọn.

## Quy tắc in và giới hạn

1. Thuật toán lấy dữ liệu: bắt đầu tại `rootKey`, duyệt `fatherId`, chỉ nhận node có `generation <= endGeneration`.
2. Nếu ≤25 node: gợi ý A4 ngang.
3. Nếu 26–60 node: gợi ý A3 ngang.
4. Nếu >60 node: không ép toàn bộ vào một trang vì chữ sẽ quá nhỏ; cảnh báo và đề nghị:
   - chia mỗi nhánh con trực tiếp thành một trang, hoặc
   - giảm đời cuối.
5. Không cắt một node hoặc đường nối giữa hai trang; mỗi trang con lặp tên người gốc/nhánh ở header.
6. Cỡ chữ bản in tối thiểu 9pt; không “fit bằng mọi giá”.

## Aesthetic direction

- Giữ nhận diện hiện tại: `ink #17324D`, `vermilion #A62C2B`, `bronze #C8943E`, giấy trắng ngà `#FBFAF6`.
- Display/header: Georgia hiện tại; nội dung và điều khiển: Arial/system sans; số liệu/mã dùng font utility monospace.
- Signature: breadcrumb đời chạy ở header bản in (`Đời 10 → Đời 11 → Đời 12`) vừa trang trí vừa giải thích phạm vi.
- Bản in tiết chế: bỏ icon emoji, shadow, nền lưới và điều khiển; chỉ giữ viền mảnh, màu đời và cấu trúc huyết thống.

## Phạm vi triển khai dự kiến

- `drop/genealogy-viewer/public/index.html`: tab chế độ, panel thiết lập, print preview.
- `drop/genealogy-viewer/index.html`: đồng bộ bản đóng gói.
- `drop/genealogy-viewer/public/js/genealogy-viewer.js`: state chế độ, lấy subtree, preview, print.
- `drop/genealogy-viewer/public/css/viewer.css`: tabs, setup panel, print sheet, `@media print`.
- Có thể tách `js/subtree-print.js` nếu logic vượt ~200 dòng.
- **Migration:** không.
- **API:** không cho static viewer; dùng `gojs_data.json`.
- **Rollback:** bỏ tab/panel mới và trả lại nút export ảnh hiện tại; không ảnh hưởng dữ liệu.

## Rủi ro

- Cây rộng gây chữ nhỏ: bắt buộc áp ngưỡng node và chia theo nhánh.
- Tên trùng: autocomplete phải hiển thị mã + đời.
- `fatherId` không hợp lệ/thiếu: báo số người bị loại và không dựng quan hệ giả.
- Print browser khác nhau: kiểm thử Chrome desktop/mobile, A4/A3 landscape và Save as PDF.

## Check thiết kế

- [x] Một tác vụ có một màn hình, không làm sidebar hiện tại phức tạp thêm.
- [x] Mobile không hiển thị đồng thời cây đầy đủ và form in.
- [x] Người dùng biết trước số người/khổ giấy trước khi render.
- [x] Có đường tắt từ modal hồ sơ.
- [x] Có giới hạn để bản in luôn đọc được.
- [x] Không cần thay schema hoặc API.

## Quyết định đề xuất

Triển khai theo thứ tự:
1. MVP: tab + chọn người + đến đời + preview một trang + Print/PDF.
2. Sau đo thực tế: tự chia trang theo nhánh khi >60 node.
3. Cuối cùng mới thêm tuỳ chọn nội dung và PNG.
