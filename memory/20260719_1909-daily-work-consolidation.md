# Memory — Bài học tổng hợp ngày 2026-07-19

- **Phạm vi:** Genealogy Viewer static trên Cloudflare Workers
- **Production cuối ngày:** `ed9f076e-c26e-483b-b3c5-dfef50082272`
- **Commit runtime cuối ngày:** `2394a73`

## Kết quả cốt lõi

Trong ngày, viewer được nâng từ giao diện static cơ bản thành bản Trần tộc Chanh Thôn
có modal hồ sơ, portrait/fallback, node đồng đều, initial view 70%, điều khiển thu gọn,
mobile hai pane, lọc đến đời và vẽ nhánh hậu duệ. Có 12 hạng mục runtime hoàn thành và
1 thiết kế “Trích nhánh & In” chưa triển khai.

## Quy ước kỹ thuật cần tái sử dụng

1. **GoJS node và ảnh**
   - Giữ kích thước node cố định; tên nhiều dòng và dữ liệu thiếu không được làm đổi chiều cao.
   - Dùng native shape làm fallback đáng tin cậy.
   - SVG phải là XML sạch; không để escape `\"` trong attribute.
2. **Initial view**
   - Một nơi duy nhất chịu trách nhiệm đặt scale/position.
   - Scale chuẩn hiện tại là `0.7`, center node Tổ.
   - Nếu diagram đang `display:none`, dùng `initialViewPending`; không tính viewport khi width = 0.
3. **Điều hướng**
   - Mọi đường dẫn tới một người phải qua `focusPersonOnDiagram`.
   - Nếu model hiện tại là subtree và người nằm ngoài model, khôi phục full tree trước.
4. **Filter/subtree**
   - Filter theo đời phải giữ `generation <= X` để bảo toàn tổ tiên và link.
   - Dropdown/stats phải tính từ dữ liệu thật, không tin metadata hard-code.
   - Subtree mặc định lấy mọi hậu duệ; giới hạn đời là lựa chọn bổ sung.
5. **Mobile**
   - Không hiển thị sidebar và diagram đồng thời trên màn hình hẹp.
   - Dùng tab Điều khiển/Phả đồ; khi pane diagram hiện lại phải gọi cập nhật kích thước GoJS.
   - Zoom dùng slider + `touch-action: manipulation`, panel mặc định thu gọn.
6. **Modal và dữ liệu**
   - Escape mọi dữ liệu đưa vào HTML.
   - Event delegation phù hợp với nội dung modal render lại.
   - Chỉ tạo link khi có key/node; tên phối ngẫu dạng chuỗi phải giữ text, không suy đoán.
7. **Deploy**
   - Bump query version cho JS/CSS và kiểm tra trực tiếp HTML live.
   - Sau deploy cần tính đến cache Cloudflare/browser trước khi kết luận bản cũ.
   - Hai index phải đồng bộ cho tới khi cấu trúc package được đơn giản hóa.

## Handover

- Plan tổng kết:
  [plans/20260719_1909-daily-work-consolidation.md](../plans/20260719_1909-daily-work-consolidation.md)
- Report đầy đủ:
  [reports/pdca/20260719_1909-daily-work-consolidation.md](../reports/pdca/20260719_1909-daily-work-consolidation.md)
- Việc tiếp theo ưu tiên: triển khai MVP trích nhánh/in PDF từ
  `plans/20260719_1510-print-person-subtree-ux.md`.
- Tồn đọng ngoài phạm vi: `api/views.py` và `templates/core/relationships.html` đang có
  thay đổi chưa commit; phải review/test riêng, không gộp với viewer.
