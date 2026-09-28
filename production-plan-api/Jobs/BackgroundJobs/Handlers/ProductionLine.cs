namespace production_plan_api.Jobs.BackgroundJobs.Handlers.ProductionLine;

public class ProductionLineExportPayload
{
    public long? UserId { get; set; }

    public long? ProductionLineId { get; set; }
}