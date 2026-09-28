namespace production_plan_api.Models;

public class MaterialColor
{
    public long MtlColorId { get; set; }

    public string ColorCode { get; set; } = "";

    public string? ColorName { get; set; }

    public string? ColorDesc { get; set; }

    public long FactoryId { get; set; }

    public bool Active { get; set; } = true;

    public long? CreatedBy { get; set; }

    public DateTime? CreationDate { get; set; }

    public long? LastUpdatedBy { get; set; }

    public DateTime? LastUpdateDate { get; set; }
}