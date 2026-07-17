# Genealogy Viewer — Cloudflare Drop package

Static export của module [genealogy-viewer](https://giaphavutoc.hay1.net/genealogy-viewer/) để deploy lên [Cloudflare Drop](https://www.cloudflare.com/drop/).

## Cấu trúc

```
genealogy-viewer/
├── index.html              # Entry (bắt buộc cho Drop)
├── css/viewer.css
├── js/genealogy-viewer.js  # Load ./data/gojs_data.json (không gọi Django API)
├── js/autocomplete-search.js
├── data/gojs_data.json     # Snapshot 547 người (Họ Trần Chi 4)
└── README.md
```

## Deploy lên Cloudflare Drop

1. Zip thư mục này (hoặc dùng file `../genealogy-viewer.zip` nếu có).
2. Mở https://www.cloudflare.com/drop/
3. Kéo thả **folder** `genealogy-viewer/` hoặc file `.zip`.
4. Nhận URL `*.workers.dev` và **claim URL** (hết hạn ~60 phút nếu chưa claim).

### CLI thay thế (Wrangler temporary)

```bash
cd drop/genealogy-viewer
npm exec --yes wrangler@latest -- deploy . --name giapha-genealogy-viewer --temporary --compatibility-date 2026-07-17
```

## Local preview

```bash
cd drop/genealogy-viewer
python3 -m http.server 8765
# mở http://127.0.0.1:8765/
```

Không mở `index.html` bằng `file://` — `fetch` JSON sẽ bị chặn.

## Đồng bộ dữ liệu lại từ Django

Trên server Django (khi đã có genealogy trong DB):

```bash
# Ví dụ: lấy GoJS payload từ API rồi ghi đè snapshot
curl -s http://localhost:8000/api/genealogy/<id>/gojs_data/ \
  > drop/genealogy-viewer/data/gojs_data.json
```

Hoặc copy lại từ `genealogy_data.json` ở root repo nếu file đó đã được export mới.
