# Project Plan — Hệ thống chấm bài tự động

## Entities

| Entity          | Mô tả                                               |
| --------------- | --------------------------------------------------- |
| Assignment      | Đề thi, gắn với 1 SQL script                        |
| Question        | Câu hỏi trong đề                                    |
| TestCase        | Test case của câu, chứa input + expect              |
| Submission      | Bài nộp ZIP của sinh viên                           |
| SqlScriptUpload | File SQL của đề (1 đề = 1 file)                     |
| GradingJob      | Job chấm bài chạy nền                               |
| QuestionResult  | Kết quả từng câu của 1 submission                   |
| ReviewNote      | Ghi chú của giáo viên theo format `Q1: ... Q2: ...` |
| ExportJob       | Job export Excel                                    |

---

## API Contract

**Response envelope chung:**

```json
{ "status": "", "message": "", "data": {}, "errors": [], "traceId": "" }
```

**Endpoints:**

- CRUD Assignment / Question / TestCase
- `POST /submissions/upload` — upload ZIP bài nộp
- `POST /assignments/{id}/sql` — upload SQL script (1 lần / đề)
- `POST /submissions/{id}/grade` — trigger grading job
- `GET  /grading-jobs/{id}` — xem trạng thái job
- `GET  /submissions/{id}/results` — kết quả từng câu
- `PUT  /submissions/{id}/notes` — lưu review notes
- `GET  /submissions/{id}/notes` — lấy review notes
- `POST /exports` — trigger export Excel
- `GET  /exports/{id}/download` — tải file

---

## Ngày 2 — Nền service và database

- [ ] .NET Web API: Swagger, validation, CORS
- [ ] .NET Worker Service: xử lý queue nền
- [ ] PostgreSQL schema cho tất cả bảng
- [ ] Queue DB-backed: bảng `jobs` + polling worker
- [ ] Local file storage (zip / sql / export); abstraction để nâng cấp cloud sau

---

## Ngày 3 — Ingestion

- [ ] Upload ZIP: validate, unzip an toàn, detect mode `source` / `artifact`
- [ ] Upload SQL: lưu file, gắn vào Assignment
- [ ] API xem metadata file đã upload

### SQL Isolation per Submission

Mỗi Assignment có 1 SQL script. Trước khi chấm mỗi submission, reset schema sạch:

```
1. DROP SCHEMA grading_<assignment_id> CASCADE
2. CREATE SCHEMA grading_<assignment_id>
3. Re-run SQL script của assignment
4. Chạy test cases → state độc lập với submission khác
```

- Submission app nhận connection string động trỏ vào schema này (không hardcode)
- Các submission trong cùng assignment chấm **tuần tự** để tránh race condition
- Muốn song song sau: dùng schema `grading_<assignment_id>_<submission_id>`, drop sau khi xong
- SQL execution: cho phép DDL + DML, có timeout và audit log

---

## Ngày 4-5 — Engine chấm

- [ ] Source flow: `restore` → `build` → `run` → test runner
- [ ] Artifact flow: `publish` → test runner
- [ ] Test runner: ghi pass/fail, output, thời gian, lỗi cho từng test case
- [ ] Scoring engine: tính điểm từng câu và tổng theo barem
- [ ] Lưu QuestionResult để FE query realtime

### Thiết kế TestCase (generic)

Test runner chỉ làm 3 việc: **gọi HTTP → check status → validate response**.  
Không biết gì về domain. Đề mới chỉ cần insert vào bảng `test_cases`.

**Bảng `test_cases`:**

```
id, question_id,
http_method,     -- GET / POST / PUT / DELETE
url_template,    -- /api/students/{id}/grade
input_json,      -- { pathParams, queryParams, body }
expect_json,     -- format đơn giản (90% trường hợp)
schema_json,     -- JSON Schema override khi expect không đủ
score,
timeout_ms
```

**Format `expect_json`:**

```json
{ "status": 200, "isArray": true, "fields": ["id", "name", "gpa"] }
```

Các pattern phổ biến:

| Case                  | expect_json                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| GET list              | `{ "status": 200, "isArray": true, "fields": [...] }`                                                                |
| GET list + pagination | `{ "status": 200, "fields": ["data","totalPages",...], "nested": { "data": { "isArray": true, "fields": [...] } } }` |
| POST / PUT hợp lệ     | `{ "status": 200, "fields": [...] }`                                                                                 |
| POST / PUT invalid    | `{ "status": 400 }`                                                                                                  |
| DELETE ok             | `{ "status": 204 }`                                                                                                  |
| Not found             | `{ "status": 404 }`                                                                                                  |

Chỉ dùng `schema_json` khi cần kiểm tra constraint phức tạp: range, format, const value.

---

## Ngày 5-6 — Notes và Export

- [ ] API notes: lưu/đọc format `Q1: ... Q2: ...`, parse + validate mã câu
- [ ] Worker export Excel: file tổng + file theo assignment
- [ ] API danh sách file export và download URL

---

## Ngày 6-7 — FE Integration và nghiệm thu

- [ ] Ổn định API contract và mã lỗi
- [ ] Seed dữ liệu mẫu cho demo
- [ ] Tài liệu API ngắn: endpoint, payload mẫu, flow FE
- [ ] Smoke test full flow: tạo đề → upload zip → upload sql → chấm → notes → export

---

## Lưu ý thực thi

|                     |                                                            |
| ------------------- | ---------------------------------------------------------- |
| Làm song song được  | API service + thiết kế schema DB                           |
| Làm song song được  | Lưu kết quả + API notes (sau khi có model kết quả)         |
| Bắt buộc tuần tự    | Ingestion → Grading → Export                               |
| Giới hạn kích thước | ZIP và SQL phải có max size ngay từ đầu                    |
| Retention           | Định nghĩa TTL cho artifact / log / export tránh đầy ổ đĩa |
