namespace production_plan_api.Models;

public class Role
{
    public long RoleId { get; set; }

    public string RoleCode { get; set; } = "";

    public string RoleName { get; set; } = "";

    public bool IsActive { get; set; }
}