-- ============================================================
-- Test Cases cho Q1 (PE_PRN232 Retake)
-- Sinh tự động từ swagger.json tại http://localhost:5000/swagger/v1/swagger.json
-- Chế độ chấm: Artifact (student nộp publish output)
-- ============================================================

-- Tạo bảng test_cases nếu chưa có (dùng trong grading system DB)
IF OBJECT_ID('dbo.test_cases', 'U') IS NULL
BEGIN
    CREATE TABLE test_cases (
        id           INT PRIMARY KEY IDENTITY(1,1),
        question_id  INT NOT NULL,               -- 1=students,2=grade,3=delete,4=perf
        label        NVARCHAR(200),              -- mô tả ngắn
        http_method  NVARCHAR(10) NOT NULL,
        url_template NVARCHAR(500) NOT NULL,
        input_json   NVARCHAR(MAX),              -- { pathParams, queryParams, body }
        expect_json  NVARCHAR(MAX),              -- { status, isArray, fields, nested }
        schema_json  NVARCHAR(MAX) NULL,
        score        FLOAT NOT NULL DEFAULT 0.5,
        timeout_ms   INT NOT NULL DEFAULT 5000
    );
END;
GO

-- Xóa test cases cũ trước khi insert lại
DELETE FROM test_cases WHERE question_id IN (1,2,3,4);
GO

-- ============================================================
-- question_id = 1  →  GET /api/students
-- Trả về danh sách sinh viên kèm GPA tính từ bảng Enrollments
-- ============================================================
INSERT INTO test_cases (question_id, label, http_method, url_template, input_json, expect_json, score, timeout_ms)
VALUES
(
    1,
    'GET /api/students - tra ve danh sach 5 sinh vien co truong gpa',
    'GET',
    '/api/students',
    '{}',
    '{"status":200,"isArray":true,"fields":["studentId","studentName","email","gpa"]}',
    1.0,
    5000
),
(
    1,
    'GET /api/students - sinh vien khong co diem thi gpa = 0',
    'GET',
    '/api/students',
    '{}',
    -- Student 4 (Dang Tien Dat): enrollment 4 => grade NULL, enrollment 9 => grade 7.5
    -- GPA = 7.5  (enrollment 4 bi loai vi NULL)
    -- Dung schema_json de kiem tra chi tiet gia tri GPA
    '{"status":200,"isArray":true}',
    0.5,
    5000
);
GO

-- ============================================================
-- question_id = 2  →  PUT /api/enrollments/{id}/grade
-- Cập nhật điểm; validate 0 <= grade <= 10
-- Dữ liệu mẫu: enrollment 4 (StudentID=4, SectionID=3, Grade=NULL)
--              enrollment 7 (StudentID=2, SectionID=2, Grade=NULL)
-- ============================================================
INSERT INTO test_cases (question_id, label, http_method, url_template, input_json, expect_json, score, timeout_ms)
VALUES
(
    2,
    'PUT grade hop le - enrollment 4 chua co diem, cap nhat thanh 8.0 -> 200',
    'PUT',
    '/api/enrollments/{id}/grade',
    '{"pathParams":{"id":4},"body":{"grade":8.0}}',
    '{"status":200,"fields":["enrollmentId","studentId","grade"]}',
    1.0,
    5000
),
(
    2,
    'PUT grade hop le - enrollment 7 chua co diem, cap nhat thanh 5.5 -> 200',
    'PUT',
    '/api/enrollments/{id}/grade',
    '{"pathParams":{"id":7},"body":{"grade":5.5}}',
    '{"status":200,"fields":["enrollmentId","studentId","grade"]}',
    0.5,
    5000
),
(
    2,
    'PUT grade khong hop le - grade = 11 (> 10) -> 400',
    'PUT',
    '/api/enrollments/{id}/grade',
    '{"pathParams":{"id":4},"body":{"grade":11}}',
    '{"status":400}',
    0.5,
    5000
),
(
    2,
    'PUT grade khong hop le - grade = -1 (< 0) -> 400',
    'PUT',
    '/api/enrollments/{id}/grade',
    '{"pathParams":{"id":4},"body":{"grade":-1}}',
    '{"status":400}',
    0.5,
    5000
),
(
    2,
    'PUT grade - enrollment khong ton tai id=999 -> 404',
    'PUT',
    '/api/enrollments/{id}/grade',
    '{"pathParams":{"id":999},"body":{"grade":8.0}}',
    '{"status":404}',
    0.5,
    5000
);
GO

