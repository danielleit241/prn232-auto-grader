# 🎯 Hệ Thống Chấm Điểm Tự Động - Giải Thích Chi Tiết

## ⚠️ TẠI SAO TEST FAIL HẾT NHƯNG SWAGGER CÓ ĐIỂM?

### Vấn đề Hiện Tại
```
❌ Test Cases Hiện Tại (jsonplaceholder):
  GET https://jsonplaceholder.typicode.com/posts/1
  → Gọi external API, không liên quan tới code sinh viên
  → FAIL vì grader không thể kết nối hoặc endpoint không đúng

✅ Khi Test Trên Swagger:
  GET http://localhost:5100/api/students  (API sinh viên)
  → Gọi trực tiếp endpoint sinh viên
  → PASS vì code sinh viên tồn tại
```

---

## 📋 TEST CASES ĐÚNG (Từ grading-system.http)

### Q1: REST API (5 điểm) - Chấm endpoints sinh viên

Sinh viên phải tạo 5 endpoints này và trả về đúng fields:

| # | Endpoint | Method | Expected Response | Test | Điểm |
|---|----------|--------|-------------------|------|------|
| 1 | `/api/students` | GET | Array of students với fields: **studentId, studentName, email, gpa** | Swagger | 1đ |
| 2 | `/api/student-performance` | GET | Object với fields: **data, totalStudents, totalPages, current, pageSize** | Swagger | 1đ |
| 3 | `/api/enrollments/{id}/grade` | PUT | Endpoint tồn tại (check swagger path) | Swagger | 1đ |
| 4 | `/api/enrollments/{id}` | DELETE | Endpoint tồn tại (check swagger path) | Swagger | 1đ |
| 5 | `/api/enrollments/0` | DELETE | Response status **404** (Not Found) | HTTP | 1đ |

**Cách chấm:**
- Test 1-4: Đọc swagger.json của sinh viên → check endpoints + response schema
- Test 5: Gọi thực endpoint → verify HTTP status là 404

---

### Q2: Razor Pages (5 điểm) - Chấm UI elements

Sinh viên phải tạo Razor Pages với HTML elements cụ thể:

| # | Route | Method | Expected Elements | Test | Điểm |
|---|-------|--------|------------------|------|------|
| 1 | `/Instructor` | GET | HTML status 200 + có `<table>` element | HTTP | 1đ |
| 2 | `/Instructor` | GET | HTML status 200 + có `<form>` element | HTTP | 1đ |
| 3 | `/Instructor` | GET | HTML status 200 + `<table tbody tr>` ≥ 1 dòng | HTTP | 1đ |
| 4 | `/Instructor/1` | GET | HTML status 200 + có `<table>` element | HTTP | 1đ |
| 5 | `/Instructor/1` | GET | HTML status 200 + `<table tbody tr>` ≥ 1 dòng | HTTP | 1đ |

**Cách chấm:**
- Gọi thực URL sinh viên
- Parse HTML response
- Kiểm tra CSS selectors tồn tại
- Kiểm tra có dữ liệu trong table (≥1 row)

---

## 🔧 CÁCH UP TEST CASES ĐÚNG

### Bước 1: Xoá Test Cases Cũ
```bash
DELETE http://localhost:5049/api/v1.0/questions/{questionId}/test-cases
```

### Bước 2: Tạo Test Cases Q1 (REST API)
```http
POST http://localhost:5049/api/v1.0/questions/{q1Id}/test-cases
Content-Type: application/json

[
  {
    "name": "Swagger: GET /api/students (array fields)",
    "httpMethod": "GET",
    "urlTemplate": "/api/students",
    "isArray": true,
    "fields": ["studentId", "studentName", "email", "gpa"],
    "score": 1
  },
  {
    "name": "Swagger: GET /api/student-performance",
    "httpMethod": "GET",
    "urlTemplate": "/api/student-performance",
    "fields": ["data", "totalStudents", "totalPages", "current", "pageSize"],
    "score": 1
  },
  {
    "name": "Swagger: PUT /api/enrollments/{id}/grade",
    "httpMethod": "PUT",
    "urlTemplate": "/api/enrollments/{id}/grade",
    "score": 1
  },
  {
    "name": "Swagger: DELETE /api/enrollments/{id}",
    "httpMethod": "DELETE",
    "urlTemplate": "/api/enrollments/{id}",
    "score": 1
  },
  {
    "name": "HTTP: DELETE /api/enrollments/0 (expect 404)",
    "httpMethod": "DELETE",
    "urlTemplate": "/api/enrollments/0",
    "expectedStatus": 404,
    "score": 1
  }
]
```

