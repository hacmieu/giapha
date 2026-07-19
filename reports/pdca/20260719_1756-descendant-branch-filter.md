# PDCA: Sửa lọc đời + vẽ nhánh hậu duệ tùy chọn

- **Thời gian:** 2026-07-19 17:56
- **Trạng thái:** done
- **Plan:** `plans/20260719_1756-descendant-branch-filter.md`
- **Memory:** `memory/20260719_1756-descendant-branch-filter.md`

## Plan

Sửa lỗi lọc riêng một đời làm cây biến thành cột node mất quan hệ; bổ sung luồng click người → chọn đời cuối → vẽ người đó và toàn bộ con cháu đến đời được chọn, mặc định tất cả.

## Do

1. Đổi sidebar `Lọc Thế Hệ` thành `Xem Đến Đời`; filter giữ node `generation <= X`, link chỉ hiện khi hai đầu hiện, rồi layout lại.
2. Thêm `collectDescendants`, `createTreeModel`, `drawDescendantBranchFromModal`, `showFullTree`.
3. Modal:
   - tính toàn bộ hậu duệ của người hiện tại;
   - option mặc định tất cả;
   - options đời cuối động;
   - empty state nếu không có con cháu.
4. Thêm banner nhánh phía trên diagram: tên người gốc, phạm vi, số người, nút khôi phục toàn phả đồ.
5. Tính stats và generation dropdown từ dữ liệu thật. Phát hiện metadata 4–12 bị stale; dữ liệu thực tế có Đời 13 (211 người).
6. Bump JS v19, CSS v16; deploy Worker.

## Check

### Passed

- `node --check public/js/genealogy-viewer.js`.
- IDE lints: 0.
- Filter đến Đời 10:
  - visible=116;
  - maxGen=10;
  - orphanCount=0;
  - model vẫn đủ 547 người.
- Trần Văn Lư (Đời 10):
  - default: 31 hậu duệ đến Đời 13;
  - options: Đời 11, 12, 13;
  - vẽ tất cả: model 32 người, range 10–13;
  - chọn Đời 11: model 5 người, maxGen=11, mọi node ngoài root có cha.
- Stats live: 547 người, 546 quan hệ, Đời 4–13.
- Worker version: `075f9bea-f92e-43f7-87c0-c0302c3b4637`.

### Residual risks

- Nhánh rất rộng có thể cần nút Fit hoặc trích/in theo kế hoạch `20260719_1510`.
- Generation trong dữ liệu phải tăng theo quan hệ cha-con; hiện traversal giới hạn bằng giá trị generation.
- GoJS đang dùng evaluation build và còn watermark (không thuộc phạm vi task này).

## Act

- Ghi memory quy tắc không lọc riêng exact generation trên tree.
- Stats/dropdown đời từ nay lấy dữ liệu thực, không hard-code metadata.
- Bước tiếp theo phù hợp: nối subtree hiện tại với luồng preview/in PDF đã thiết kế.

## Handover

- Không migration/API.
- Không sửa JSON.
- Nút `Xem toàn bộ phả đồ` là rollback runtime an toàn cho người dùng.
