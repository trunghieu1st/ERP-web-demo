namespace production_plan_api.Models;

public sealed class MaterialCollectionHeader
{
    public long CollectionHeaderId { get; set; }
    public string? CollectionCode { get; set; }
    public string? CollectionName { get; set; }
    public string? CurrencyCode { get; set; }
    public string? YearCode { get; set; }
    public string? SessionCode { get; set; }
    public long? CustAccountId { get; set; }
    public string? Description { get; set; }
    public string? LongDescription { get; set; }
    public DateTime CreationDate { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime LastUpdateDate { get; set; }
    public long? LastUpdateBy { get; set; }
    public bool IsActive { get; set; }
    public long? FactoryId { get; set; }
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