### Bước 3: Tạo Test Cases Q2 (Razor Pages)
```http
POST http://localhost:5049/api/v1.0/questions/{q2Id}/test-cases
Content-Type: application/json

[
  {
    "name": "GET /Instructor - có <table>",
    "httpMethod": "GET",
    "urlTemplate": "/Instructor",
    "expectedStatus": 200,
    "selector": "table",
    "score": 1
  },
  {
    "name": "GET /Instructor - có <form>",
    "httpMethod": "GET",
    "urlTemplate": "/Instructor",
    "expectedStatus": 200,
    "selector": "form",
    "score": 1
  },
  {
    "name": "GET /Instructor - table có ≥1 dòng",
    "httpMethod": "GET",
    "urlTemplate": "/Instructor",
    "expectedStatus": 200,
    "selector": "table tbody tr",
    "selectorMinCount": 1,
    "score": 1
  },
  {
    "name": "GET /Instructor/1 - có <table>",
    "httpMethod": "GET",
    "urlTemplate": "/Instructor/1",
    "expectedStatus": 200,
    "selector": "table",
    "score": 1
  },
  {
    "name": "GET /Instructor/1 - table có ≥1 dòng",
    "httpMethod": "GET",
    "urlTemplate": "/Instructor/1",
    "expectedStatus": 200,
    "selector": "table tbody tr",
    "selectorMinCount": 1,
    "score": 1
  }
]
```

---

## 🎓 LUỒNG CHẤM ĐIỂM

```
1. Sinh viên nộp artifact.zip
   ├── Q1/  (dotnet publish Q1)
   └── Q2/  (dotnet publish Q2)

2. Grader trigger chấm
   ├── Khởi động Q1 (REST API) trên port tạm thời
   ├── Khởi động Q2 (Razor Pages) trên port khác
   ├── Khởi động đọc GivenAPIBaseUrl (API sinh viên Q1)
   
3. Worker chạy test cases
   ├── Q1 Tests:
   │   ├── Đọc swagger.json từ Q1
   │   ├── Kiểm tra endpoint + fields trong schema
   │   ├── Gọi HTTP endpoint 404 test
   │   └── Tính điểm
   ├── Q2 Tests:
   │   ├── Gọi GET /Instructor
   │   ├── Parse HTML response
   │   ├── Tìm CSS selectors
   │   └── Tính điểm
   
4. Ghi kết quả (chi tiết từng test case)
   ├── Test 1: PASS/FAIL + điểm
   ├── Test 2: PASS/FAIL + điểm
   ├── ...
   └── Tổng điểm Q1 + Q2

5. Giáo viên review trên Frontend
   ├── Xem từng test case là test gì
   ├── Xem expected vs actual nếu FAIL
   ├── Chỉnh điểm thủ công nếu cần
   └── Export Excel
```

---

## 📺 FRONTEND HIỂN THỊ

### Chi Tiết Chấm Tab - Các thông tin hiển thị:

**Mỗi Test Case:**
- ✅ Tên test case (test cái gì)
- ✅ HTTP method + URL endpoint
- ✅ Status (PASS/FAIL)
- ✅ Điểm nhận được
- ✅ **Lý do FAIL** (nếu fail)
  - Expected: fields cần có, selector cần tìm, etc.
  - Actual: thực tế trả về gì
  - Sai khác (missing fields, không tìm thấy selector, etc.)

---

## 💡 NHỮNG THAY ĐỔI VỪA LÀMLƯỚI

| Component | Thay Đổi | Lý Do |
|-----------|----------|-------|
| **CreateTestCaseRequest** (Backend) | Thêm `name` field | Để ghi mô tả test case |
| **Result Detail Page** (Frontend) | Thêm "Lý do FAIL" section | Hiển thị expected vs actual rõ ràng |
| **Test Case Detail** (Frontend) | Tăng cường hiển thị | Giáo viên xem chi tiết test |

---

## 🚀 HÀNH ĐỘNG TIẾP THEO

1. **Replace Test Cases** dùng script trong `grading-system.http`
2. **Trigger Grading** lại cho submission hiện tại
3. **Xem Kết Quả** trên Frontend → sẽ thấy lý do FAIL chi tiết
4. **Chỉnh Điểm** nếu cần thiết (nếu sinh viên code đúng nhưng test case sai)

---

## 📚 Tham Khảo

- **Backend File:** `be/grading-system.http` (lines 82-180)
- **Frontend:** `fe/grading-system/src/app/assignments/[id]/submissions/[submissionId]/results/[resultId]/page.tsx`
- **API Docs:** Xem từng endpoint trên Swagger khi server chạy
