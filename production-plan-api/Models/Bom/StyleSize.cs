namespace production_plan_api.Models;

public class StyleSize
{
        public long SizeId { get; set; }

    public string MtlSizeCode { get; set; } = "";

    public decimal MtlSizeValue { get; set; }

    public string? MtlSizeDesc { get; set; }

    public long FactoryId { get; set; }

    public bool Active { get; set; }

    public long? CreatedBy { get; set; }

    public long? LastUpdatedBy { get; set; }

    public DateTime? LastUpdateDate { get; set; }

    public long? LastUpdateLogin { get; set; }

    public DateTime? CreationDate { get; set; }
}