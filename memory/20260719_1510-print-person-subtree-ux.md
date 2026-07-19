# Memory: UX trích nhánh hậu duệ để in

- **Thời gian:** 2026-07-19 15:10
- **Phạm vi:** thiết kế cho static genealogy viewer

## Quy ước sản phẩm

1. Tác vụ in đoạn phả đồ là một **chế độ riêng** tên `Trích nhánh & In`, không nhồi thêm bộ lọc vào sidebar xem cây.
2. Luồng chuẩn: `Người gốc` → `Đến đời thứ X` → `Xem trước` → `In / Lưu PDF`.
3. “Đến đời thứ X” là đời tuyệt đối trong gia phả, không phải “thêm X đời”. Dropdown chỉ cho chọn từ đời người gốc đến đời hậu duệ sâu nhất thực tế.
4. Modal hồ sơ nên có đường tắt `Trích nhánh người này`.
5. Preview là trang in thật: nền trắng, có header tộc/nhánh/khoảng đời/ngày xuất; không mang nền lưới hay điều khiển của viewer.

## Quy tắc dữ liệu

- Lấy subtree theo `rootKey`: duyệt node có `fatherId` trỏ về node trong tập, dừng khi `generation > endGeneration`.
- Spouse hiện là chuỗi `spouses`: in trong thẻ người, không dựng node/link phối ngẫu.
- Tên trùng phải phân biệt bằng `name + generation + key`.
- Không cần migration/API cho static viewer hiện tại.

## Quy tắc khả năng đọc khi in

- ≤25 người: gợi ý A4 ngang.
- 26–60 người: gợi ý A3 ngang.
- >60 người: cảnh báo; ưu tiên chia theo từng nhánh con trực tiếp hoặc giảm đời cuối.
- Không thu nhỏ vô hạn để nhét một trang; cỡ chữ in tối thiểu 9pt.
- Không cắt node hoặc đường nối qua ranh giới trang.

## Bài học UX

- Không hiển thị đồng thời cây đầy đủ và form in trên mobile.
- Báo trước số người, số đời, số nhánh và khổ giấy gợi ý trước khi render preview.
- Một tab cấp cao tốt hơn thêm nhiều nút nổi/sidebar cho tác vụ có mục tiêu riêng.
- Aesthetic bản in phải tiết chế: bỏ emoji, shadow và nền lưới; giữ màu thế hệ, viền mảnh, breadcrumb đời.

## Nguồn kế hoạch

`plans/20260719_1510-print-person-subtree-ux.md`
