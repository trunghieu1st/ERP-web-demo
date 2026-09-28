namespace production_plan_api.Models;

public class User
{
    public long UserId { get; set; }

    public string Username { get; set; } = "";

    public string PasswordHash { get; set; } = "";

    public string FullName { get; set; } = "";

    public long? FactoryId { get; set; }

    public long? DepartmentId { get; set; }

    public string? RoleCode { get; set; }

    public bool IsActive { get; set; }
}