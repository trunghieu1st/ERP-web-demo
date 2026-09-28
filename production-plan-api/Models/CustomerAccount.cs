namespace production_plan_api.Models;

public class CustomerAccount
{
    public long CustAccountId { get; set; }

    public long PartyId { get; set; }

    public string AccountName { get; set; } = "";

    public DateTime CreationDate { get; set; }

    public long CreatedBy { get; set; }

    public DateTime LastUpdateDate { get; set; }

    public long LastUpdateBy { get; set; }

    public long FactoryId { get; set; }

    public string Active { get; set; } = "ACTIVE";
}