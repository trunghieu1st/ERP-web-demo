namespace production_plan_api.Models;

public sealed class Currency
{
    public long CurrencyId { get; set; }
    public string? CurrencyCode { get; set; }
    public string? CurrencyName { get; set; }
    public string? Description { get; set; }
    public string? LongDescription { get; set; }
    public DateTime CreationDate { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime LastUpdateDate { get; set; }
    public long? LastUpdateBy { get; set; }
    public string? Attribute1 { get; set; }
    public string? Attribute2 { get; set; }
    public string? Attribute3 { get; set; }
    public string? Attribute4 { get; set; }
    public string? Attribute5 { get; set; }
}
