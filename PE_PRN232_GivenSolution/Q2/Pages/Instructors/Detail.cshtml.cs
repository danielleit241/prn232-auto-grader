using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Text.Json;

namespace Q2.Pages.Instructors
{
    public class DetailModel : PageModel
    {
        private readonly HttpClient _client;
        private readonly JsonSerializerOptions _jsonOptions;
        public DetailModel(HttpClient client)
        {
            _client = client;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
            };
        }

        public InstructorDetail Instructor { get; set; }
        public async Task OnGet(int id)
        {
            try
            {
                var request = $"/api/Instructors/{id}";
                var response = await _client.GetAsync(Utilities.GetAbsoluteUrl(request));

                if (!response.IsSuccessStatusCode)
                {
                    Instructor = new();
                    return;
                }

                var json = await response.Content.ReadAsStringAsync();
                Instructor = JsonSerializer.Deserialize<InstructorDetail>(json, _jsonOptions) as InstructorDetail ?? new();
            }
            catch (Exception)
            {

                throw;
            }
        }

        public class InstructorDetail
        {
            public int InstructorId { get; set; }
            public string FullName { get; set; } = string.Empty;
            public string Expertise { get; set; } = string.Empty;
            public DateTime HireDate { get; set; }
            public List<Course> Courses { get; set; } = new List<Course>();
        }

        public class Course
        {
            public int CourseId { get; set; }
            public string CourseName { get; set; } = string.Empty;
            public int Credits { get; set; }
        }
    }
}
