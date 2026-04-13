#nullable disable
namespace Q1.Models;

public partial class Course
{
    public int CourseId { get; set; }

    public string CourseName { get; set; }

    public int? Credits { get; set; }

    public string Department { get; set; }

    public virtual ICollection<ClassSection> ClassSections { get; set; } = new List<ClassSection>();

    public virtual ICollection<CourseAssignment> CourseAssignments { get; set; } = new List<CourseAssignment>();
}