# Hệ Thống Quản Lý Gia Phả Đinh và Quan Hệ - Chi tiết thiết kế

## 1. Phân tích dữ liệu Excel

### Cấu trúc dữ liệu
- **Tệp gốc:** `2024-Gia phả Họ Trần chi 4-Final-Vẽ.xlsx`
- **Bảng tính:** Trang tính1
- **Tổng số bản ghi:** 557 người từ 9 thế hệ (Đời thứ 4 - Đời thứ 12)

### Các cột trong Excel:
1. **Mã & STT** (Column A) - PRIMARY KEY
   - Format: `XXXXX.XXXX` (e.g., 04400.0001)
   - Mỗi người có một ID duy nhất
   - ID đã được sắp xếp theo thứ tự sinh

2. **Họ và Tên đinh** (Column B)
   - Format: `XXXX-Tên người` (e.g., 0001-Trần Trung Hiền)
   - Số XXXX là thứ tự với leading zeros

3. **Năm sinh** (Column C)
   - Dạng số nguyên

4. **Họ và Tên vợ đinh** (Column D)
   - Nếu có nhiều vợ: được ghi trên các dòng riêng
   - Hoặc được đánh số: 1. Vợ thứ nhất, 2. Vợ thứ hai, etc.
   - Sử dụng dấu phẩy để phân tách nhiều vợ trên cùng một dòng

5. **Năm sinh (vợ)** (Column E)
   - Dạng số nguyên

6. **Họ và Tên bố đinh** (Column F)
   - Dùng để thiết lập quan hệ cha-con
   - Format: ID hoặc tên người (XXXX-Tên)

7. **Nơi ở hiện nay** (Column G)
   - Thông tin địa chỉ hiện tại

8. **Ghi chú** (Column H)
   - Thông tin bổ sung: năm mất, ngày giỗ, v.v.

### Nhân vật đặc biệt:
- **25 người có nhiều vợ** (lưu trữ dưới dạng nhiều dòng)
- Ví dụ: ID 10425.0116 (Trần Văn Hưu) có 3 vợ

---

## 2. Kiến trúc Cơ sở dữ liệu

### Models

#### `Genealogy`
```python
- name: CharField (tên gia phả)
- description: TextField
- total_people: PositiveIntegerField
- total_generations: PositiveIntegerField
- json_data: JSONField (lưu trữ dữ liệu GoJS)
- created_at, updated_at: DateTime
```

#### `GenealogyPerson`
```python
- genealogy: ForeignKey(Genealogy)
- person_id: CharField (khóa: 04400.0001) [UNIQUE per genealogy]
- name: CharField (tên rút gọn)
- generation: PositiveIntegerField (4-12)
- birth_year: IntegerField (nullable)
- location: CharField
- notes: TextField
- father_id: CharField (khóa tham chiếu cha - có thể là ID hoặc tên)
- created_at, updated_at: DateTime
```

#### `GenealogySpouse`
```python
- person: ForeignKey(GenealogyPerson)
- name: CharField (tên vợ)
- birth_year: IntegerField (nullable)
- order: PositiveIntegerField (1, 2, 3... cho thứ tự vợ)
- created_at: DateTime
```

#### `GenealogyRelationship`
```python
- genealogy: ForeignKey(Genealogy)
- from_person: ForeignKey(GenealogyPerson)
- to_person: ForeignKey(GenealogyPerson)
- relationship_type: CharField (parent, spouse, sibling)
- created_at: DateTime
```

**Ràng buộc:**
- `(genealogy, person_id)` là UNIQUE
- `(genealogy, from_person, to_person, relationship_type)` là UNIQUE

---

## 3. Quy trình Chuyển Đổi Dữ Liệu

### Management Command: `convert_genealogy_excel`

**Bước 1: Trích xuất dữ liệu Excel**
- Đọc từng dòng
- Phát hiện các heading thế hệ (Đời thứ 04, Đời thứ 05, etc.)
- Lọc chỉ các dòng có ID (regex: `^\d{5}\.\d{4}$`)

**Bước 2: Xử lý dữ liệu**
- Gộp nhiều dòng cùng người_id thành một vợ duy nhất (do một số người có nhiều vợ)
- Parse tên vợ: tách nhãn số (1., 2., 3.) từ tên
- Lọc tên vợ với dấu phẩy

**Bước 3: Phân giải tham chiếu**
- `father_id` ở dạng ID → tìm kiếm direct
- `father_id` ở dạng tên → khớp với full_record_name hoặc name

**Bước 4: Lưu trữ cơ sở dữ liệu**
- Tạo Genealogy object
- Tạo GenealogyPerson cho mỗi người
- Tạo GenealogySpouse cho mỗi vợ
- Tạo GenealogyRelationship cho quan hệ cha-con

**Bước 5: Tạo JSON GoJS**
```json
{
  "nodeDataArray": [
    {
      "key": "04400.0001",
      "name": "Trần Trung Hiền",
      "generation": 4,
      "location": "Chanh Thôn",
      "spouses": "KHÚC TỪ THUẬN",
      "notes": "",
      "birthYear": null,
      "fatherId": null
    },
    ...
  ],
  "linkDataArray": [
    {
      "from": "04400.0001",
      "to": "05410.0002",
      "category": "parent"
    },
    ...
  ],
  "metadata": {
    "totalPeople": 547,
    "totalRelationships": 522,
    "generationRange": [4, 12]
  }
}
```

