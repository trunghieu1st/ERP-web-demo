namespace production_plan_api.Models;

public sealed class SalesAgreementLine
{
    public long LineId { get; set; }
    public long HeaderId { get; set; }
    public long? InventoryItemId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? CreationDate { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime? LastUpdateDate { get; set; }
    public long? LastUpdateBy { get; set; }
    public long FactoryId { get; set; }
}
