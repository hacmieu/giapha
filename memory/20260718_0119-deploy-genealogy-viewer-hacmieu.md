# Memory — Deploy genealogy-viewer → Hacmieu@gmail.com

**Date:** 2026-07-18 01:19  
**Plan:** [plans/20260718_0119-deploy-genealogy-viewer-hacmieu.md](../plans/20260718_0119-deploy-genealogy-viewer-hacmieu.md)  
**Report:** [reports/20260718_0119-deploy-genealogy-viewer-hacmieu.md](../reports/20260718_0119-deploy-genealogy-viewer-hacmieu.md)

## Lesson

- Temporary claim (Descriptive Homburg) ≠ account Hacmieu — phải `wrangler deploy` **không** `--temporary` với `account_id` Hacmieu.
- Assets sạch nên nằm trong `public/` (tránh upload `.wrangler/` / `wrangler.toml` vào CDN).
- Wrangler OAuth sau Cloudflare MCP auth: email `hacmieu@gmail.com`, account ID `716f165ab210a3626462c1c9b903ab44`, subdomain `hacmieu`.

## Live (production account)

- https://giapha-genealogy-viewer.hacmieu.workers.dev
- Dashboard: Workers & Pages → chọn **Hacmieu@gmail.com's Account** → `giapha-genealogy-viewer`
