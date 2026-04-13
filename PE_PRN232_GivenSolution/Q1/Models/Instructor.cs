#nullable disable
namespace Q1.Models;

public partial class Instructor
{
    public int InstructorId { get; set; }

    public string FullName { get; set; }

    public string Expertise { get; set; }

    public DateOnly? HireDate { get; set; }

    public virtual ICollection<CourseAssignment> CourseAssignments { get; set; } = new List<CourseAssignment>();
}