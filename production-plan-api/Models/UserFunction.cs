namespace production_plan_api.Models;

public class UserFunction
{
    public long UserFunctionId { get; set; }

    public long UserId { get; set; }

    public long FactoryId { get; set; }

    public long ProductionLineId { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreationDate { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime LastUpdateDate { get; set; }

    public long? LastUpdateBy { get; set; }
}
