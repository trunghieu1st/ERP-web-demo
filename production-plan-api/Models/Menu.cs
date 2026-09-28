namespace production_plan_api.Models;

public class Menu
{
    public long MenuId { get; set; }

    public long? ParentMenuId { get; set; }

    public int MenuLevel { get; set; }

    public string MenuCode { get; set; } = "";

    public string MenuName { get; set; } = "";

    public string? Path { get; set; }

    public long? DepartmentId { get; set; }

    public string InterfaceType { get; set; } = "WEB";

    public string? Icon { get; set; }

    public int SortOrder { get; set; }

    public bool IsClickable { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreationDate { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime LastUpdateDate { get; set; }

    public long? LastUpdateBy { get; set; }
}
