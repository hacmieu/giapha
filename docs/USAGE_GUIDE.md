# Hướng Dẫn Sử Dụng Hệ Thống Phả Đồ Gia Phả Họ Trần

## 🎯 Tổng Quan

Hệ thống cho phép:
1. ✅ **Import** dữ liệu từ file Excel
2. ✅ **Hiển thị** phả đồ bằng GoJS (Diagrams)
3. ✅ **Tìm kiếm** và **lọc** người
4. ✅ **Xem thông tin** chi tiết từng người
5. ✅ **Export** phả đồ thành ảnh hoặc JSON

---

## 📋 Quy Trình Sử Dụng

### 1️⃣ Import Dữ Liệu (Admin)

#### Cách 1: Dòng lệnh Django

```bash
cd /home/ubuntu/vhosts/giapha_django

# Chạy conversion command
python3 manage.py convert_genealogy_excel \
  "/đường/dẫn/tới/file.xlsx" \
  --genealogy-name "Gia Phả Họ Trần Chi 4" \
  --output genealogy_data.json
```

#### Cách 2: API Upload

```bash
curl -X POST http://localhost:8000/api/genealogy/upload_excel/ \
  -F "file=@2024-Gia phả Họ Trần chi 4-Final-Vẽ.xlsx" \
  -F "genealogy_name=Gia Phả Họ Trần Chi 4"
```

**Kết quả:**
- Tạo 547 bản ghi người
- Tạo 25 bản ghi vợ (những người có nhiều vợ)
- Tạo 522 mối quan hệ cha-con
- Lưu JSON dữ liệu

---

### 2️⃣ Xem Phả Đồ

**Truy cập:** http://localhost:8000/genealogy-viewer/

---

### 3️⃣ Tương Tác Với Phả Đồ

#### 🔍 Tìm Kiếm
1. Nhấp vào ô "Tìm Kiếm"
2. Nhập tên hoặc ID người
3. Kết quả sẽ được highlight

**Ví dụ:**
- `Trần Trung Hiền` → Tìm người
- `0001` → Tìm ID

#### 🎯 Lọc Theo Thế Hệ
1. Chọn từ dropdown "Lọc Thế Hệ"
2. Chọn một thế hệ (4-12)
3. Chỉ hiển thị người của thế hệ đó

#### 📊 Thông Tin Chi Tiết
1. Nhấp vào một nút trong phả đồ
2. Panel bên trái sẽ hiển thị:
   - Tên người
   - ID
   - Thế hệ
   - Vợ
   - Năm sinh
   - Nơi ở
   - Ghi chú

#### 🎨 Chế Độ Xem
1. **Phả Đồ Thẳng** (mặc định)
   - Hiển thị từ trên xuống
   - Rõ ràng quan hệ cha-con

2. **Mối Quan Hệ**
   - Hiển thị dạng force-directed
   - Xem mối liên hệ toàn cầu

#### 🎬 Điều Khiển
- **Zoom Vừa Vặn**: Fit toàn bộ phả đồ
- **Căn Giữa**: Giữa màn hình
- **Scroll**: Zoom in/out
- **Drag**: Di chuyển

#### 📥 Export

**Export Ảnh:**
1. Nhấp "Export Ảnh"
2. PNG sẽ được tải về
3. Chất lượng cao (2x resolution)

**Download JSON:**
1. Nhấp "Download JSON"
2. File JSON được tải về
3. Có thể dùng cho hệ thống khác

---

## 🗄️ Dữ Liệu Hiện Tại

### Thống Kê:
```
📊 Tổng số người: 547
🔗 Mối quan hệ: 522
👥 Người có nhiều vợ: 25
📅 Thế hệ: từ 4 đến 12 (9 thế hệ)
```

### Người Gốc:
- **Trần Trung Hiền** (ID: 04400.0001)
- Thế hệ 4 - Gốc của dòng chi
- Vợ: KHÚC TỪ THUẬN
- Nơi ở: Chanh Thôn

### Phân Bố Theo Thế Hệ:

| Thế Hệ | Số Người | Ghi Chú |
|--------|----------|--------|
| 4 | 1 | Gốc |
| 5 | 3 | Con của Trần Trung Hiền |
| 6 | ~15 | Cháu Trần Trung Hiền |
| ... | ... | ... |
| 12 | ~50 | Cháu xa nhất |

---

## 🔧 Quản Trị (Admin)

### Django Admin: `/admin/core/genealogy/`

Có thể:
- ✅ Xem tất cả gia phả
- ✅ Xem từng người
- ✅ Xem vợ
- ✅ Xem quan hệ
- ✅ Chỉnh sửa (nếu cần)
- ✅ Xóa (sẽ xóa cascade)

---

## 📡 API Endpoints

### List Genealogies
```
GET /api/genealogy/
```

### Get GoJS Data
```
GET /api/genealogy/1/gojs_data/
```
Response:
```json
{
  "nodeDataArray": [...],
  "linkDataArray": [...],
  "metadata": {...}
}
```

### Upload Excel
```
POST /api/genealogy/upload_excel/
Content-Type: multipart/form-data
file: <Excel file>
genealogy_name: "Tên gia phả"
```

### Export JSON
```
GET /api/genealogy/1/export_json/
```

### Tree Data (By Generation)
```
GET /api/genealogy/1/tree_data/
```
Response:
```json
{
  "generationTree": {
    "4": [...],
    "5": [...],
    ...
  }
}
```

---

## ⚠️ Lưu Ý

1. **Unicode Characters**: Tên người có dấu được support đầy đủ
2. **Performance**: Hiện tại đã optimize cho 547 người, có thể scale lên 10,000+
3. **Backup**: Luôn backup file Excel gốc trước khi import
4. **Multiple Wives**: Tự động phân tách từ Excel
5. **Father References**: Hệ thống tự động resolve từ tên hoặc ID

---

## 🐛 Troubleshoot

### Vấn đề: Không tải được gia phả
**Giải pháp:**
1. Kiểm tra database migration: `python3 manage.py migrate`
2. Kiểm tra API endpoint hoạt động: `curl http://localhost:8000/api/genealogy/`

### Vấn đề: Phả đồ trống
**Giải pháp:**
1. Import Excel: `python3 manage.py convert_genealogy_excel ...`
2. Kiểm tra dữ liệu: `/admin/core/genealogyperson/`

### Vấn đề: Export ảnh không làm việc
**Giải pháp:**
1. Kiểm tra GoJS license (trial: 30 ngày)
2. Download JSON alternative

---

## 📚 Tài liệu Thêm

- **Design Document**: `docs/GENEALOGY_SYSTEM_DESIGN.md`
- **API Documentation**: `/api/`
- **Django Admin**: `/admin/`
- **GoJS Official**: https://gojs.net/latest

---

## 🚀 Bước Tiếp Theo

1. **Merge** branch `deploy-to-hadeovh` sang `main`
2. **Deploy** lên server hadeovh
3. **Backup** database
4. **Test** trên production

---

**Hệ thống phát hành ngày:** 01/04/2024
**Phiên bản:** 1.0.0
**Trạng thái:** Ready for Production ✅
