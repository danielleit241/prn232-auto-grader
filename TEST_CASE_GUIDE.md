# 📖 Hướng Dẫn Đọc Kết Quả Chấm - Chi Tiết Từng Test Case

## Khi Xem Kết Quả (Result Detail Page)

### 📊 Header - Điểm Tổng Hợp
```
Điểm Auto: 0/100      (Điểm tính tự động từ test)
Điểm Chỉnh: /100      (Điểm sau khi giáo viên sửa - nếu có)
Điểm Cuối Cùng: 0/100 (Điểm cuối = max(Auto, Chỉnh) hoặc tuỳ chọn)
```

---

## 🔍 Tab "Chi Tiết Chấm" - Mỗi Test Case

### Cấu Trúc Hiển Thị:

```
┌─────────────────────────────────────────────┐
│ ✗ FAIL  [RED]                               │
├─────────────────────────────────────────────┤
│ Test Case Name:                             │
│   GET /api/students                         │
│                                             │
│ HTTP Method: GET                            │
│ Điểm: 0/1                                   │
│                                             │
│ ❌ Lý Do FAIL:                              │
│   Response schema missing properties:       │
│   studentId, studentName, email, gpa       │
│                                             │
│ ✅ Expected (Dự Kiến):                      │
│   {                                         │
│     "studentId": 1,                         │
│     "studentName": "John",                  │
│     "email": "john@email.com",              │
│     "gpa": 3.8                              │
│   }                                         │
│                                             │
│ ❌ Actual (Thực Tế):                        │
│   {                                         │
│     "studentId": 1,                         │
│     "studentName": "John"                   │
│   }                                         │
└─────────────────────────────────────────────┘
```

---

## 🎓 Ví Dụ: Q1 REST API Tests

### Test 1: GET /api/students
**Mục đích:** Kiểm tra endpoint trả về array học sinh với đầy đủ fields

**Khi PASS ✅**
```
- Endpoint tồn tại trong swagger.json
- Response schema có fields: studentId, studentName, email, gpa
- Type = Array
- HTTP 200
```

**Khi FAIL ❌ - Các lý do có thể:**
1. Endpoint không tồn tại
   ```
   Lý Do: Path '/api/students' not found in swagger
   ```

2. Response thiếu fields
   ```
   Lý Do: Response schema missing properties: gpa
   Expected: { studentId, studentName, email, gpa }
   Actual: { studentId, studentName, email }
   ```

3. Response không phải array
   ```
   Lý Do: Response is not array but expected array
   ```

---

### Test 2: GET /api/student-performance
**Mục đích:** Kiểm tra endpoint trả về statistics với đầy đủ fields

**Khi FAIL ❌ - Ví dụ:**
```
Lý Do: Response schema missing properties: pageSize
Expected Fields: data, totalStudents, totalPages, current, pageSize
Actual Fields: data, totalStudents, totalPages, current
```

---

### Test 5: DELETE /api/enrollments/0
**Mục đích:** Kiểm tra endpoint trả về 404 khi ID không tồn tại

**Khi PASS ✅**
```
- Gọi DELETE /api/enrollments/0
- Server trả về HTTP Status: 404
```

**Khi FAIL ❌ - Các lý do:**
1. Trả về 200 thay vì 404
   ```
   Lý Do: Expected status 404 but got 200
   Actual Status: 200
   Expected Status: 404
   ```

2. Trả về 500 (lỗi server)
   ```
   Lý Do: Expected status 404 but got 500
   Actual Status: 500
   Expected Status: 404
   ```

---

## 🎨 Ví Dụ: Q2 Razor Pages Tests

### Test 1: GET /Instructor - có <table>
**Mục đích:** Kiểm tra page chứa table element

**Khi PASS ✅**
```
- Gọi GET /Instructor
- Server trả về HTTP 200
- HTML response chứa <table> element
```

**Khi FAIL ❌ - Lý do:**
```
Lý Do: CSS selector 'table' not found in response
Expected: <table>...</table> element
Actual: HTML không chứa table
```

---

### Test 3: Table có ≥1 dòng dữ liệu
**Mục đích:** Kiểm tra table không rỗng

**Khi FAIL ❌**
```
Lý Do: Selector 'table tbody tr' count 0 but expected minimum 1
Expected: ≥ 1 dòng (elements matching selector)
Actual: 0 dòng
```

---

## 🔧 Cách Chỉnh Điểm (Adjust Score)

### Khi Nào Chỉnh Điểm?

**Chỉnh lên (Adjustment)** nếu:
- ✅ Code sinh viên đúng nhưng test case định nghĩa sai
- ✅ Thiếu 1-2 fields nhưng logic chính đúng
- ✅ Endpoint trả về gần đúng nhưng format khác

**Ví dụ:**
```
Original: 0/5
Adjusted: 4/5
Reason: Endpoint tồn tại, chỉ thiếu 1 field nhưng logic OK.
Adjusted By: gv@fpt.edu.vn
```

---

## 💬 Tab "Bình Luận" - Feedback cho Sinh Viên

### Thêm Comment:
```
Email: gv@fpt.edu.vn
Nội Dung: Q1 cần thêm field 'gpa' vào response. 
          Q2 page load OK, table có dữ liệu nhưng thiếu form.
          Redo Q2 form để được full điểm.

[Gửi Bình Luận]
```

### Comments sẽ hiển thị:
- Dưới dạng danh sách
- Ngày giờ comment
- Email người comment
- Nội dung feedback

---

## 🎯 Quy Trình Xem & Chấm Điểm

```
1. Frontend → Submissions
   ↓
2. Chọn submission (sinh viên)
   ↓
3. Xem Kết Quả Chấm
   ↓
4. Chi Tiết Chấm Tab:
   ├── Đọc test cases
   ├── Hiểu lý do FAIL
   ├── Quyết định có chỉnh điểm không
   │   ├── Nếu cần: Click "Chỉnh Điểm"
   │   └── Nhập điểm mới + lý do
   └── Submit
   ↓
5. Bình Luận Tab:
   ├── Viết feedback cho sinh viên
   └── Submit comment
   ↓
6. Export Excel (tất cả sinh viên)
```

---

## 📱 Thông Tin Bổ Sung

### Nếu Không Có Chi Tiết Test Case:
- Có thể test case được tạo từ version cũ (không có description)
- Hãy kiểm tra: Question → Test Case Details page
- Hoặc tạo lại test case với tên (name) mô tả rõ

### Nếu Status = "Error" (không phải PASS/FAIL):
- Job chạy lỗi (không thể kết nối endpoint, timeout, etc.)
- Kiểm tra: Submission detail → Grading Job tab
- Xem error message chi tiết

### Scores = 0/100 nhưng Expected = 5 điểm:
- Có thể: Test case definition không khớp code sinh viên
- Action: Xem lý do FAIL chi tiết → quyết định chỉnh điểm

---

## ✅ Checklist Khi Chấm

- [ ] Đọc tên test case (biết test gì)
- [ ] Check Expected vs Actual nếu FAIL
- [ ] Quyết định: Code sinh viên sai? Hay test case định nghĩa sai?
- [ ] Chỉnh điểm nếu cần (code đúng nhưng test case sai)
- [ ] Viết feedback tích cực cho sinh viên
- [ ] Export Excel khi xong tất cả submissions
