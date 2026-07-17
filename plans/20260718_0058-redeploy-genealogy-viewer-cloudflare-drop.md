# Plan — Redeploy genealogy-viewer Cloudflare Drop (re-claim)

**Date:** 2026-07-18 00:58  
**Status:** done

## Check/Act

- Live: https://giapha-genealogy-viewer.descriptive-homburg.workers.dev (index 200 ổn định sau thêm `wrangler.toml`)
- Claim: xem `reports/20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md`
- Memory: `memory/20260718_0058-redeploy-genealogy-viewer-cloudflare-drop.md`


## 1. Mục tiêu

Deploy lại gói `drop/genealogy-viewer/` lên Cloudflare Workers temporary, trả live URL + claim URL mới (claim trong ~60 phút).

## 2. Phạm vi

- Redeploy nguyên gói static hiện có (không đổi code viewer trừ khi deploy fail)
- Log PDCA + cập nhật README SSOT
- Git commit/push nếu có thay đổi log

## 3. Không bao gồm

- Đổi dữ liệu JSON / UI
- Diff `relationships.html` / `api/views.py`

## 4. Do checklist

1. Wrangler temporary deploy (Node ≥ 22)
2. Verify HTTP 200 index + JSON
3. Ghi memory/plans/reports + README
4. Push

## 5. Rollback

Bỏ qua claim mới; dùng lại zip kéo thả https://www.cloudflare.com/drop/ thủ công.