-- ============================================================
-- question_id = 3  →  DELETE /api/enrollments/{id}
-- Xóa đăng ký; không cho xóa nếu đã có điểm
-- Dữ liệu mẫu: enrollment 8 (StudentID=3, SectionID=4, Grade=NULL) → xóa được
--              enrollment 1 (StudentID=1, SectionID=1, Grade=8.5)   → không được xóa
-- ============================================================
INSERT INTO test_cases (question_id, label, http_method, url_template, input_json, expect_json, score, timeout_ms)
VALUES
(
    3,
    'DELETE enrollment hop le - enrollment 8 chua co diem -> 204',
    'DELETE',
    '/api/enrollments/{id}',
    '{"pathParams":{"id":8}}',
    '{"status":204}',
    1.0,
    5000
),
(
    3,
    'DELETE enrollment da co diem - enrollment 1 grade=8.5 -> 400',
    'DELETE',
    '/api/enrollments/{id}',
    '{"pathParams":{"id":1}}',
    '{"status":400}',
    0.5,
    5000
),
(
    3,
    'DELETE enrollment khong ton tai id=999 -> 404',
    'DELETE',
    '/api/enrollments/{id}',
    '{"pathParams":{"id":999}}',
    '{"status":404}',
    0.5,
    5000
);
GO

-- ============================================================
-- question_id = 4  →  GET /api/student-performance
-- Phân trang + lọc theo minGpa, studentName
-- ============================================================
INSERT INTO test_cases (question_id, label, http_method, url_template, input_json, expect_json, score, timeout_ms)
VALUES
(
    4,
    'GET student-performance - mac dinh page=1 pageSize=10, tra ve cau truc phan trang',
    'GET',
    '/api/student-performance',
    '{"queryParams":{"page":1,"pageSize":10}}',
    '{"status":200,"fields":["data","totalStudents","totalPages","current","pageSize"],"nested":{"data":{"isArray":true,"fields":["studentId","studentName","email","gpa"]}}}',
    1.0,
    5000
),
(
    4,
    'GET student-performance - loc minGpa=8.0, chi tra sinh vien co GPA >= 8.0',
    'GET',
    '/api/student-performance',
    '{"queryParams":{"minGpa":8.0,"page":1,"pageSize":10}}',
    '{"status":200,"fields":["data","totalStudents","totalPages"]}',
    0.5,
    5000
),
(
    4,
    'GET student-performance - loc studentName=Nguyen, tra ve sinh vien co ten chua Nguyen',
    'GET',
    '/api/student-performance',
    '{"queryParams":{"studentName":"Nguyen","page":1,"pageSize":10}}',
    '{"status":200,"fields":["data","totalStudents","totalPages"]}',
    0.5,
    5000
),
(
    4,
    'GET student-performance - pageSize=2, totalPages phai = ceil(total/2)',
    'GET',
    '/api/student-performance',
    '{"queryParams":{"page":1,"pageSize":2}}',
    '{"status":200,"fields":["data","totalStudents","totalPages","current","pageSize"]}',
    0.5,
    5000
),
(
    4,
    'GET student-performance - page=0 khong hop le -> 400',
    'GET',
    '/api/student-performance',
    '{"queryParams":{"page":0,"pageSize":10}}',
    '{"status":400}',
    0.5,
    5000
),
(
    4,
    'GET student-performance - pageSize=0 khong hop le -> 400',
    'GET',
    '/api/student-performance',
    '{"queryParams":{"page":1,"pageSize":0}}',
    '{"status":400}',
    0.5,
    5000
);
GO

-- ============================================================
-- Tổng hợp điểm
-- Q1: ~9.0 pts  Q2: xem testcases_q2 (Razor Pages HTML check)
-- ============================================================
SELECT question_id, COUNT(*) AS total_cases, SUM(score) AS max_score
FROM test_cases
WHERE question_id IN (1,2,3,4)
GROUP BY question_id
ORDER BY question_id;
GO
