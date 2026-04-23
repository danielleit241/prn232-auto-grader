# FE Handoff: Grading System – Thiết kế lại luồng chấm thi

> Date: 2026-04-17  
> Base URL: `http://localhost:5049/api/v1`

---

## Tổng quan thay đổi so với phiên bản cũ

| Điểm | Cũ | Mới |
|------|-----|-----|
| Upload bài | `POST /submissions/upload` (1 bài/lần) | `POST /assignments/{id}/bulk-upload` (toàn bộ) |
| Trigger chấm | `POST /submissions/{id}/grade` | `POST /assignments/{id}/grade` |
| Participant | Không có | Import CSV per-assignment trước khi upload |
| Mã đề unique | Global | Chỉ unique trong 1 exam-session |
| Export | Theo `assignmentCode` (string) | Theo `assignmentId` (GUID) |
| Export session | Không có | `POST /exam-sessions/{id}/exports` → multi-sheet |
| Xem kết quả | Theo từng submission | Tổng hợp tất cả: `GET /exam-sessions/{id}/results` |
| Artifact sau chấm | Lưu mãi | Tự động xóa sau khi chấm xong |

---

## Luồng hoàn chỉnh

```
[1] Tạo ExamSession
        ↓
[2] Tạo Assignment (per mã đề) + Upload DB SQL + GivenAPI URL
        ↓
[3] Import danh sách thí sinh (CSV per assignment)
        ↓
[4] Tạo Questions cho Assignment
        ↓
[5] Tạo Test Cases cho từng Question
        ↓
[6] Bulk Upload bài làm (master.zip)
        ↓
[7] Trigger Grading (async qua RabbitMQ)
        ↓ poll GradingJob status
[8] Xem kết quả tổng (exam-session) hoặc chi tiết (submission)
        ↓
[9] Review: chỉnh điểm thủ công + ghi chú
        ↓
[10] Export Excel (per-assignment hoặc tổng session)
```

---

## 1. Endpoint Map

### ExamSession
- `POST /exam-sessions` — tạo kỳ thi
- `GET /exam-sessions` — danh sách kỳ thi
- `GET /exam-sessions/{id}` — chi tiết kỳ thi + danh sách mã đề
- `DELETE /exam-sessions/{id}` — xóa kỳ thi
- `GET /exam-sessions/{id}/participants` — tổng hợp thí sinh của kỳ thi (all assignments)
- `GET /exam-sessions/{id}/results` — kết quả tổng hợp của kỳ thi
- `POST /exam-sessions/{id}/exports` — export Excel toàn kỳ (multi-sheet)

### Assignment (mã đề)
- `POST /assignments` — tạo mã đề
- `GET /assignments` — danh sách mã đề
- `GET /assignments/{id}` — chi tiết mã đề
- `DELETE /assignments/{id}` — xóa mã đề
- `PUT /assignments/{id}/resources` — upload DB SQL + GivenAPI URL
- `POST /assignments/{id}/participants/import` — import CSV thí sinh
- `GET /assignments/{id}/participants` — danh sách thí sinh của mã đề
- `POST /assignments/{id}/bulk-upload` — upload toàn bộ bài làm (master.zip)
- `POST /assignments/{id}/grade` — trigger chấm bài
- `GET /assignments/{id}/submissions` — danh sách submissions

### Questions
- `POST /assignments/{assignmentId}/questions` — tạo câu hỏi (bulk)
- `GET /assignments/{assignmentId}/questions` — danh sách câu hỏi

### Test Cases
- `POST /questions/{q1Id}/test-cases` — tạo test cases cho 1 câu

### Submissions
- `GET /submissions/{id}` — chi tiết submission
- `GET /submissions/{id}/results` — kết quả chấm của submission
- `PUT /submissions/{id}/notes` — ghi chú nhận xét
- `DELETE /submissions/{id}` — xóa submission

