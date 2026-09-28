namespace production_plan_api.Models;

public class DepartmentReport
{
    public long Id { get; set; }

    public long FactoryId { get; set; }

    public long DepartmentId { get; set; }

    public long ReportId { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreationDate { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime LastUpdateDate { get; set; }

    public long? LastUpdateBy { get; set; }
}