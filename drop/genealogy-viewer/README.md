# Trần Tộc Genealogy Viewer — Cloudflare Workers

Static export của module [genealogy-viewer](https://giaphavutoc.hay1.net/genealogy-viewer/).

## Live (Hacmieu@gmail.com — production)

**https://giapha-genealogy-viewer.hacmieu.workers.dev**

- Account: `Hacmieu@gmail.com's Account` (`716f165ab210a3626462c1c9b903ab44`)
- Worker name: `giapha-genealogy-viewer`
- UI report: `reports/pdca/20260719_1159-tran-toc-viewer-modal.md`

## Trải nghiệm

- Cây phả hệ là không gian chính; sidebar chỉ giữ điều khiển và chú giải.
- Click thành viên hoặc chọn kết quả tìm kiếm để mở modal hồ sơ.
- Hồ sơ nhóm theo thân thế, gia đình và ghi chép gia phả.
- Escape, nút × hoặc click nền để đóng; responsive trên mobile.

## Cấu trúc

```
genealogy-viewer/
├── public/                 # Assets deploy (Wrangler [assets].directory)
│   ├── index.html
│   ├── css/viewer.css
│   ├── js/genealogy-viewer.js
│   ├── js/autocomplete-search.js
│   └── data/gojs_data.json
├── wrangler.toml           # account_id = Hacmieu
├── index.html              # Entry cho gói zip/Cloudflare Drop, trỏ vào public/
└── README.md
```

## Deploy lại (Wrangler — account Hacmieu)

```bash
cd drop/genealogy-viewer
# Node >= 22, đã wrangler login với hacmieu@gmail.com
export CLOUDFLARE_ACCOUNT_ID=716f165ab210a3626462c1c9b903ab44
npm exec --yes wrangler@4.102.0 -- deploy
```

## Cloudflare Drop (kéo thả)

Zip thư mục `public/` (hoặc gói có `index.html` ở root) rồi kéo lên https://www.cloudflare.com/drop/

## Local preview

```bash
cd drop/genealogy-viewer/public
python3 -m http.server 9876 --bind 127.0.0.1
# http://127.0.0.1:9876/
```

## Đồng bộ dữ liệu từ Django

```bash
curl -s http://localhost:8000/api/genealogy/<id>/gojs_data/ \
  > drop/genealogy-viewer/public/data/gojs_data.json
```
