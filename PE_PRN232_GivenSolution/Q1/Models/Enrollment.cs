#nullable disable
namespace Q1.Models;

public partial class Enrollment
{
    public int EnrollmentId { get; set; }

    public int? StudentId { get; set; }

    public int? SectionId { get; set; }

    public DateOnly? RegistrationDate { get; set; }

    public double? Grade { get; set; }

    public virtual ClassSection Section { get; set; }

    public virtual Student Student { get; set; }
}