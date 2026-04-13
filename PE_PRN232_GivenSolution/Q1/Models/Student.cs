#nullable disable
namespace Q1.Models;

public partial class Student
{
    public int StudentId { get; set; }

    public string StudentName { get; set; }

    public string Email { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}