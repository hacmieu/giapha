# Trần tộc Chanh Thôn — Genealogy Viewer

Static export của module genealogy-viewer cho Cloudflare Workers.

## Live (Hacmieu@gmail.com)

**https://giapha-genealogy-viewer.hacmieu.workers.dev**

- Nhận diện: **Trần tộc Chanh Thôn**
- Địa danh: **Chanh Thôn - Ninh Bình (Hà Nam cũ)**
- Phả đồ: Họ Trần Chi 4
- UI report: `reports/pdca/20260719_1212-chanh-thon-portrait.md`

## Trải nghiệm

- Sidebar: điều khiển / tìm / lọc / chú giải.
- Click node → modal hồ sơ (thân thế, gia đình, ghi chép).
- Portrait SVG trên node và trong modal; sẵn sàng thay bằng `photo` URL khi có.

## Cấu trúc

```
genealogy-viewer/
├── public/
│   ├── index.html
│   ├── css/viewer.css
│   ├── js/...
│   ├── img/portrait-dinh.svg
│   ├── img/portrait-spouse.svg
│   └── data/gojs_data.json
├── wrangler.toml
├── index.html
└── README.md
```

## Deploy

```bash
cd drop/genealogy-viewer
export CLOUDFLARE_ACCOUNT_ID=716f165ab210a3626462c1c9b903ab44
npm exec --yes wrangler@4.102.0 -- deploy
```
