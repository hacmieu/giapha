# PDCA Report — Deploy genealogy-viewer → Hacmieu@gmail.com

**Date:** 2026-07-18 01:19  
**Status:** done  
**Account:** Hacmieu@gmail.com (`716f165ab210a3626462c1c9b903ab44`)

## 1. Context

- Mục tiêu: Worker nằm dưới account Hacmieu, không phải Descriptive Homburg temporary.
- Auth: Wrangler OAuth + Cloudflare MCP (cùng email).

## 2. Plan

- `account_id` trong `wrangler.toml` + `CLOUDFLARE_ACCOUNT_ID`
- Assets directory `./public`
- Không dùng `--temporary`

## 3. Do

- Tạo `public/` (index, css, js, data)
- `wrangler.toml` gắn account Hacmieu + `workers_dev = true`
- `wrangler deploy` → Version `9bc48605-419e-4f6c-b6a7-5b9c485769dc`

## 4. Check

| Check | Kết quả |
|-------|---------|
| Worker list trên account Hacmieu (MCP) | PASS — có `giapha-genealogy-viewer` |
| `GET /` | PASS 200 (5032 bytes) |
| `GET /data/gojs_data.json` | PASS 200 (184644) |
| `GET /js/genealogy-viewer.js` | PASS 200 |
| `GET /css/viewer.css` | PASS 200 |
| Stability 6 retries root+json | (verify) |

**Live URL:** https://giapha-genealogy-viewer.hacmieu.workers.dev

## 5. Act

- URL ổn định trên account thật — không cần claim 60 phút.
- Có thể xóa Worker temporary trên Descriptive Homburg nếu không dùng.
- Đồng bộ zip Drop với layout `public/` nếu còn dùng Cloudflare Drop UI.

## 6. Changed files

- `drop/genealogy-viewer/wrangler.toml`
- `drop/genealogy-viewer/public/**`
- `plans/20260718_0119-deploy-genealogy-viewer-hacmieu.md`
- `memory/20260718_0119-deploy-genealogy-viewer-hacmieu.md`
- `reports/20260718_0119-deploy-genealogy-viewer-hacmieu.md`
- README SSOT memory/plans/reports + drop README

## 7. Risks & rollback

- Rollback: `wrangler rollback` hoặc xóa Worker trên dashboard Hacmieu.
- Cold-start 404 tạm thời có thể xảy ra vài giây sau deploy.

## 8. Next actions

1. Mở URL trên browser, xác nhận phả đồ render.
2. (Tuỳ chọn) gắn custom domain.
3. (Tuỳ chọn) dọn Worker temporary trên Descriptive Homburg.
