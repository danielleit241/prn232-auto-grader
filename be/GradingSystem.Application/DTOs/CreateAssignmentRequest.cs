using System.ComponentModel.DataAnnotations;

namespace GradingSystem.Application.DTOs;

public class CreateAssignmentRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }
}
