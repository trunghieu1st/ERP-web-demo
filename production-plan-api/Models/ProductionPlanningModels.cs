namespace production_plan_api.Models;

public class OrderHeader
{
    public long HeaderId { get; set; }
    public string OrderType { get; set; } = null!;
    public long OrderNumber { get; set; }
    public long? SourceDocumentId { get; set; }
    public DateTime? OrderedDate { get; set; }
    public DateTime? BookedDate { get; set; }
    public long? SaleAgreementId { get; set; }
    public string? CustPoNumber { get; set; }
    public string? ShippingMethodCode { get; set; }
    public long? ShipToLocationId { get; set; }
    public long? BillToLocationId { get; set; }
    public string? PaymentTermCode { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime? CreationDate { get; set; }
    public long? LastUpdatedBy { get; set; }
    public DateTime? LastUpdateDate { get; set; }
    public long FactoryId { get; set; }
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
    public string? Attribute11 { get; set; }
    public string? Attribute12 { get; set; }
    public string? Attribute13 { get; set; }
    public string? Attribute14 { get; set; }
    public string? Attribute15 { get; set; }
    public string? Attribute16 { get; set; }
    public string? Attribute17 { get; set; }
    public string? Attribute18 { get; set; }
    public string? Attribute19 { get; set; }
    public string? Attribute20 { get; set; }
}

public class ShippingMethod
{
    public long ShippingMethodId { get; set; }
    public string ShippingMethodCode { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreationDate { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime LastUpdateDate { get; set; }
    public long? LastUpdateBy { get; set; }
}

public class PaymentTerm
{
    public long PaymentTermId { get; set; }
    public string PaymentTermCode { get; set; } = null!;
    public string Prepayment { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreationDate { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime LastUpdateDate { get; set; }
    public long? LastUpdateBy { get; set; }
}
