# Plan: Lọc theo đời có tổ tiên + vẽ nhánh hậu duệ từ modal

- **Thời gian:** 2026-07-19 17:56
- **Trạng thái:** done
- **Liên quan:** `plans/20260719_1510-print-person-subtree-ux.md`

## Bối cảnh

1. Dropdown “Lọc Thế Hệ” cũ chỉ đặt `visible=true` cho node đúng một đời. Các node bị mất cha trung gian nên liên kết biến mất, GoJS xếp người cùng đời thành cột dọc/những gốc rời — không phải phả đồ có ngữ cảnh.
2. Người dùng muốn click một người, chọn đời cuối rồi vẽ riêng người đó + toàn bộ con cháu đến đời đã chọn; mặc định lấy tất cả con cháu.

## Mục tiêu

- Sidebar đổi sang **“Xem Đến Đời”**: chọn X sẽ giữ mọi đời từ Tổ đến X, không tạo node mồ côi.
- Modal thêm mục **“Vẽ nhánh hậu duệ”**:
  - mặc định `Tất cả con cháu`;
  - có dropdown `Đến Đời X`;
  - nút `Vẽ phả đồ nhánh này`.
- Diagram nhánh có banner nêu người gốc/phạm vi/số người và nút `Xem toàn bộ phả đồ`.

## Thiết kế kỹ thuật

1. `collectDescendants(rootKey, endGeneration)`:
   - tạo index `fatherId → children`;
   - BFS từ người gốc;
   - dừng enqueue khi `child.generation > endGeneration`;
   - chống vòng lặp bằng `Set`.
2. `createTreeModel(nodes)` clone dữ liệu; xoá `fatherId` nếu cha không nằm trong tập để người được chọn trở thành root.
3. `drawDescendantBranchFromModal()`:
   - đọc root key + đời cuối;
   - đóng modal, chuyển mobile sang tab Phả đồ;
   - thay model bằng subtree;
   - hiện banner.
4. `showFullTree()` khôi phục đủ model và ẩn banner.
5. `filterByGeneration()` đổi từ `generation === X` sang `generation <= X`, sau đó invalidate + layout lại.

## Phát hiện dữ liệu

- JSON có 547 người, phân bố Đời 4–13:
  - Đời 4: 1
  - 5: 3
  - 6: 7
  - 7: 14
  - 8: 18
  - 9: 31
  - 10: 42
  - 11: 70
  - 12: 150
  - 13: 211
- Metadata/UI cũ ghi 4–12 là sai. Thống kê và dropdown được chuyển sang sinh động từ `nodeDataArray`, đồng thời legend đổi thành `Đời 10–13`.

## Affected files

- `drop/genealogy-viewer/public/js/genealogy-viewer.js`
- `drop/genealogy-viewer/public/css/viewer.css`
- `drop/genealogy-viewer/public/index.html`
- `drop/genealogy-viewer/index.html`

## Migration / API / rollback

- Migration: không.
- API: không.
- Dữ liệu: không sửa JSON.
- Rollback: khôi phục model đầy đủ bằng `showFullTree()`; git revert phần UI/JS nếu cần.

## Check items

- [x] Filter đến Đời 10: 116 node visible, max generation=10, orphanCount=0.
- [x] Modal Trần Văn Lư: mặc định 31 con cháu đến Đời 13; options Đời 11/12/13.
- [x] Vẽ mặc định: 32 node (gốc + 31 hậu duệ), max Đời 13.
- [x] Chọn đến Đời 11: 5 node, max generation=11, quan hệ cha-con hợp lệ.
- [x] Banner nhánh + nút Xem toàn bộ hoạt động.
- [x] Thống kê động: 547 người, 546 quan hệ, Đời 4–13.
- [x] `node --check` và IDE lints pass.
- [x] Deploy version `075f9bea`.
