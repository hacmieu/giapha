# Plan — Backlog còn lại & hướng xử lý Admin

**Thời điểm:** 2026-07-20 15:18 (UTC+7)

## Câu hỏi

1. Còn những gì chưa xong sau khi tách Vũ Tộc lên Cloudflare?
2. Phần Admin xử lý thế nào?

## Đã xong (public / nền)

| Hạng mục | Trạng thái |
|----------|-----------|
| Tách khỏi Django (Worker + D1 + R2) | Done |
| Seed D1 ~397 người, 8 chi, parent/spouse | Done |
| Public viewer GoJS parity Trần Tộc (sidebar, modal, search, export, mobile) | Done |
| Nối 8 chi về Thủy Tổ; tách tạm họ Nguyễn external | Done |
| 3 view: Dòng chính / Gia đình mở rộng / Quan hệ khác | Done |
| Reset stage; bỏ lọc Chi; ô gia đình `fam:`; vợ bên phải chồng | Done |
| Public API: tree, graph, search, people, media | Done |
| Admin Worker deploy + API CRUD fail-closed (401 không JWT) | Done (API only) |

Live:

- Public: https://vu-toc-lang-chuong-public.hacmieu.workers.dev
- Admin: https://vu-toc-lang-chuong-admin.hacmieu.workers.dev (HTML vẫn mở; API ghi 401)

## Chưa xong — ưu tiên

### P0 — Admin dùng được thật

1. **Cloudflare Access** cho hostname admin + điền `CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD`.
2. **UI Admin** (form CRUD) — hiện admin phục vụ cùng `public/index.html` viewer, chưa có màn hình sửa dữ liệu.
3. **Sửa `tree_scope` khi create/update** — admin đang ép không-chi ⇒ `external` (sai tổ tiên/spouse chưa gán chi).

### P1 — Đủ CRUD gia phả

4. API + UI **social_relations** (view Quan hệ khác gần như trống: 1 bản ghi).
5. Upload ảnh R2 từ admin.
6. Nhập `wife_order` cho cặp còn thiếu; gắn lại họ Nguyễn khi quan hệ rõ.
7. Quản lý chi / generation / soft-delete có kiểm soát trên UI.

### P2 — Hoàn thiện & cắt Django

8. Giấy phép GoJS (bỏ watermark eval).
9. Custom domain; tùy chọn cấm xem public (Access hoặc rule sau).
10. Ngừng Django cho Vũ Tộc khi admin Cloudflare đủ dùng hàng ngày.
11. Exporter validation (expect 91 external vs live 82); fixture tests projection.

## Phương án Admin (chốt hướng)

**Không** dựng lại Django admin. Admin = Worker riêng + Access + UI tĩnh gọi API.

```
[Bạn login Access]
      │
      ▼
Admin Worker (DEPLOYMENT_MODE=admin)
  ├── Static: /admin UI (forms)
  ├── GET  /api/public/*  (đọc để preview)
  └── POST/PATCH/DELETE /api/admin/*  (JWT Access bắt buộc)
         │
         ├── D1 (chung với public)
         └── R2 media (chung)
```

### Phase A — Khóa cửa (1 buổi)

1. Zero Trust → Access Application cho `vu-toc-lang-chuong-admin.hacmieu.workers.dev`.
2. Allowlist email quản trị gia tộc.
3. Set secrets/vars `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`; `npm run deploy:admin`.
4. Check: HTML admin yêu cầu login; API không JWT vẫn 401; có JWT thì POST được.

### Phase B — UI CRUD tối thiểu (MVP)

Màn hình riêng `public/admin.html` (hoặc `/admin/`):

- Danh sách / tìm người.
- Form tạo–sửa người (`lineage_role`, chi, đời, ghi chú, is_dinh…).
- Form quan hệ cha/mẹ và phối ngẫu (`wife_order`, `wife_person_id`).
- Soft-delete + version conflict message.
- Nút “Xem trên phả đồ” → public URL.

API đã có sẵn: people, parent-relations, spouse-relations + audit + optimistic version.

### Phase C — Mở rộng

- CRUD social_relations + upload photo.
- Sửa luật `tree_scope`/`lineage_role` theo data-contract (không chỉ `branch_id`).
- Preview graph trong admin trước khi publish.

### Phase D — Cắt nguồn Django

- CRUD hàng ngày chỉ trên Cloudflare.
- Django giữ archive / không còn nguồn sự thật cho Vũ Tộc.

## Rủi ro

- Admin HTML hiện public nếu chưa gắn Access edge → ưu tiên Phase A trước Phase B.
- Local mode (`DEPLOYMENT_MODE=local`) bỏ JWT — không bao giờ deploy local lên production.
- WIP Django `api/views.py` / `relationships.html` chưa commit — không liên quan Cloudflare admin; xử lý riêng hoặc bỏ.

## Rollback

Access tắt / vars trống → API lại 503/401 fail-closed; dữ liệu D1 không mất.
