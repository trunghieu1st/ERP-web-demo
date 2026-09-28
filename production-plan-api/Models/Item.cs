namespace production_plan_api.Models
{
    public class Item
    {
        public long InventoryItemId { get; set; }

        public long FactoryId { get; set; }

        public string ItemCode { get; set; } = null!;

        public DateTime LastUpdateDate { get; set; }

        public long LastUpdatedBy { get; set; }

        public DateTime CreationDate { get; set; }

        public long CreatedBy { get; set; }

        public string? Description { get; set; }

        public string? LongDescription { get; set; }

        public string? PrimaryUomCode { get; set; }

        public string? PrimaryUnitOfMeasure { get; set; }

        public string? ItemType { get; set; }

        public string? ItemTypeDesc { get; set; }

        public string? ItemCategory { get; set; }

        public string? ItemCategoryDesc { get; set; }

        public long? ColorId { get; set; }

        public long? SizeId { get; set; }

        public long? BasicId { get; set; }

        public string? TypeGiaCong { get; set; }

        public string? KichThuoc { get; set; }

        public string? KhongLa { get; set; }

        public long? MasterItemId { get; set; }

        public string? MasterItem { get; set; }

        public string? Segment1 { get; set; }
        public string? Segment2 { get; set; }
        public string? Segment3 { get; set; }
        public string? Segment4 { get; set; }
        public string? Segment5 { get; set; }
        public string? Segment6 { get; set; }
        public string? Segment7 { get; set; }
        public string? Segment8 { get; set; }
        public string? Segment9 { get; set; }
        public string? Segment10 { get; set; }
        public string? Segment11 { get; set; }
        public string? Segment12 { get; set; }
        public string? Segment13 { get; set; }
        public string? Segment14 { get; set; }
        public string? Segment15 { get; set; }
        public string? Segment16 { get; set; }
        public string? Segment17 { get; set; }
        public string? Segment18 { get; set; }
        public string? Segment19 { get; set; }
        public string? Segment20 { get; set; }

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
        public string? Attribute21 { get; set; }
        public string? Attribute22 { get; set; }
        public string? Attribute23 { get; set; }
        public string? Attribute24 { get; set; }
        public string? Attribute25 { get; set; }
        public string? Attribute26 { get; set; }
        public string? Attribute27 { get; set; }
        public string? Attribute28 { get; set; }
        public string? Attribute29 { get; set; }
        public string? Attribute30 { get; set; }

        public string? SecondaryUomCode { get; set; }

        public string? SecondaryUnitOfMeasure { get; set; }

        public string? RatioUom { get; set; }
    }
}