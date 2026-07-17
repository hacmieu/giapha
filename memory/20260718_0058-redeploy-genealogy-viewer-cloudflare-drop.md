# Memory — Redeploy genealogy-viewer Cloudflare Drop

**Date:** 2026-07-18 00:58  
**Plan:** [plans/20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md](../plans/20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md)  
**Report:** [reports/20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md](../reports/20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md)

## Lesson

- Temporary Workers **phải Claim trong ~60 phút**; nếu miss thì redeploy lại (account/URL mới), không recover claim token cũ.
- Gói `drop/genealogy-viewer/` ổn định — redeploy không cần sửa asset.

## Live (mới)

- URL: https://giapha-genealogy-viewer.descriptive-homburg.workers.dev
- Claim trong 60 phút (xem report)