### GradingJobs
- `GET /grading-jobs/{id}` — trạng thái 1 grading job
- `GET /submissions/{submissionId}/grading-jobs` — lịch sử jobs của submission

### QuestionResults
- `GET /question-results/{id}` — chi tiết 1 kết quả câu hỏi
- `GET /submissions/{submissionId}/question-results` — tất cả kết quả của submission
- `PUT /question-results/{id}/adjust` — chỉnh điểm thủ công
- `DELETE /question-results/{id}/adjust` — hủy chỉnh điểm

### Exports
- `POST /exports` — export Excel per-assignment
- `GET /exports/{id}` — trạng thái export job
- `GET /exports/{id}/download` — tải file Excel

---

## 2. Contracts

### [1] Tạo ExamSession

`POST /exam-sessions`

**Body:**
```json
{ "title": "PE PRN232 – Kỳ Xuân 2026", "description": "Thi thực hành PRN232" }
```

| Field | Type | Bắt buộc | Ghi chú |
|---|---|---|---|
| title | string | ✓ | |
| description | string? | — | |

**Response `data`:**
```json
{
  "id": "uuid",
  "title": "PE PRN232 – Kỳ Xuân 2026",
  "description": "...",
  "createdAt": "2026-04-17T...",
  "assignments": []
}
```

---

### [2a] Tạo Assignment

`POST /assignments`

**Body:**
```json
{
  "code": "101",
  "title": "Mã đề 101",
  "description": "REST API + Razor Pages",
  "examSessionId": "uuid"
}
```

| Field | Type | Bắt buộc | Ghi chú |
|---|---|---|---|
| code | string | ✓ | Unique trong exam-session, max 50 chars |
| title | string | ✓ | max 200 chars |
| description | string? | — | max 2000 chars |
| examSessionId | Guid? | — | Liên kết với kỳ thi |

**Response `data`:**
```json
{
  "id": "uuid",
  "code": "101",
  "title": "Mã đề 101",
  "description": "...",
  "databaseSqlPath": null,
  "givenApiBaseUrl": null,
  "createdAt": "..."
}
```

---

### [2b] Upload Resources (DB SQL + Given API URL)

`PUT /assignments/{id}/resources`  
**Content-Type:** `multipart/form-data`

| Field | Type | Bắt buộc | Ghi chú |
|---|---|---|---|
| databaseSql | File (.sql) | — | Ít nhất 1 trong 2 phải có |
| givenApiBaseUrl | string | — | HTTP/HTTPS URL hợp lệ |

**Response `data`:** `AssignmentDto` (giống create)

---

### [3] Import Thí Sinh per Assignment

`POST /assignments/{id}/participants/import`  
**Content-Type:** `multipart/form-data`

| Field | Type | Bắt buộc | Ghi chú |
|---|---|---|---|
| file | File (.csv) | ✓ | |

**Định dạng CSV:**
```
username,studentCode
hoalvpse181951,pse181951
nguyenvase182001,se182001
```
- Dòng đầu (header) tự động bỏ qua
- `username` = tên folder trong master.zip
- `studentCode` = mã sinh viên

**Response `data`:**
```json
{
  "created": 5,
  "skipped": 1,
  "errors": ["Line 3: expected 'username,studentCode'."]
}
```

---

### [4] Tạo Questions

`POST /assignments/{assignmentId}/questions`

**Body:** mảng questions
```json
[
  { "title": "Câu 1: REST API", "type": 0, "maxScore": 5, "artifactFolderName": "1" },
  { "title": "Câu 2: Razor Pages", "type": 1, "maxScore": 5, "artifactFolderName": "2" }
]
```

| Field | Type | Bắt buộc | Ghi chú |
|---|---|---|---|
| title | string | ✓ | max 200 chars |
| type | int (QuestionType) | ✓ | `0` = Api, `1` = Razor |
| maxScore | int | ✓ | ≥ 1 |
| artifactFolderName | string | ✓ | Tên subfolder trong zip, e.g. "1", "2" |

