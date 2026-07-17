# PDCA Report — Redeploy genealogy-viewer Cloudflare Drop

**Date:** 2026-07-18 00:58  
**Status:** done  
**Owner:** Auto (Cursor)

## 1. Context

- Mục tiêu: deploy lại vì claim 2026-07-17 chưa kịp.
- Phạm vi: Wrangler temporary + log SSOT.
- Không đổi code viewer.

## 2. Plan

- Redeploy nguyên `drop/genealogy-viewer/` bằng wrangler@4.102.0 + Node 22.
- Plan: `plans/20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md`

## 3. Do

- `wrangler deploy . --name giapha-genealogy-viewer --temporary --compatibility-date 2026-07-18`
- Account temporary: Descriptive Homburg
- Thêm `drop/genealogy-viewer/wrangler.toml` (assets) — index `/` ổn định hơn sau cold start

## 4. Check

| Check | Kết quả |
|-------|---------|
| Deploy success | PASS |
| Live index `/` (6 retries) | PASS 200 |
| Live JSON 547 people | PASS 200 |
| Live JS | PASS 200 |

**Live URL:** https://giapha-genealogy-viewer.descriptive-homburg.workers.dev  

**Claim URL (sensitive, ~60 phút):** https://dash.cloudflare.com/claim-preview?claimToken=G78uxfGMLsO3vE0f47a8QjXTtsV8OPfv1bSmSJo21-E

## 5. Act

- **Claim ngay trong 60 phút** (không claim được thì mất URL lần nữa).
- Hoặc kéo `drop/genealogy-viewer.zip` lên https://www.cloudflare.com/drop/

## 6. Changed files

- `drop/genealogy-viewer/wrangler.toml` (mới)
- `plans/20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md`
- `memory/20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md`
- `reports/20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md`
- `memory/README.md`, `plans/README.md`, `reports/README.md`

## 7. Risks & rollback

- Không claim → mất temporary URL lần nữa.
- Rollback: redeploy lại / Drop thủ công.

## 8. Next actions

1. Claim URL trong 60 phút.
2. (Tuỳ chọn) gắn domain / Workers thường khi đã có Cloudflare account.
