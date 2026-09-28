namespace production_plan_api.Models;

public class ExportProductionLine
{
    public long FactoryId { get; set; }

    public string? FactoryCode { get; set; }

    public string? FactoryName { get; set; }

    public long UserId { get; set; }

    public string? Username { get; set; }

    public long ProductionLineId { get; set; }

    public string? LineCode { get; set; }

    public string? LineName { get; set; }
}