**Response `data`:** `QuestionDto[]`
```json
[
  { "id": "uuid", "assignmentId": "uuid", "title": "...", "type": 0, "maxScore": 5, "artifactFolderName": "1" }
]
```

---

### [5] Tạo Test Cases

`POST /questions/{questionId}/test-cases`

**Body:** mảng test cases

**Loại test case theo QuestionType:**

**Q1 (Api) — luôn dùng Newman mode**

Quy tắc: nếu `expectedStatus` là success (2xx) → **bắt buộc có `expectedBody`**. Nếu là error (4xx/5xx) → không cần `expectedBody` (chỉ check status).

Ví dụ GET danh sách — success, có body:
```json
{
  "httpMethod": "GET",
  "urlTemplate": "/api/students",
  "expectedStatus": 200,
  "expectedBody": [
    { "studentId": 1, "studentName": "Nguyen Hoang Long", "gpa": 8.25 }
  ],
  "score": 1
}
```

Ví dụ GET có query params — success, có body:
```json
{
  "httpMethod": "GET",
  "urlTemplate": "/api/student-performance",
  "expectedStatus": 200,
  "input": { "page": 1, "pageSize": 5 },
  "expectedBody": { "data": [...], "totalStudents": 5, "current": 1 },
  "score": 1
}
```

Ví dụ GET validation error — error status, không cần body:
```json
{
  "httpMethod": "GET",
  "urlTemplate": "/api/student-performance",
  "expectedStatus": 400,
  "input": { "page": 0, "pageSize": 5 },
  "score": 1
}
```

Ví dụ PUT có request body — success, có body:
```json
{
  "httpMethod": "PUT",
  "urlTemplate": "/api/enrollments/4/grade",
  "expectedStatus": 200,
  "input": { "grade": 8.5 },
  "expectedBody": { "enrollmentId": 4, "studentId": 4, "grade": 8.5 },
  "score": 1
}
```

**Q2 (Razor) — kiểm tra element tồn tại:**
```json
{
  "httpMethod": "GET",
  "urlTemplate": "/Instructor",
  "expectedStatus": 200,
  "elementId": "ip_instructorName",
  "score": 1
}
```

**Q2 (Razor) — kiểm tra element + text:**
```json
{
  "httpMethod": "GET",
  "urlTemplate": "/Instructor/1",
  "expectedStatus": 200,
  "elementId": "span_1",
  "elementText": "1",
  "score": 1
}
```

**Q2 (Razor) — kiểm tra CSS selector count:**
```json
{
  "httpMethod": "GET",
  "urlTemplate": "/Instructor",
  "expectedStatus": 200,
  "selector": "table tbody tr",
  "selectorMinCount": 5,
  "score": 1
}
```

| Field | Type | Ghi chú |
|---|---|---|
| httpMethod | string | GET / POST / PUT / DELETE |
| urlTemplate | string | Path trên student's API/Razor |
| expectedStatus | int? | HTTP status code mong đợi |
| expectedBody | any? | **Q1:** bắt buộc nếu `expectedStatus` là 2xx; bỏ trống nếu là 4xx/5xx |
| input | object? | Query params (GET) hoặc request body (POST/PUT) |
| elementId | string? | Q2: id của DOM element cần kiểm tra |
| elementText | string? | Q2: nội dung text mong đợi |
| selector | string? | Q2: CSS selector |
| selectorMinCount | int? | Q2: số phần tử tối thiểu khớp selector |
| score | int | Điểm cho test case này |

---

### [6] Bulk Upload Bài Làm

`POST /assignments/{id}/bulk-upload`  
**Content-Type:** `multipart/form-data`  
**Giới hạn:** 200 MB

| Field | Type | Bắt buộc | Ghi chú |
|---|---|---|---|
| file | File (.zip) | ✓ | master.zip |
| gradingRound | string | — | Default: "Lần 1" |

