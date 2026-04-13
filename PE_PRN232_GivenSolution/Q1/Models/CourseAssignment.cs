#nullable disable
namespace Q1.Models;

public partial class CourseAssignment
{
    public int CourseId { get; set; }

    public int InstructorId { get; set; }

    public DateOnly? AssignmentDate { get; set; }

    public virtual Course Course { get; set; }

    public virtual Instructor Instructor { get; set; }
}