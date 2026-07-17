# PDCA Report — genealogy-viewer Cloudflare Drop

**Date:** 2026-07-17 18:51  
**Owner:** Auto (Cursor)  
**Phase:** 2 (static export)  
**Status:** done

## 1. Context

- **Mục tiêu:** Tách module https://giaphavutoc.hay1.net/genealogy-viewer/ thành static site deploy Cloudflare Drop / Workers temporary.
- **Phạm vi:** HTML/CSS/JS + snapshot JSON Họ Trần Chi 4 (547 người); PDCA logs + README SSOT.
- **Không bao gồm:** Upload Excel, auth, sửa Django runtime; không gồm diff `relationships.html` / `api/views.py`.

## 2. Plan

- Giả định: snapshot `genealogy_data.json` đủ để xem phả đồ offline.
- Rủi ro: `file://` fail fetch; CDN GoJS; dữ liệu snapshot lệch DB.
- Rollback: xóa `drop/genealogy-viewer/` và log task.
- Plan file: `plans/20260717_1851-genealogy-viewer-cloudflare-drop.md`

## 3. Do

- Tạo `drop/genealogy-viewer/` với `index.html`, `css/viewer.css`, JS adapt static, `data/gojs_data.json`.
- Đổi loader: bỏ `/api/genealogy/.../gojs_data/` → `./data/gojs_data.json`.
- Zip: `drop/genealogy-viewer.zip` (~28KB).
- Deploy Wrangler temporary (Node 22 + wrangler@4.102.0).

## 4. Check

| Check | Kết quả |
|-------|---------|
| Schema JSON 547 nodes / 546 links | PASS |
| JS không còn `/api/genealogy/` | PASS |
| Local HTTP `127.0.0.1:9876` index/json/js/css | PASS (200) |
| Live Workers index + JSON | PASS (200) |
| Cloudflare Drop UI kéo-thả | NOT RUN (đã dùng Wrangler temporary tương đương) |

**Live URL:** https://giapha-genealogy-viewer.honorable-flood.workers.dev  
**Claim URL (sensitive, ~60 phút):** https://dash.cloudflare.com/claim-preview?claimToken=vEQidDm19_hnHUBI6O-luI9s6tqihXB6YdGF4gPeNKE

## 5. Act

- Claim temporary deployment nếu cần giữ URL.
- Có thể kéo `drop/genealogy-viewer/` hoặc `.zip` lên https://www.cloudflare.com/drop/ để có deployment Drop riêng.
- Debt: vendor `go.js` offline; multi-genealogy select; pipeline refresh JSON từ API.
- Memory cập nhật: `memory/20260717_1851-genealogy-viewer-cloudflare-drop.md`

## 6. Changed files

- `drop/genealogy-viewer/**` (mới)
- `drop/genealogy-viewer.zip` (mới)
- `memory/`, `plans/`, `reports/` + README SSOT
- `.gitignore` (thêm `.wrangler/`)

## 7. Risks & rollback

- Temporary Workers mất nếu không claim trong 60 phút.
- Snapshot có thể lệch DB production → re-export JSON.
- Rollback: revert commit / xóa `drop/`.

## 8. Next actions

1. Claim hoặc re-drop lên Cloudflare Drop nếu cần URL lâu dài.
2. Script `manage.py`/Makefile: export `gojs_data` → `drop/.../data/`.
3. (Tuỳ chọn) Vendor GoJS vào `drop/.../js/go.js`.
