# Grading System — Plan

## Kiến trúc

```
Docker Compose
  ├── api       (.NET Web API)      → PostgreSQL
  ├── worker    (.NET Worker)       → PostgreSQL + SQL Server
  ├── postgres  (system DB)
  └── sqlserver (student DB, Q1 only)
```

**Storage volume** (dùng chung api + worker): `/storage/`
- `assignments/{id}/database.sql`
- `assignments/{id}/given-api.zip`
- `submissions/{id}/artifact.zip`
- `exports/{file}.xlsx`

---

## Database (PostgreSQL)

| Bảng            | Mô tả                              |
| --------------- | ---------------------------------- |
| assignments     | Đề thi                             |
| questions       | Câu hỏi (Q1=api, Q2=razor)         |
| test_cases      | Input + expect mỗi câu             |
| submissions     | Bài nộp ZIP của sinh viên          |
| grading_jobs    | Job chấm (pending → running → done)|
| question_results| Kết quả từng câu                   |
| review_notes    | Ghi chú giáo viên                  |
| export_jobs     | Job export Excel                   |

---

## API Endpoints

```
# Assignment setup
POST /assignments
POST /assignments/{id}/sql          ← upload database.sql (Q1)
POST /assignments/{id}/given-api    ← upload givenAPI ZIP (Q2)
POST /assignments/{id}/questions
POST /questions/{id}/test-cases

# Grading
POST /submissions/upload            ← upload artifact ZIP
POST /submissions/{id}/grade        ← trigger job
GET  /grading-jobs/{id}
GET  /submissions/{id}/results

# Review & Export
PUT  /submissions/{id}/notes
POST /exports
GET  /exports/{id}/download
```

Response envelope: `{ status, message, data, errors, traceId }`

---

## Artifact Flow (Worker)

```
1. Đọc job → load submission + assignment từ DB

[Q1] Reset SQL Server:
     DROP/CREATE DATABASE grading_{id}
     Chạy database.sql

[Q2] Start givenAPI:
     Unzip given-api.zip → sandbox/given-api/
     dotnet givenAPI.dll --urls http://localhost:<PORT>
     Health-check 15s

2. Start student artifact:
   Unzip artifact.zip → sandbox/student/
   dotnet App.dll --urls http://localhost:<PORT>
   Env Q1: ConnectionStrings__MyCnn = "Server=sqlserver;Database=grading_{id};..."
   Env Q2: GivenAPIBaseUrl = "http://localhost:<GIVEN_PORT>"
   Health-check 15s

3. Run test cases:
   Mỗi TC: gửi HTTP → so sánh response với expect_json → ghi QuestionResult

4. Cleanup:
   Kill processes, xóa sandbox, [Q1] DROP DATABASE
   UPDATE grading_jobs SET status = 'done'
```

---

## Test Cases

**Q1 (Web API)** — sinh từ Swagger JSON:
```
GET /swagger/v1/swagger.json → parse → INSERT test_cases
```
Schema: `http_method, url_template, input_json, expect_json, score`

`expect_json` ví dụ: `{"status":200,"isArray":true,"fields":["id","name"]}`

**Q2 (Razor Pages)** — check HTML element IDs:
```
HTTP GET page → parse HTML → assert #elementId = expected value
```

---

## Lưu ý

- Submission cùng assignment chấm **tuần tự** → tránh race condition SQL Server
- Worker dùng Docker image **sdk:8.0** (không phải aspnet) → cần `dotnet` CLI để chạy artifact
- givenAPI chạy trên port ngẫu nhiên 7000–7999, kill ngay sau khi chấm xong
