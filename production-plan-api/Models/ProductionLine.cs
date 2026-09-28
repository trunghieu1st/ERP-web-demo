
namespace production_plan_api.Models;

public class ProductionLine
{
    public long ProductionLineId { get; set; }

    public long FactoryId { get; set; }

    public string LineCode { get; set; } = "";

    public string LineName { get; set; } = "";

    public bool IsActive { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreationDate { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime LastUpdateDate { get; set; }

    public long? LastUpdateBy { get; set; }
}
