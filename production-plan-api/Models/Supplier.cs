namespace production_plan_api.Models
{
    public class Supplier
    {
        public long SupplierId { get; set; }

        public string? SupplierCode { get; set; }

        public string? SupplierName { get; set; }

        public string? CountryCode { get; set; }

        public string? Address { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Email { get; set; }

        public string? Description { get; set; }

        public string? LongDescription { get; set; }

        public DateTime? CreationDate { get; set; }

        public long? CreatedBy { get; set; }

        public DateTime? LastUpdateDate { get; set; }

        public long? LastUpdateBy { get; set; }

        public long? FactoryId { get; set; }

        public bool IsActive { get; set; } = true;

    }
}