**Cấu trúc master.zip:**
```
master.zip/
├── hoalvpse181951/      ← username (phải trùng với CSV đã import)
│   ├── 1/               ← artifactFolderName của Q1
│   │   └── solution.zip
│   └── 2/               ← artifactFolderName của Q2
│       └── solution.zip
└── nguyenvase182001/
    └── ...
```

**Response `data`:**
```json
{
  "parsed": 10,
  "created": 9,
  "missing": 1,
  "errors": ["hoatestuser: không tìm thấy participant"]
}
```

> Sinh viên nào không có trong CSV → lỗi. Sinh viên trong CSV nhưng không có folder trong zip → tự động tạo submission với `hasArtifact=false`, điểm = 0.

---

### [7] Trigger Chấm Bài

`POST /assignments/{id}/grade?gradingRound=Lần 1`

**Query Params:**
| Param | Type | Default | Ghi chú |
|---|---|---|---|
| gradingRound | string | "Lần 1" | Tên đợt chấm |

**Body:** không có

**Response `data`:** `int` — số grading job đã enqueue

> Sau khi enqueue, poll `GET /grading-jobs/{id}` cho đến khi `status` = `"Done"` hoặc `"Failed"`.

---

### [7b] Poll Grading Job

`GET /grading-jobs/{id}`

**Response `data`:**
```json
{
  "id": "uuid",
  "submissionId": "uuid",
  "status": "Pending | Running | Done | Failed",
  "errorMessage": null,
  "startedAt": "2026-04-17T...",
  "finishedAt": "2026-04-17T..."
}
```

---

### [8a] Xem Kết Quả Tổng Hợp (ExamSession)

`GET /exam-sessions/{id}/results?gradingRound=Lần 1`

**Query Params:**
| Param | Type | Default | Ghi chú |
|---|---|---|---|
| gradingRound | string? | — | Nếu không truyền, lấy tất cả round |

**Response `data`:** `SessionSubmissionResultDto[]`
```json
[
  {
    "submissionId": "uuid",
    "username": "hoalvpse181951",
    "studentCode": "pse181951",
    "assignmentCode": "101",
    "gradingRound": "Lần 1",
    "status": "Done",
    "hasArtifact": true,
    "totalScore": 8,
    "maxScore": 10,
    "questions": [
      {
        "questionId": "uuid",
        "questionTitle": "Câu 1: REST API",
        "score": 4,
        "finalScore": 4,
        "maxScore": 5,
        "adjustedScore": null,
        "adjustReason": null,
        "testCaseResults": [
          {
            "testCaseId": "uuid",
            "pass": true,
            "awardedScore": 1,
            "httpMethod": "GET",
            "url": "/api/students",
            "actualStatus": 200,
            "actualBody": "...",
            "failReason": null
          }
        ]
      }
    ],
    "notes": null
  }
]
```

> `finalScore` = `adjustedScore` nếu có chỉnh điểm, ngược lại = `score`.

---

### [8b] Xem Kết Quả Chi Tiết (Submission)

`GET /submissions/{id}/results`

**Response `data`:** tương tự mảng `questions` trong SessionSubmissionResultDto nhưng scoped theo submission.

---

### [9a] Chỉnh Điểm Thủ Công

`PUT /question-results/{id}/adjust`

**Body:**
```json
{
  "adjustedScore": 4,
  "adjustReason": "Thiếu XML format nhưng logic đúng",
  "adjustedBy": "gv@fpt.edu.vn"
}
```

| Field | Type | Bắt buộc | Ghi chú |
|---|---|---|---|
| adjustedScore | int | ✓ | ≥ 0 |
| adjustReason | string | ✓ | min 1, max 1000 chars |
| adjustedBy | string? | — | max 200 chars |

---

### [9b] Hủy Chỉnh Điểm