---

## 4. API Endpoints

### Base URL: `/api/genealogy/`

#### LIST - Liệt kê tất cả gia phả
```
GET /api/genealogy/
```
Response:
```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "name": "Gia Phả Họ Trần Chi 4",
      "total_people": 547,
      "total_generations": 9,
      "created_at": "2024-04-01T..."
    }
  ]
}
```

#### CREATE - Upload Excel file
```
POST /api/genealogy/upload_excel/
Content-Type: multipart/form-data

file: <Excel file>
genealogy_name: "Gia Phả Họ Trần Chi 4"
```
Response: 201 CREATED
```json
{
  "message": "Genealogy imported successfully",
  "genealogy": { ... },
  "conversion_log": "..."
}
```

#### RETRIEVE - Chi tiết gia phả
```
GET /api/genealogy/{id}/
```

#### GET GOJS DATA - Dữ liệu cho GoJS
```
GET /api/genealogy/{id}/gojs_data/
```
Response: Dữ liệu JSON có `nodeDataArray` và `linkDataArray`

#### EXPORT JSON - Tải xuống JSON
```
GET /api/genealogy/{id}/export_json/
```
Response: File JSON attachment

#### PREVIEW - Xem trước
```
GET /api/genealogy/{id}/preview/
```
Response: First 50 people

#### TREE DATA - Dữ liệu cây
```
GET /api/genealogy/{id}/tree_data/
```
Response:
```json
{
  "generationTree": {
    "4": [ { id, name, ... }, ... ],
    "5": [ ... ],
    ...
  }
}
```

---

## 5. Frontend - GoJS Viewer

### Template: `templates/core/genealogy_viewer.html`

**Bố trí:**
- **Panel điều khiển** (300px bên trái)
  - Chọn gia phả từ dropdown
  - Tìm kiếm người
  - Lọc theo thế hệ
  - Các nút: Zoom, Center, Export Image, Download JSON
  - Chế độ xem (Tree/Relationship)
  - Thông tin thống kê
  - Panel thông tin người được chọn

- **Vùng biểu đồ** (phần còn lại)
  - GoJS diagram container
  - Hiển thị phả đồ

### Features:

1. **Tìm Kiếm**
   - Tìm theo tên hoặc ID
   - Highlight kết quả

2. **Lọc**
   - Theo thế hệ
   - Hiển/ẩn các nút

3. **Xem**
   - Tree Layout: Hiển thị theo hierarchical
   - Relationship Layout: Force-directed

4. **Tương tác**
   - Click nút → Hiển thị thông tin
   - Double-click → Mở chi tiết
   - Scroll zoom
   - Click-drag pan

5. **Export**
   - Xuất ảnh PNG
   - Tải JSON

### Mã HTML/JS: `static/js/genealogy-viewer.js`

---

## 6. Quy trình Sử dụng

### 1. Upload Excel
```bash
# Thủ công qua Django admin hoặc API
curl -X POST http://localhost:8000/api/genealogy/upload_excel/ \
  -F "file=@2024-Gia phả Họ Trần chi 4-Final-Vẽ.xlsx" \
  -F "genealogy_name=Gia Phả Họ Trần Chi 4"
```

### 2. Xem Phả Đồ
- Truy cập: `http://localhost:8000/genealogy-viewer/`
- Chọn gia phả từ dropdown
- Phả đồ sẽ tải với 547 người

### 3. Tương tác
- Tìm kiếm tên
- Lọc thế hệ
- Click người để xem thông tin
- Export ảnh hoặc JSON

---

## 7. Thống kê

### Dữ liệu Hiện tại:
```
Tổng số người: 547
Tổng quan hệ (cha-con): 522
Thế hệ: 4-12 (9 thế hệ)
Người có nhiều vợ: 25

Phân bố theo thế hệ:
- Đời 4: 1 người (Trần Trung Hiền - gốc)
- Đời 5: 3 người
- Đời 6: ~15 người
- ...
- Đời 12: ~50 người
```

---

## 8. Các Tính Năng Bổ Sung (Tương Lai)

1. **Import thêm dòng họ** khác
2. **Merge** hai gia phả
3. **Tìm kiếm nâng cao** (theo năm sinh, nơi ở, etc.)
4. **Biểu đồ thống kê** (phân bố thế hệ, tỷ lệ giới tính, etc.)
5. **Export** sang các định dạng khác (PDF, SVG)
6. **Lịch sử chỉnh sửa** và versioning
7. **Sharing** phả đồ (link công khai)
8. **Mobile app** cho xem phả đồ

---

## 9. Cải Tiến Thiết Kế Tương Lai

### Current Status:
- ✅ Import Excel
- ✅ Lưu DB
- ✅ GoJS Visualization
- ✅ API CRUD
- ✅ Search/Filter

### TODO:
- [ ] Mobile responsive UI
- [ ] Performance optimization (lazy load for large genealogies)
- [ ] Relationship search (tìm người có liên quan)
- [ ] Ancestor/descendant highlighting
- [ ] Print-friendly layout
- [ ] Multi-language support
- [ ] User annotations (ghi chú người dùng)
- [ ] Collaboration features

---

**Phiên bản:** v1.0
**Cập nhật:** 2024-04-01
**Trạng thái:** Đang phát triển
