using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Text.Json;

namespace Q2.Pages.Instructors
{
    public class ListModel : PageModel
    {
        private readonly HttpClient _client;
        private readonly JsonSerializerOptions _jsonOptions;
        public ListModel(HttpClient client)
        {
            _client = client;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
            };
        }

        public List<Instructor> Instructors { get; set; }
        public string Name { get; set; }
        public string Expertise { get; set; }

        public async Task OnGet(string name, string expertise)
        {
            Name = name ?? string.Empty;
            Expertise = expertise ?? string.Empty;
            try
            {
                var request = "/api/Instructors/search?name=" + Uri.EscapeDataString(name ?? string.Empty) + "&expertise=" + Uri.UnescapeDataString(expertise ?? string.Empty);
                var response = await _client.GetAsync(Utilities.GetAbsoluteUrl(request));

                if (!response.IsSuccessStatusCode)
                {
                    Instructors = new();
                    return;
                }

                var json = await response.Content.ReadAsStringAsync();
                Instructors = JsonSerializer.Deserialize<List<Instructor>>(json, _jsonOptions) as List<Instructor> ?? new();
            }
            catch (Exception)
            {

                throw;
            }
        }


    }
    public class Instructor
    {
        public int InstructorId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Expertise { get; set; } = string.Empty;
        public DateTime HireDate { get; set; }
        public int TotalCourses { get; set; }
    }
}
