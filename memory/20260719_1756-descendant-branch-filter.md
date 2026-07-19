# Memory: Lọc đến đời và subtree hậu duệ

- **Thời gian:** 2026-07-19 17:56
- **Phạm vi:** static genealogy viewer

## Quy tắc lọc

1. Không bao giờ lọc `generation === X` trên TreeModel để hiển thị riêng một đời: mất cha trung gian, link bị ẩn và node trở thành các gốc rời.
2. Sidebar dùng ngữ nghĩa **“Xem đến đời X”**: hiển thị `generation <= X`, giữ đầy đủ quan hệ từ Tổ đến đời cuối.
3. Muốn xem riêng một người thì phải tạo **subtree hậu duệ**, không dùng visibility filter toàn cây.

## Subtree pattern

- `collectDescendants(rootKey, endGeneration)`: BFS theo index `fatherId → children`, có `seen Set`.
- `createTreeModel(nodes)`: clone node, xoá `fatherId` nếu cha ngoài tập.
- `drawDescendantBranchFromModal()`: default `endGeneration=null` = toàn bộ con cháu.
- Banner nhánh phải luôn có đường thoát `Xem toàn bộ phả đồ`.
- Khi thay model, listener `InitialLayoutCompleted` tự áp scale 0.7 + center root.

## Dữ liệu thực tế

- `gojs_data.json` có Đời 4–13, không phải 4–12.
- 211/547 người thuộc Đời 13.
- Không tin `metadata.generationRange` nếu lệch dữ liệu; stats/dropdown phải tính trực tiếp từ `nodeDataArray`.
- Dropdown đời trong modal phải sinh theo max generation thực tế của chính subtree.

## UX modal

- Section: `Vẽ nhánh hậu duệ`.
- Copy: “Chọn đời cuối cần xem. Mặc định lấy toàn bộ con cháu trong nhánh này.”
- Default option nêu rõ số hậu duệ + đời sâu nhất.
- Người không có hậu duệ hiển thị empty state, không hiện nút vô nghĩa.

## Version

- JS `?v=19`, CSS `?v=16`
- Worker deploy `075f9bea-f92e-43f7-87c0-c0302c3b4637`
