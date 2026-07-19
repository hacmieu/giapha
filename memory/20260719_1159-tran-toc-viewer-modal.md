# Memory — Trần Tộc viewer và hồ sơ modal

**Date:** 2026-07-19 11:59  
**Plan:** [plans/20260719_1159-tran-toc-viewer-modal.md](../plans/20260719_1159-tran-toc-viewer-modal.md)  
**Report:** [reports/pdca/20260719_1159-tran-toc-viewer-modal.md](../reports/pdca/20260719_1159-tran-toc-viewer-modal.md)

## Quyết định tái sử dụng

1. Nhận diện module này là **Trần Tộc Làng Chuông**, không dùng “Vũ Tộc”.
2. Cây phả hệ là không gian thao tác chính; sidebar chỉ chứa điều khiển.
3. Chi tiết thành viên dùng modal, giữ nguyên vị trí node đang xem.
4. Hồ sơ chia ba lớp dễ đọc:
   - Thân thế: năm sinh, nơi ở.
   - Gia đình: thân phụ, phối ngẫu, số con trong snapshot.
   - Ghi chép gia phả: nội dung notes.
5. Không tải ảnh placeholder cho 547 node. Dùng monogram tên gọi để giảm request lỗi và làm thẻ nhất quán.
6. Escape, click backdrop và nút × đều phải đóng modal; mọi dữ liệu đưa vào HTML phải escape.
7. Asset thay đổi cần cache-bust trong `index.html` để Worker/CDN không giữ JS/CSS cũ.

## Tham khảo thiết kế

- [MyHeritage Pedigree details](https://www.myheritage.com/help/en/articles/12879527-how-can-i-edit-details-on-my-family-tree-from-the-pedigree-view): xem thông tin mà không rời cây, nhóm facts/dates/locations.
- [FamilySearch Person page](https://www.familysearch.org/en/help/helpcenter/article/what-is-included-on-the-person-page-in-family-tree): vital information, family members, relationships, brief history.

## Live

https://giapha-genealogy-viewer.hacmieu.workers.dev
