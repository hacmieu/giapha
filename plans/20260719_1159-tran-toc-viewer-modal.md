# Plan — Trần Tộc viewer và hồ sơ modal

**Date:** 2026-07-19 11:59  
**Status:** done

## Mục tiêu

- Đổi nhận diện genealogy viewer từ **Vũ Tộc** sang **Trần Tộc**.
- Chuyển chi tiết thành viên khỏi sidebar sang popup modal.
- Áp dụng cách trình bày gia phả hiện đại: cây là không gian chính; hồ sơ người được chia thành căn cước, thân thế và gia đình; không làm mất vị trí đang xem.

## Cơ sở tham khảo

- MyHeritage: mở hồ sơ ngay trên cây, giữ ngữ cảnh và hiển thị sự kiện, địa điểm, ảnh.
- FamilySearch: nhóm thông tin thành vital information, family members, relationships và brief life history.
- Điều chỉnh theo yêu cầu dự án: dùng modal thay vì side panel.

## Phạm vi

- `drop/genealogy-viewer/index.html`
- `drop/genealogy-viewer/css/viewer.css`
- `drop/genealogy-viewer/js/genealogy-viewer.js`
- Bản deploy đồng bộ trong `drop/genealogy-viewer/public/`
- Memory/report/README SSOT

## Thiết kế

- Nhận diện: xanh mực, đỏ son, vàng đồng; tiêu đề “Trần Tộc Làng Chuông”.
- Sidebar chỉ còn thống kê, tìm kiếm, lọc, chế độ xem, xuất và chú giải.
- Click node/search result: chọn và căn node, mở modal hồ sơ.
- Modal: monogram, họ tên, mã gia phả, đời, năm sinh, nơi ở, phối ngẫu, cha, số con, ghi chú.
- Hỗ trợ đóng bằng nút, click nền, phím Escape; trả focus về phần tử trước đó.

## Rủi ro và rollback

- Dữ liệu hiện không có ảnh/giới tính đầy đủ: dùng monogram thay ảnh.
- Chỉ hiển thị quan hệ có trong snapshot; không suy đoán mẹ/con.
- Rollback bằng revert commit.

## Check

- PASS: không còn chuỗi “Vũ Tộc” trong package.
- PASS: cú pháp JS; JSON 547 nodes/546 links.
- PASS: browser live load 547 node; modal đủ thân thế/gia đình/notes; Escape đóng.
- PASS: lọc đời 4 còn đúng 1 node và reset về toàn bộ.
- PASS: deploy account Hacmieu, version `f8af8841-cbfd-4195-b367-8290166cb603`.

## Kết quả

- Live: https://giapha-genealogy-viewer.hacmieu.workers.dev
- Report: `reports/pdca/20260719_1159-tran-toc-viewer-modal.md`
- Memory: `memory/20260719_1159-tran-toc-viewer-modal.md`
