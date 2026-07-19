# Memory — View modes và reset stage Vũ Tộc

**Thời điểm:** 2026-07-20 01:09 (UTC+7)

## Quyết định tái sử dụng

- `View` là projection dữ liệu; `Bố cục` chỉ là thuật toán layout. Không gộp hai khái niệm vào một select.
- Mỗi thay đổi sidebar phải chạy cùng chuỗi: dựng model → áp filter → relayout → scale `0.7` → chọn/center node gốc. Không giữ viewport cũ khi ngữ cảnh dữ liệu đổi.
- `Lọc theo Chi` không phù hợp nhu cầu Vũ Tộc hiện tại và đã bỏ.
- API cây chính tiếp tục gọn; API `/api/public/graph` lazy-load 397 hồ sơ khi người dùng chọn view mở rộng.

## Ba projection

1. `Dòng chính`: main, bỏ node spouse khỏi cây và ghi phối ngẫu trên thẻ.
2. `Gia đình mở rộng`: main + phối ngẫu trực tiếp; hiện vợ/chồng thành node, parent links gồm cha và mẹ.
3. `Quan hệ khác`: toàn bộ public people + 503 parent + 125 spouse + 1 social relation; social target chưa có person ID được dựng thành node tổng hợp.

## UX/data notes

- Phối ngẫu: nền hồng, viền hồng; external: nền tím nhạt, viền tím.
- Link mẹ màu hồng; phối ngẫu và social dùng nét đứt, có nhãn.
- JSON export xuất đúng model/view đang xem, không luôn xuất cây chính.
- Graph lớn không mặc định `zoomToFit`; reset về Thủy Tổ ở scale đọc được. Nút Fit vẫn dành cho toàn cảnh.
- Cache-bust asset phải tăng version query sau mỗi thay đổi JS/CSS live.

## Dữ liệu còn thiếu

`social_relations` hiện chỉ có 1 bản ghi (`blood_out`, “Con của Cô”). View quan hệ khác vẫn hữu ích nhờ 82 external people và toàn bộ parent/spouse links, nhưng sẽ phong phú hơn khi CRUD social relations được nhập thật.

## Audit follow-up

- Vẽ nhánh hậu duệ phải traverse cả cha và mẹ; chỉ `fatherId` sẽ mất con của con gái.
- Hồ sơ chi tiết cần trả `socialRelations` dù graph view đã vẽ được cạnh social.
- Admin scope derivation và exporter validation count vẫn là nợ kỹ thuật riêng.
