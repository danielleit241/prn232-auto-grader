namespace GradingSystem.Application.Common;

public class ApiResponse<T>
{
    public bool Status { get; init; }
    public string Message { get; init; } = string.Empty;
    public T? Data { get; init; }
    public IEnumerable<string>? Errors { get; init; }

    public static ApiResponse<T> Success(T data, string message = "Success") => new()
    {
        Status = true,
        Message = message,
        Data = data
    };

    public static ApiResponse<T> Fail(string message, IEnumerable<string>? errors = null) => new()
    {
        Status = false,
        Message = message,
        Errors = errors
    };
}

public static class ApiResponse
{
    public static ApiResponse<T> Success<T>(T data, string message = "Success")
        => ApiResponse<T>.Success(data, message);

    public static ApiResponse<object> Fail(string message, IEnumerable<string>? errors = null)
        => ApiResponse<object>.Fail(message, errors);
}
