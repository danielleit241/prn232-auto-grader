using Microsoft.AspNetCore.Mvc;
using Q1.Dtos;
using Q1.Models;

namespace Q1.Controllers
{
    [Route("api/students")]
    [ApiController]
    [Produces("application/json", "application/xml")]
    public class StudentsController : ControllerBase
    {
        private readonly PE_PRN_26SP_11Context _ctx;
        public StudentsController(PE_PRN_26SP_11Context ctx)
        {
            _ctx = ctx;
        }

        [HttpGet]
        public async Task<IActionResult> GetStudents()
        {
            var students = _ctx.Students.Select(s => new StudentDto
            {
                StudentId = s.StudentId,
                StudentName = s.StudentName,
                Email = s.Email,
                Gpa = s.Enrollments
                    .Where(e => e.Grade.HasValue)
                    .Select(e => e.Grade!.Value)
                    .DefaultIfEmpty()
                    .Average()
            }).ToList();

            return Ok(students);
        }
    }
}
