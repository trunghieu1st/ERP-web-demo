namespace production_plan_api.Models;

public sealed class SalesAgreementHeader
{
    public long HeaderId { get; set; }
    public string SaleAgreementName { get; set; } = string.Empty;
    public long SaleAgreementNumber { get; set; }
    public long? CustAccountId { get; set; }
    public long? PriceListId { get; set; }
    public long? CollectionHeaderId { get; set; }
    public string? TransactionalCurrCode { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? CreationDate { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime? LastUpdateDate { get; set; }
    public long? LastUpdateBy { get; set; }
    public long FactoryId { get; set; }
}
