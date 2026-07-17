# Plan — Deploy genealogy-viewer vào Cloudflare account hacmieu@gmail.com

**Date:** 2026-07-18 01:09  
**Status:** superseded (done via 0119 after Wrangler OAuth)  
**Account target:** Hacmieu@gmail.com (`716f165ab210a3626462c1c9b903ab44`)

Xem kết quả: `reports/20260718_0119-deploy-genealogy-viewer-hacmieu.md`


## Mục tiêu

Đẩy `drop/genealogy-viewer` vào **Hacmieu@gmail.com's Account** (không dùng temporary Descriptive Homburg).

## Bối cảnh

- User đã claim/xem được Descriptive Homburg trên dashboard nhưng cần Worker nằm dưới account `hacmieu@gmail.com`.
- Máy agent hiện `wrangler whoami` = **not authenticated** → bắt buộc login OAuth hoặc `CLOUDFLARE_API_TOKEN`.

## Do

1. Authenticate Wrangler với account hacmieu
2. Deploy **không** `--temporary`
3. Verify live URL thuộc account thật
4. Log memory/plans/reports + README + git push

## Rủi ro

- Login OAuth cần thao tác browser / token từ user
- Sai account_id nếu user có nhiều account
