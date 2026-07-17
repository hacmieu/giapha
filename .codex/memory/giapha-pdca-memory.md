# Giapha Working Memory (PDCA)

Updated: 2026-03-29

## Mission focus

- Triển khai Phase 1-2 trước.
- Phase 1: data foundation + tenant isolation + security fixes.
- Phase 2: import pipeline JSON/CSV + validation + versioning cơ bản.
- Phase 3 để sau theo quyết định của chủ dự án.

## Non-negotiable principles

- Luôn làm theo PDCA cho mọi task.
- Mọi thay đổi phải truy vết được qua report.
- Ưu tiên an toàn dữ liệu và phân tách dòng họ.
- Không đóng task khi chưa có mục Act rõ ràng.

## Architecture priorities

- Query theo family context, tránh global query.
- Khóa unique theo family (không global cho legacy_id).
- Import phải có validation + transaction + khả năng rollback.
- API graph không được lộ dữ liệu private.

## Delivery conventions

- Report path: `reports/pdca/<date>-<task-slug>.md`
- Template path: `reports/templates/pdca-report-template.md`
- Template path: `reports/templates/handover-template.md`
- Khi bàn giao luôn có phạm vi.
- Khi bàn giao luôn có file thay đổi.
- Khi bàn giao luôn có test/check.
- Khi bàn giao luôn có rủi ro còn lại.
- Khi bàn giao luôn có việc cần làm tiếp.

## Reusable decisions log

1. 2026-03-29: Chốt triển khai Phase 1-2 trước, Phase 3 deferred.
2. 2026-03-29: Bắt buộc PDCA + memory + reports để rút ngắn handover.
3. 2026-07-17: genealogy-viewer Cloudflare Drop = static package `drop/genealogy-viewer/` + snapshot `gojs_data.json` (không gọi Django API). Chi tiết: `memory/20260717_1851-genealogy-viewer-cloudflare-drop.md`.
