# PDCA Checklists (Giapha Phase 1-2)

## Plan checklist

- Mục tiêu cụ thể của task là gì?
- Thuộc Phase 1 hay Phase 2?
- Có thay đổi schema không?
- Có ảnh hưởng tenant isolation không?
- Có kế hoạch rollback không?
- Có báo cáo `reports/pdca/...` chưa?

## Do checklist

- Chia thành bước nhỏ, có thể review độc lập.
- Viết migration rõ ràng, không phá dữ liệu cũ.
- Update API/filter để luôn có `family` context.
- Đảm bảo import có validation và transaction.

## Check checklist

- Chạy test liên quan model/view/api/import.
- Kiểm tra query không còn đọc dữ liệu toàn cục.
- Kiểm tra dữ liệu riêng tư không bị lộ qua API graph.
- Ghi lại kết quả thực thi và bằng chứng.

## Act checklist

- Ghi debt/tồn đọng.
- Đề xuất bước tiếp theo theo thứ tự ưu tiên.
- Cập nhật memory với bài học tái sử dụng.
- Cập nhật handover note ngắn gọn cho người nhận.

## Report structure

Mỗi report nên có đúng các mục sau:

1. Context
2. Plan
3. Do
4. Check
5. Act
6. Changed files
7. Risks & rollback
8. Next actions
