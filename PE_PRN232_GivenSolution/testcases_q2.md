# Test Cases cho Q2 — Razor Pages (Instructor)

> Chế độ chấm: **Artifact** — student nộp thư mục publish output của Q2.  
> Grader khởi động artifact, giữ nguyên `GivenAPIBaseUrl=http://localhost:5100` (givenAPI đang chạy).  
> Sau đó gửi HTTP GET đến Razor Pages và kiểm tra HTML bằng ID selector.

---

## Dữ liệu tham chiếu (từ givenAPI in-memory)

| InstructorId | FullName             | Expertise            | HireDate   | TotalCourses | Courses (id:name:credits)          |
|:---:|---|---|---|:---:|---|
| 1 | TS. Tran Van Nam     | Cong nghe phan mem   | 2015-05-10 | 2 | 1:Co so du lieu:3, 4:Hoc may:4     |
| 2 | ThS. Le Thi Binh     | He thong thong tin   | 2018-02-15 | 2 | 1:Co so du lieu:3, 2:Lap trinh Web:4 |
| 3 | GS. Nguyen Quoc Cuong| Tri tue nhan tao     | 2010-11-20 | 2 | 3:Toan roi rac:3, 4:Hoc may:4      |
| 4 | TS. Pham Minh Tuan   | Mang may tinh        | 2020-01-05 | 2 | 2:Lap trinh Web:4, 5:Mang may tinh co ban:3 |
| 5 | ThS. Do Hong Hanh    | An toan thong tin    | 2021-09-12 | 2 | 3:Toan roi rac:3, 5:Mang may tinh co ban:3 |

---

## TC-Q2-01: List page — không lọc

**Request:** `GET /Instructor`  
**Score:** 1.0

Kiểm tra HTML output:

| Selector                   | Expected value              |
|----------------------------|-----------------------------|
| `#td_fullName_1`           | `TS. Tran Van Nam`          |
| `#td_expertise_1`          | `Cong nghe phan mem`        |
| `#td_hireDate_1`           | `2015-05-10`                |
| `#td_totalCourses_1`       | `2`                         |
| `#a_1` href                | `/Instructor/1`             |
| `#td_fullName_3`           | `GS. Nguyen Quoc Cuong`     |
| `#td_totalCourses_3`       | `2`                         |
| row count (`<tr>` in tbody)| `5`                         |

---

## TC-Q2-02: List page — lọc theo Name

**Request:** `GET /Instructor?name=Tran`  
**Score:** 0.5

Chỉ instructor có `FullName` chứa "Tran" (case-insensitive) được hiển thị.

| Selector           | Expected value     |
|--------------------|--------------------|
| `#td_fullName_1`   | `TS. Tran Van Nam` |
| row count          | `1`                |

---

## TC-Q2-03: List page — lọc theo Expertise

**Request:** `GET /Instructor?expertise=Cong nghe`  
**Score:** 0.5

| Selector           | Expected value       |
|--------------------|----------------------|
| `#td_fullName_1`   | `TS. Tran Van Nam`   |
| `#td_expertise_1`  | `Cong nghe phan mem` |
| row count          | `1`                  |

---

## TC-Q2-04: Detail page — instructor tồn tại

**Request:** `GET /Instructor/1`  
**Score:** 1.0

| Selector                  | Expected value        |
|---------------------------|-----------------------|
| `#span_1`                 | `1`                   |
| `#span_TS. Tran Van Nam`  | `TS. Tran Van Nam`    |
| `#span_expertise`         | `Cong nghe phan mem`  |
| `#td_courseID_1`          | `1`                   |
| `#td_courseName_1`        | `Co so du lieu`       |
| `#td_credits_1`           | `3`                   |
| `#td_courseID_4`          | `4`                   |
| `#td_courseName_4`        | `Hoc may`             |
| `#td_credits_4`           | `4`                   |
| course row count          | `2`                   |

---

## TC-Q2-05: Detail page — instructor khác (id=3)

**Request:** `GET /Instructor/3`  
**Score:** 0.5

| Selector                       | Expected value           |
|-------------------------------|--------------------------|
| `#span_3`                     | `3`                      |
| `#span_GS. Nguyen Quoc Cuong` | `GS. Nguyen Quoc Cuong`  |
| `#span_expertise`             | `Tri tue nhan tao`       |
| `#td_courseID_3`              | `3`                      |
| `#td_courseName_3`            | `Toan roi rac`           |
| `#td_courseID_4`              | `4`                      |
| `#td_courseName_4`            | `Hoc may`                |
| course row count              | `2`                      |

---

## Cách chạy test (grader)

```
1. Đảm bảo givenAPI đang chạy tại http://localhost:5100
2. Publish artifact Q2 của student → chạy: dotnet Q2.dll --urls http://localhost:5190
3. Với mỗi TC trên: HttpClient.GetAsync(url) → parse HTML → assert theo bảng
4. Tính điểm: cộng score của TC pass
```

### Ví dụ assert bằng HtmlAgilityPack

```csharp
var html = await httpClient.GetStringAsync("http://localhost:5190/Instructor");
var doc = new HtmlDocument();
doc.LoadHtml(html);

var fullName1 = doc.GetElementbyId("td_fullName_1")?.InnerText?.Trim();
Assert.Equal("TS. Tran Van Nam", fullName1);

var rows = doc.DocumentNode.SelectNodes("//tbody/tr");
Assert.Equal(5, rows?.Count);
```