`DELETE /question-results/{id}/adjust`

---

### [9c] Ghi Chú Nhận Xét Submission

`PUT /submissions/{id}/notes`

**Body:**
```json
{
  "content": "Q1 đủ endpoints. Q2 filter và detail OK.",
  "reviewedBy": "gv@fpt.edu.vn"
}
```

---

### [10a] Export Per-Assignment

`POST /exports`

**Body:**
```json
{ "assignmentId": "uuid", "gradingRound": "Lần 1" }
```

> `gradingRound` có thể null để export tất cả round.

**Response `data`:** `ExportJobDto`
```json
{
  "id": "uuid",
  "assignmentId": "uuid",
  "assignmentCode": "101",
  "examSessionId": null,
  "examSessionTitle": null,
  "status": "Pending",
  "gradingRound": "Lần 1",
  "filePath": null,
  "errorMessage": null
}
```

---

### [10b] Export Tổng Session (Multi-sheet)

`POST /exam-sessions/{id}/exports`

**Body:**
```json
{ "gradingRound": "Lần 1" }
```

> Kết quả: 1 file Excel, mỗi mã đề 1 sheet.

**Response `data`:** `ExportJobDto` với `examSessionId` được set, `assignmentId` = null.

---

### [10c] Poll & Download Export

```
GET /exports/{id}          → kiểm tra status
GET /exports/{id}/download → tải file khi status = "Done"
```

**ExportStatus enum:** `"Pending"` | `"Running"` | `"Done"` | `"Failed"`

---

## 3. Response Wrapper

Mọi response đều wrap trong:
```json
{
  "status": true,
  "message": "Assignment created.",
  "data": { ... },
  "errors": [],
  "traceId": "uuid"
}
```

---

## 4. Enums

| Enum | Values |
|---|---|
| QuestionType | `0` = Api, `1` = Razor |
| SubmissionStatus | `"Pending"` \| `"Grading"` \| `"Done"` \| `"Failed"` |
| JobStatus | `"Pending"` \| `"Running"` \| `"Done"` \| `"Failed"` |
| ExportStatus | `"Pending"` \| `"Running"` \| `"Done"` \| `"Failed"` |

> Enum trả về dạng **string** (không phải số).

---

## 5. FE Notes

### Thứ tự call bắt buộc
1. Tạo ExamSession trước → lấy `examSessionId`
2. Tạo Assignment với `examSessionId` → lấy `assignmentId`
3. Upload resources trước khi grade
4. Import CSV participants **trước** bulk-upload (không match username → skip + lỗi)
5. Tạo Questions → lấy `q1Id`, `q2Id`
6. Tạo test cases cho từng `questionId`
7. Bulk upload → trigger grade → poll jobs

### Participant matching
- `username` trong CSV phải **khớp chính xác** với tên folder trong master.zip (case-insensitive)
- `username` thường có dạng `{tênviết liền}{mã sv}`, e.g. `hoalvpse181951`
- Sinh viên thiếu bài sẽ tự động có điểm 0, không cần xử lý thêm

### Export flow
- Luôn poll `GET /exports/{id}` sau khi tạo export
- Download chỉ thành công khi `status = "Done"`
- Session export → multi-sheet, assignment export → single-sheet

### Code uniqueness
- Mã đề (`code`) chỉ unique **trong cùng 1 exam-session**
- 2 exam-session khác nhau có thể dùng code "101"
- Không có endpoint `GET /assignments/by-code` nữa — dùng GUID

### Điểm tính
- `score` = điểm tự động từ test cases
- `adjustedScore` = điểm đã chỉnh (overrides `score`)
- `finalScore` = `adjustedScore ?? score`
- `totalScore` = sum `finalScore` các câu

### Artifact cleanup
- File bài làm bị xóa tự động ngay sau khi chấm xong
- `submission.artifactZipPath` có thể là `""` sau khi chấm — đây là bình thường
