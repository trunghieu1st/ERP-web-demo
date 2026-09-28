namespace production_plan_api.Models;

public class Report
{
    public long ReportId { get; set; }

    public string ReportCode { get; set; } = "";

    public string ReportName { get; set; } = "";

    public string ReportPath { get; set; } = "";

    public string? Icon { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public string? Description { get; set; }

    public DateTime CreationDate { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime LastUpdateDate { get; set; }

    public long? LastUpdateBy { get; set; }
}