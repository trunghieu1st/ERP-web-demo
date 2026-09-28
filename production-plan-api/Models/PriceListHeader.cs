namespace production_plan_api.Models;

public sealed class PriceListHeader
{
    public long HeaderId { get; set; }
    public long? FactoryId { get; set; }
    public string? PriceListName { get; set; }
    public string? Description { get; set; }
    public string? Currency { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public long? TermId { get; set; }
    public string? PaymentTerms { get; set; }
    public string? Attribute1 { get; set; }
    public string? Attribute2 { get; set; }
    public string? Attribute3 { get; set; }
    public string? Attribute4 { get; set; }
    public string? Attribute5 { get; set; }
    public string? Attribute6 { get; set; }
    public string? Attribute7 { get; set; }
    public string? Attribute8 { get; set; }
    public string? Attribute9 { get; set; }
    public string? Attribute10 { get; set; }
}
