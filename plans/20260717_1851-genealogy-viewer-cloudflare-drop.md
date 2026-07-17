# Plan — Tách module genealogy-viewer cho Cloudflare Drop

**Date:** 2026-07-17 18:51  
**Status:** done  
**Phase:** 2 (export/static delivery)  
**Live ref:** https://giaphavutoc.hay1.net/genealogy-viewer/  
**Drop ref:** https://www.cloudflare.com/drop/

## 1. Context / Mục tiêu

Tách riêng module **Phả Đồ Đinh (genealogy-viewer)** thành gói **static site** (HTML/CSS/JS + JSON) để deploy nhanh lên Cloudflare Drop, không phụ thuộc Django runtime.

## 2. Phạm vi

**Trong scope**
- Viewer GoJS: tree/force, search, filter thế hệ, export ảnh/JSON
- Dữ liệu snapshot GoJS từ `genealogy_data.json` (547 người, đời 4–12)
- Gói sẵn trong `drop/genealogy-viewer/` (+ zip) để kéo thả lên Cloudflare Drop
- PDCA logs + README SSOT ở `memory/`, `plans/`, `reports/`

**Ngoài scope**
- Upload Excel / API write
- Auth / admin
- Diff đang mở `api/views.py` + `templates/core/relationships.html` (module relationships, không liên quan)

## 3. Giả định

- Cloudflare Drop chỉ phục vụ static (không có Django API)
- Snapshot JSON hiện tại đủ để demo/xem phả đồ Họ Trần Chi 4
- GoJS CDN (cdnjs) vẫn truy cập được từ trình duyệt người xem

## 4. Rủi ro

| Rủi ro | Mitigation |
|--------|------------|
| CORS/`file://` không fetch được JSON | Serve qua Drop (HTTP) hoặc local `python -m http.server` |
| Dữ liệu cũ so với production DB | Ghi rõ đây là snapshot; refresh bằng export lại từ API |
| GoJS CDN downtime | Có thể vendor `go.js` sau (Act) |
| fatherId orphan (vd. root) | Giữ logic `delete n.fatherId` như viewer hiện tại |

## 5. Affected files (dự kiến)

- `drop/genealogy-viewer/index.html` (mới)
- `drop/genealogy-viewer/js/genealogy-viewer.js` (adapt static)
- `drop/genealogy-viewer/js/autocomplete-search.js` (copy)
- `drop/genealogy-viewer/data/gojs_data.json` (copy từ `genealogy_data.json`)
- `drop/genealogy-viewer/README.md`
- `memory/`, `plans/`, `reports/` + README SSOT
- Không đụng Django app code trong vòng này

## 6. Rollback

Xóa thư mục `drop/genealogy-viewer/` và các log PDCA của task nếu hủy bỏ.

## 7. Do checklist

1. Scaffold `drop/genealogy-viewer/`
2. Standalone HTML (bỏ Django `{% %}`, bỏ nav site)
3. JS load `./data/gojs_data.json` thay vì `/api/genealogy/.../gojs_data/`
4. Copy autocomplete + data
5. Zip gói sẵn để Drop
6. Check local HTTP + cấu trúc index.html

## 8. Check / Act (hoàn tất)

- Check: schema 547 nodes PASS; local `:9876` PASS; live Workers PASS  
  - Live: https://giapha-genealogy-viewer.honorable-flood.workers.dev
- Act: memory + report SSOT cập nhật; debt = claim URL / vendor GoJS / refresh pipeline
- Report: `reports/20260717_1851-genealogy-viewer-cloudflare-drop.md`
- Memory: `memory/20260717_1851-genealogy-viewer-cloudflare-drop.md`
