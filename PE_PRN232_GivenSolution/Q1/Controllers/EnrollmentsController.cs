using Microsoft.AspNetCore.Mvc;
using Q1.Dtos;
using Q1.Models;

namespace Q1.Controllers
{
    [Route("api/enrollments")]
    [ApiController]
    [Produces("application/json", "application/xml")]
    public class EnrollmentsController : ControllerBase
    {
        private readonly PE_PRN_26SP_11Context _ctx;
        public EnrollmentsController(PE_PRN_26SP_11Context ctx)
        {
            _ctx = ctx;
        }

        [HttpPut("{id}/grade")]
        public ActionResult UpdateGrade(int id, [FromBody] UpdateGradeRequest request)
        {
            if (request.Grade < 0 || request.Grade > 10)
            {
                return BadRequest("Grade must be between 0 and 10");
            }

            var enrollment = _ctx.Enrollments.FirstOrDefault(e => e.EnrollmentId == id);

            if (enrollment == null)
            {
                return NotFound();
            }

            enrollment.Grade = request.Grade;

            _ctx.Enrollments.Update(enrollment);
            _ctx.SaveChanges();

            var result = new
            {
                EnrollmentId = id,
                StudentId = enrollment.StudentId,
                Grade = request.Grade
            };

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var enrollment = _ctx.Enrollments.FirstOrDefault(e => e.EnrollmentId == id);

            if (enrollment == null)
            {
                return NotFound("No enrollment found with provided EnrollmentId");
            }

            if (enrollment.Grade.HasValue)
            {
                return BadRequest("Cannot cancel an enrollment that has already been graded.");
            }

            _ctx.Enrollments.Remove(enrollment);
            _ctx.SaveChanges();

            return NoContent();
        }
    }
}
