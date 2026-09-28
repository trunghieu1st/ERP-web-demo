namespace production_plan_api.DTOs.Item
{
    public class ItemBasicUpdateRequest
    {
        public long? FactoryId { get; set; }
        public string? ItemCode { get; set; }
        public long LastUpdateBy { get; set; }
        public string? Description { get; set; }
        public string? LongDescription { get; set; }
        public string? PrimaryUomCode { get; set; }        
        public string? ItemType { get; set; }      
        public string? ItemCategory { get; set; }
    }
}