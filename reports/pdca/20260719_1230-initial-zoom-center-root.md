# PDCA: Load viewer zoom 1:1, căn giữa node Tổ

- **Thời gian:** 2026-07-19 12:30
- **Trạng thái:** done
- **Plan:** `plans/20260719_1230-initial-zoom-center-root.md`
- **Memory:** `memory/20260719_1230-initial-zoom-center-root.md`

## Plan
Khi load, phả đồ 547 người bị auto-fit → node bé tí dồn lên cao. Yêu cầu: mặc định zoom 1:1 và căn giữa (Center).

## Do
1. `initDiagram()`: bỏ `initialAutoScale: go.Diagram.Fit` + `contentAlignment: TopCenter`; thêm listener `InitialLayoutCompleted` đặt `scale = 1` và `position` để node Tổ căn giữa ngang, cách mép trên 24px.
2. `applyGenealogyData()`: gỡ listener `InitialLayoutCompleted` cũ gọi `zoomToFit()` — chính nó ghi đè scale về 0.83 ở lần deploy đầu (v=10).
3. Bump cache JS `?v=11` (2 file index.html), deploy 2 lần Wrangler. Version cuối: `e4eb0a83`.

## Check
- Lần verify đầu (v=10) phát hiện scale = 0.837: nguyên nhân là listener `zoomToFit()` còn sót trong `applyGenealogyData` + HTML bị Cloudflare cache HIT trả bản cũ vài chục giây sau deploy.
- Sau v=11: CDP xác nhận `scale === 1`, script `?v=11` load đúng; screenshot cho thấy node Tổ "Trần Trung Hiền" (Đời 4) nằm giữa trên cùng khung nhìn, kích thước thật.
- Nút "🔍 Fit" vẫn hoạt động cho nhu cầu xem toàn cảnh.

## Act
- Ghi memory: quy ước initial view; bẫy listener trùng `InitialLayoutCompleted`; chờ cache Cloudflare khi verify sau deploy.
- Gợi ý sau: cây rất rộng (~33.000px ngang ở đời 5), có thể thêm nút "Về Tổ" để quay lại initial view sau khi người dùng pan xa.
