# Plan: Load mặc định zoom 1:1, căn giữa node Tổ

- **Thời gian:** 2026-07-19 12:30
- **Trạng thái:** done
- **Liên quan:** `plans/20260719_1225-uniform-node-portrait-fix.md`

## Bối cảnh
Người dùng báo: khi load viewer, cả phả đồ 547 người bị auto-fit nên node bé tí nằm dồn trên cao. Yêu cầu: load lên là zoom 1:1 và căn giữa (Center) luôn.

## Nguyên nhân
1. Diagram khởi tạo với `initialAutoScale: go.Diagram.Fit`.
2. `applyGenealogyData` còn gắn thêm listener `InitialLayoutCompleted` gọi `myDiagram.zoomToFit()` — ghi đè mọi scale đặt trước đó.

## Giải pháp
1. Bỏ `initialAutoScale: Fit` và bỏ listener `zoomToFit()` trong `applyGenealogyData`.
2. Thêm listener `InitialLayoutCompleted` trong `initDiagram`: đặt `scale = 1`, tính `position` để node Tổ (`findTreeRoots().first()`) nằm giữa theo chiều ngang, cách mép trên 24px.
3. Nút "🔍 Fit" vẫn giữ để người dùng xem toàn cảnh khi cần.
4. Bump cache `?v=11`, deploy, verify bằng browser (scale === 1, root giữa màn hình).

## Check items
- [x] `node --check` pass
- [x] Live scale = 1, script v=11 load đúng
- [x] Screenshot: node Tổ "Trần Trung Hiền" giữa trên cùng khung nhìn
- [x] Deploy version e4eb0a83
