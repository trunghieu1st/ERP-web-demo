using System.Security.Claims;

namespace production_plan_api.Services;

public class CurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(
        IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User =>
        _httpContextAccessor.HttpContext?.User;

    public long? UserId
    {
        get
        {
            var value =
                User?.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            return long.TryParse(
                value,
                out var id)
                ? id
                : null;
        }
    }

    public long? FactoryId
    {
        get
        {
            var value =
                User?.FindFirstValue("factoryId");

            return long.TryParse(
                value,
                out var id)
                ? id
                : null;
        }
    }

    public long? DepartmentId
    {
        get
        {
            var value =
                User?.FindFirstValue("departmentId");

            return long.TryParse(
                value,
                out var id)
                ? id
                : null;
        }
    }

    public string? Role =>
        User?.FindFirstValue(
            ClaimTypes.Role);

    public bool IsAuthenticated =>
        User?.Identity?.IsAuthenticated == true;
}