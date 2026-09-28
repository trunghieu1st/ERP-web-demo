namespace production_plan_api.Models;

public class Department
{
    public long DepartmentId { get; set; }

    public string DepartmentCode { get; set; } = "";

    public string DepartmentName { get; set; } = "";

    public string InterfaceType { get; set; } = "WEB";

    public bool IsActive { get; set; }
}