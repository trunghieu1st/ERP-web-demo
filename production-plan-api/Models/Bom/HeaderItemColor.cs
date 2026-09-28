namespace production_plan_api.Models;

public class HeaderItemColor
{
    public long HeaderColorId { get; set; }

    public long MtlHeaderId { get; set; }

    public long ColorId { get; set; }

    public long FactoryId { get; set; }

    public string? Description { get; set; }

    public string? Remark { get; set; }

    public decimal? SoCutting { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime? CreationDate { get; set; }

    public long? LastUpdatedBy { get; set; }

    public DateTime? LastUpdateDate { get; set; }

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