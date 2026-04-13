#nullable disable
namespace Q1.Models;

public partial class ClassSection
{
    public int SectionId { get; set; }

    public int? CourseId { get; set; }

    public string RoomNumber { get; set; }

    public string Semester { get; set; }

    public int? MaxCapacity { get; set; }

    public virtual Course Course { get; set; }

    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}