# Memory — genealogy-viewer Cloudflare Drop

**Date:** 2026-07-17 18:51  
**Related plan:** [plans/20260717_1851-genealogy-viewer-cloudflare-drop.md](../plans/20260717_1851-genealogy-viewer-cloudflare-drop.md)  
**Related report:** [reports/20260717_1851-genealogy-viewer-cloudflare-drop.md](../reports/20260717_1851-genealogy-viewer-cloudflare-drop.md)

## Lesson learned

1. **Module Django ≠ Drop package:** `/genealogy-viewer/` phụ thuộc template Django + `/api/genealogy/<id>/gojs_data/`. Cloudflare Drop chỉ nhận static → phải snapshot JSON + bỏ Django tags.
2. **`genealogy_data.json` đã đúng schema GoJS** (`nodeDataArray`, `linkDataArray`, `metadata`) — tái sử dụng trực tiếp làm `data/gojs_data.json`.
3. **Không mở `file://`:** `fetch` JSON bị chặn; cần HTTP (Drop / `python -m http.server` / Wrangler).
4. **Wrangler temporary** (v4.102+) deploy được khi chưa login Cloudflare; cần Node ≥ 22. Claim URL hết hạn ~60 phút.
5. **Diff đang mở** `api/views.py` + `relationships.html` thuộc module relationships — không đưa vào gói Drop này.

## Reusable decision

- Gói static chuẩn: `drop/genealogy-viewer/` + zip `drop/genealogy-viewer.zip`.
- JS Drop gọi `./data/gojs_data.json`; Django app giữ API path cũ (không đổi runtime production trong task này).

## Live preview (temporary)

- URL: https://giapha-genealogy-viewer.honorable-flood.workers.dev
- Claim trong 60 phút (xem report) nếu muốn giữ ownership.
