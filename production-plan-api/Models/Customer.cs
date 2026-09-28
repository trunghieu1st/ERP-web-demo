namespace production_plan_api.Models;

public class Customer
{
    public long PartyId { get; set; }

    public string? PartyCode { get; set; }

    public string? PartyName { get; set; }

    public string? CountryCode { get; set; }

    public string? Address { get; set; }

    public DateTime? CreationDate { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime? LastUpdateDate { get; set; }

    public long? LastUpdateBy { get; set; }

    public long? FactoryId { get; set; }
    public string? Active { get; set; }
}
