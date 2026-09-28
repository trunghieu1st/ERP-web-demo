namespace production_plan_api.Models;

public class Factory
{
    public long FactoryId { get; set; }

    public string FactoryCode { get; set; } = "";

    public string FactoryName { get; set; } = "";

    public bool IsActive { get; set; }

    public DateTime CreationDate { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime LastUpdateDate { get; set; }

    public long? LastUpdateBy { get; set; }
}

