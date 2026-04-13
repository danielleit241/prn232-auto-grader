using Microsoft.AspNetCore.Mvc;
using Q1.Dtos;
using Q1.Models;

namespace Q1.Controllers
{
    [Route("api/student-performance")]
    [ApiController]
    [Produces("application/json", "application/xml")]
    public class StudentPerController : ControllerBase
    {
        private readonly PE_PRN_26SP_11Context _ctx;
        public StudentPerController(PE_PRN_26SP_11Context ctx)
        {
            _ctx = ctx;
        }

        [HttpGet]
        public IActionResult Get(
            [FromQuery] double? minGpa,
            [FromQuery] string? studentName,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
            )
        {
            if (page <= 0 || pageSize <= 0)
            {
                return BadRequest("Invalid pagination parameters.");
            }

            var query = _ctx.Students.Select(s => new StudentDto
            {
                StudentId = s.StudentId,
                StudentName = s.StudentName,
                Email = s.Email,
                Gpa = s.Enrollments
                    .Where(e => e.Grade.HasValue)
                    .Select(e => e.Grade!.Value)
                    .DefaultIfEmpty()
                    .Average()
            }).AsQueryable();

            if (minGpa.HasValue)
            {
                query = query.Where(s => s.Gpa != null && s.Gpa >= minGpa.Value);
            }

            if (!string.IsNullOrEmpty(studentName))
            {
                query = query.Where(e => e.StudentName.ToLower().Contains(studentName.ToLower()));
            }

            var totalStudent = query.Count();
            var totalPages = (int)Math.Ceiling(totalStudent / (double)pageSize);

            var data = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            var result = new
            {
                Data = data,
                TotalStudents = totalStudent,
                TotalPages = totalPages,
                Current = page,
                PageSize = pageSize
            };

            return Ok(result);
        }
    }
}
