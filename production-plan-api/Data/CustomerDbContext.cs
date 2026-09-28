using Microsoft.EntityFrameworkCore;
using production_plan_api.Models;

namespace production_plan_api.Data;

public class CustomerDbContext : DbContext
{
    public CustomerDbContext(
        DbContextOptions<CustomerDbContext> options)
        : base(options)
    {
    }

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Factory> Factories => Set<Factory>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<CustomerAccount> CustomerAccounts => Set<CustomerAccount>();
    public DbSet<ProductionLine> ProductionLines => Set<ProductionLine>();
    public DbSet<UserFunction> UserFunctions => Set<UserFunction>();
    public DbSet<Menu> Menus => Set<Menu>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();

    public DbSet<Item> Items => Set<Item>();

    public DbSet<ExportProductionLine> ExportProductionLines
    => Set<ExportProductionLine>();

    public DbSet<Report> Reports => Set<Report>();

    public DbSet<FactoryReport> FactoryReports => Set<FactoryReport>();

    public DbSet<DepartmentReport> DepartmentReports
    => Set<DepartmentReport>();

    public DbSet<StyleColor> StyleColors => Set<StyleColor>();

    public DbSet<MaterialColor> MaterialColors => Set<MaterialColor>();

    public DbSet<StyleSize> MtlSizes => Set<StyleSize>();

    public DbSet<HeaderItemColor> HeaderItemColors
        => Set<HeaderItemColor>();

    public DbSet<HeaderItemSize> HeaderItemSizes
        => Set<HeaderItemSize>();

    public DbSet<SalesAgreementHeader> SalesAgreementHeaders => Set<SalesAgreementHeader>();
    public DbSet<SalesAgreementLine> SalesAgreementLines => Set<SalesAgreementLine>();
    public DbSet<MaterialCollectionHeader> MaterialCollectionHeaders => Set<MaterialCollectionHeader>();
    public DbSet<PriceListHeader> PriceListHeaders => Set<PriceListHeader>();
    public DbSet<Currency> Currencies => Set<Currency>();
    public DbSet<OrderHeader> OrderHeaders => Set<OrderHeader>();
    public DbSet<ShippingMethod> ShippingMethods => Set<ShippingMethod>();
    public DbSet<PaymentTerm> PaymentTerms => Set<PaymentTerm>();

    public DbSet<BackgroundJob> BackgroundJobs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // =========================================================
        // CUSTOMER
        // =========================================================

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("prs_parties_tb");

            entity.HasKey(x => x.PartyId);

            entity.Property(x => x.PartyId)
                .HasColumnName("party_id")
                .ValueGeneratedOnAdd();

            entity.Property(x => x.PartyCode)
                .HasColumnName("party_code");

            entity.Property(x => x.PartyName)
                .HasColumnName("party_name");

            entity.Property(x => x.CountryCode)
                .HasColumnName("country_code");

            entity.Property(x => x.Address)
                .HasColumnName("address");

            entity.Property(x => x.CreationDate)
                .HasColumnName("creation_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.CreatedBy)
                .HasColumnName("created_by");

            entity.Property(x => x.LastUpdateDate)
                .HasColumnName("last_update_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.LastUpdateBy)
                .HasColumnName("last_update_by");

            entity.Property(x => x.FactoryId)
                .HasColumnName("factory_id");

            entity.Property(x => x.Active)
                .HasColumnName("active");
        });


        // =========================================================
        // USER
        // =========================================================

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("prs_users_tb");

            entity.HasKey(x => x.UserId);

            entity.Property(x => x.UserId)
                .HasColumnName("user_id");

            entity.Property(x => x.Username)
                .HasColumnName("username");

            entity.Property(x => x.PasswordHash)
                .HasColumnName("password_hash");

            entity.Property(x => x.FullName)
                .HasColumnName("full_name");

            entity.Property(x => x.FactoryId)
                .HasColumnName("factory_id");

            entity.Property(x => x.DepartmentId)
                .HasColumnName("department_id");

            entity.Property(x => x.RoleCode)
                .HasColumnName("role_code");

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");
        });


        // =========================================================
        // FACTORY
        // =========================================================

        modelBuilder.Entity<Factory>(entity =>
        {
            entity.ToTable("prs_factories_tb");

            entity.HasKey(x => x.FactoryId);

            entity.Property(x => x.FactoryId)
                .HasColumnName("factory_id");

            entity.Property(x => x.FactoryCode)
                .HasColumnName("factory_code");

            entity.Property(x => x.FactoryName)
                .HasColumnName("factory_name");

            entity.Property(x => x.CreationDate)
                .HasColumnName("creation_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.CreatedBy)
                .HasColumnName("created_by");

            entity.Property(x => x.LastUpdateDate)
                .HasColumnName("last_update_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.LastUpdateBy)
                .HasColumnName("last_update_by");


            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");
        });


        // =========================================================
        // DEPARTMENT
        // =========================================================

        modelBuilder.Entity<Department>(entity =>
        {
            entity.ToTable("prs_departments_tb");

            entity.HasKey(x => x.DepartmentId);

            entity.Property(x => x.DepartmentId)
                .HasColumnName("department_id");

            entity.Property(x => x.DepartmentCode)
                .HasColumnName("department_code");

            entity.Property(x => x.DepartmentName)
                .HasColumnName("department_name");

            entity.Property(x => x.InterfaceType)
                .HasColumnName("interface_type");

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");
        });


        // =========================================================
        // ROLE
        // =========================================================

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("prs_roles_tb");

            entity.HasKey(x => x.RoleId);

            entity.Property(x => x.RoleId)
                .HasColumnName("role_id");

            entity.Property(x => x.RoleCode)
                .HasColumnName("role_code");

            entity.Property(x => x.RoleName)
                .HasColumnName("role_name");

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");
        });


        // =========================================================
        // PRODUCTION LINE
        // =========================================================

        modelBuilder.Entity<ProductionLine>(entity =>
        {
            entity.ToTable("prs_production_lines_tb");

            entity.HasKey(x => x.ProductionLineId);

            entity.Property(x => x.ProductionLineId)
                .HasColumnName("production_line_id");

            entity.Property(x => x.FactoryId)
                .HasColumnName("factory_id");

            entity.Property(x => x.LineCode)
                .HasColumnName("line_code");

            entity.Property(x => x.LineName)
                .HasColumnName("line_name");

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.SortOrder)
                .HasColumnName("sort_order");

            entity.Property(x => x.CreationDate)
                .HasColumnName("creation_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.CreatedBy)
                .HasColumnName("created_by");

            entity.Property(x => x.LastUpdateDate)
                .HasColumnName("last_update_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.LastUpdateBy)
                .HasColumnName("last_update_by");
        });


        // =========================================================
        // USER FUNCTION
        // =========================================================

        modelBuilder.Entity<UserFunction>(entity =>
        {
            entity.ToTable("prs_user_functions_tb");

            entity.HasKey(x => x.UserFunctionId);

            entity.Property(x => x.UserFunctionId)
                .HasColumnName("user_function_id");

            entity.Property(x => x.UserId)
                .HasColumnName("user_id");

            entity.Property(x => x.FactoryId)
                .HasColumnName("factory_id");

            entity.Property(x => x.ProductionLineId)
                .HasColumnName("production_line_id");

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.CreationDate)
                .HasColumnName("creation_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.CreatedBy)
                .HasColumnName("created_by");

            entity.Property(x => x.LastUpdateDate)
                .HasColumnName("last_update_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.LastUpdateBy)
                .HasColumnName("last_update_by");

            entity.HasIndex(x => new
            {
                x.UserId,
                x.ProductionLineId
            })
            .IsUnique()
            .HasDatabaseName("uq_prs_user_functions");
        });


        // =========================================================
        // MENU
        // =========================================================

        modelBuilder.Entity<Menu>(entity =>
        {
            entity.ToTable("prs_menus_tb");

            entity.HasKey(x => x.MenuId);

            entity.Property(x => x.MenuId)
                .HasColumnName("menu_id");

            entity.Property(x => x.ParentMenuId)
                .HasColumnName("parent_menu_id");

            entity.Property(x => x.MenuLevel)
                .HasColumnName("menu_level");

            entity.Property(x => x.MenuCode)
                .HasColumnName("menu_code");

            entity.Property(x => x.MenuName)
                .HasColumnName("menu_name");

            entity.Property(x => x.Path)
                .HasColumnName("path");

            entity.Property(x => x.DepartmentId)
                .HasColumnName("department_id");

            entity.Property(x => x.InterfaceType)
                .HasColumnName("interface_type");

            entity.Property(x => x.Icon)
                .HasColumnName("icon");

            entity.Property(x => x.SortOrder)
                .HasColumnName("sort_order");

            entity.Property(x => x.IsClickable)
                .HasColumnName("is_clickable");

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.CreationDate)
                .HasColumnName("creation_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.CreatedBy)
                .HasColumnName("created_by");

            entity.Property(x => x.LastUpdateDate)
                .HasColumnName("last_update_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.LastUpdateBy)
                .HasColumnName("last_update_by");
        });


        // =========================================================
        // CUSTOMER ACCOUNT
        // =========================================================

        modelBuilder.Entity<CustomerAccount>(entity =>
        {
            entity.ToTable("prs_cust_accounts_tb");

            entity.HasKey(x => x.CustAccountId);

            entity.Property(x => x.CustAccountId)
                .HasColumnName("cust_account_id")
                .ValueGeneratedOnAdd();

            entity.Property(x => x.PartyId)
                .HasColumnName("party_id")
                .IsRequired();

            entity.Property(x => x.AccountName)
                .HasColumnName("account_name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.CreationDate)
                .HasColumnName("creation_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.CreatedBy)
                .HasColumnName("created_by");

            entity.Property(x => x.LastUpdateDate)
                .HasColumnName("last_update_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.LastUpdateBy)
                .HasColumnName("last_update_by");

            entity.Property(x => x.FactoryId)
                .HasColumnName("factory_id");

            entity.Property(x => x.Active)
                .HasColumnName("active")
                .HasMaxLength(20)
                .IsRequired();

            entity.HasIndex(x => new
            {
                x.PartyId,
                x.AccountName
            })
            .IsUnique()
            .HasDatabaseName("uq_cust_account_party_name");
        });

        // SUPPLIER
        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.ToTable("prs_suppliers_tb");

            entity.HasKey(x => x.SupplierId);

            entity.Property(x => x.SupplierId)
                .HasColumnName("supplier_id")
                .ValueGeneratedOnAdd();

            entity.Property(x => x.SupplierCode)
                .HasColumnName("supplier_code")
                .HasMaxLength(100);

            entity.Property(x => x.SupplierName)
                .HasColumnName("supplier_name")
                .HasMaxLength(1000);

            entity.Property(x => x.CountryCode)
                .HasColumnName("country_code")
                .HasMaxLength(100);

            entity.Property(x => x.Address)
                .HasColumnName("address")
                .HasMaxLength(1000);

            entity.Property(x => x.PhoneNumber)
                .HasColumnName("phone_number")
                .HasMaxLength(20);

            entity.Property(x => x.Email)
                .HasColumnName("email")
                .HasMaxLength(100);

            entity.Property(x => x.Description)
                .HasColumnName("description")
                .HasMaxLength(240);

            entity.Property(x => x.LongDescription)
                .HasColumnName("long_description")
                .HasMaxLength(2000);

            entity.Property(x => x.CreationDate)
                .HasColumnName("creation_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.CreatedBy)
                .HasColumnName("created_by");

            entity.Property(x => x.LastUpdateDate)
                .HasColumnName("last_update_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.LastUpdateBy)
                .HasColumnName("last_update_by");

            entity.Property(x => x.FactoryId)
                .HasColumnName("factory_id");

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active")
                .HasDefaultValue(true);
        });

        // ITEM
        modelBuilder.Entity<Item>(entity =>
        {
            entity.ToTable("prs_items_tb");

            entity.HasKey(x => x.InventoryItemId);

            entity.Property(x => x.InventoryItemId)
                .HasColumnName("inventory_item_id")
                .ValueGeneratedOnAdd();

            entity.Property(x => x.FactoryId)
                .HasColumnName("factory_id")
                .IsRequired();

            entity.Property(x => x.ItemCode)
                .HasColumnName("item_code")
                .HasMaxLength(250)
                .IsRequired();

            entity.Property(x => x.LastUpdateDate)
                .HasColumnName("last_update_date")
                .HasColumnType("timestamp without time zone")
                .IsRequired();

            entity.Property(x => x.LastUpdatedBy)
                .HasColumnName("last_updated_by")
                .IsRequired();

            entity.Property(x => x.CreationDate)
                .HasColumnName("creation_date")
                .HasColumnType("timestamp without time zone")
                .IsRequired();

            entity.Property(x => x.CreatedBy)
                .HasColumnName("created_by")
                .IsRequired();

            entity.Property(x => x.Description)
                .HasColumnName("description")
                .HasMaxLength(240);

            entity.Property(x => x.LongDescription)
                .HasColumnName("long_description")
                .HasMaxLength(240);

            entity.Property(x => x.PrimaryUomCode)
                .HasColumnName("primary_uom_code")
                .HasMaxLength(5);

            entity.Property(x => x.PrimaryUnitOfMeasure)
                .HasColumnName("primary_unit_of_measure")
                .HasMaxLength(25);

            entity.Property(x => x.ItemType)
                .HasColumnName("item_type")
                .HasMaxLength(30);

            entity.Property(x => x.ItemTypeDesc)
                .HasColumnName("item_type_desc")
                .HasMaxLength(250);

            entity.Property(x => x.ItemCategory)
                .HasColumnName("item_category")
                .HasMaxLength(50);

            entity.Property(x => x.ItemCategoryDesc)
                .HasColumnName("item_category_desc")
                .HasMaxLength(250);

            entity.Property(x => x.ColorId)
                .HasColumnName("color_id");

            entity.Property(x => x.SizeId)
                .HasColumnName("size_id");

            entity.Property(x => x.BasicId)
                .HasColumnName("basic_id");

            entity.Property(x => x.TypeGiaCong)
                .HasColumnName("type_gia_cong")
                .HasMaxLength(20);

            entity.Property(x => x.KichThuoc)
                .HasColumnName("kich_thuoc")
                .HasMaxLength(150);

            entity.Property(x => x.KhongLa)
                .HasColumnName("khong_la")
                .HasMaxLength(10);

            entity.Property(x => x.MasterItemId)
                .HasColumnName("master_item_id");

            entity.Property(x => x.MasterItem)
                .HasColumnName("master_item")
                .HasMaxLength(250);

            entity.Property(x => x.SecondaryUomCode)
                .HasColumnName("secondary_uom_code")
                .HasMaxLength(5);

            entity.Property(x => x.SecondaryUnitOfMeasure)
                .HasColumnName("secondary_unit_of_measure")
                .HasMaxLength(25);

            entity.Property(x => x.RatioUom)
                .HasColumnName("ratio_uom")
                .HasMaxLength(25);

            // UNIQUE(factory_id, segment1)
            entity.HasIndex(x => new
            {
                x.FactoryId,
                x.ItemCode
            })
                .IsUnique()
                .HasDatabaseName(
                    "uq_prs_items_factory_item_code");

            entity.Property(x => x.Segment1).HasColumnName("segment1").HasMaxLength(250);
            entity.Property(x => x.Segment2).HasColumnName("segment2").HasMaxLength(250);
            entity.Property(x => x.Segment3).HasColumnName("segment3").HasMaxLength(250);
            entity.Property(x => x.Segment4).HasColumnName("segment4").HasMaxLength(250);
            entity.Property(x => x.Segment5).HasColumnName("segment5").HasMaxLength(250);
            entity.Property(x => x.Segment6).HasColumnName("segment6").HasMaxLength(250);
            entity.Property(x => x.Segment7).HasColumnName("segment7").HasMaxLength(250);
            entity.Property(x => x.Segment8).HasColumnName("segment8").HasMaxLength(250);
            entity.Property(x => x.Segment9).HasColumnName("segment9").HasMaxLength(250);
            entity.Property(x => x.Segment10).HasColumnName("segment10").HasMaxLength(250);
            entity.Property(x => x.Segment11).HasColumnName("segment11").HasMaxLength(250);
            entity.Property(x => x.Segment12).HasColumnName("segment12").HasMaxLength(250);
            entity.Property(x => x.Segment13).HasColumnName("segment13").HasMaxLength(250);
            entity.Property(x => x.Segment14).HasColumnName("segment14").HasMaxLength(250);
            entity.Property(x => x.Segment15).HasColumnName("segment15").HasMaxLength(250);
            entity.Property(x => x.Segment16).HasColumnName("segment16").HasMaxLength(250);
            entity.Property(x => x.Segment17).HasColumnName("segment17").HasMaxLength(250);
            entity.Property(x => x.Segment18).HasColumnName("segment18").HasMaxLength(250);
            entity.Property(x => x.Segment19).HasColumnName("segment19").HasMaxLength(250);
            entity.Property(x => x.Segment20).HasColumnName("segment20").HasMaxLength(250);

            entity.Property(x => x.Attribute1).HasColumnName("attribute1").HasMaxLength(240);
            entity.Property(x => x.Attribute2).HasColumnName("attribute2").HasMaxLength(240);
            entity.Property(x => x.Attribute3).HasColumnName("attribute3").HasMaxLength(240);
            entity.Property(x => x.Attribute4).HasColumnName("attribute4").HasMaxLength(240);
            entity.Property(x => x.Attribute5).HasColumnName("attribute5").HasMaxLength(240);
            entity.Property(x => x.Attribute6).HasColumnName("attribute6").HasMaxLength(240);
            entity.Property(x => x.Attribute7).HasColumnName("attribute7").HasMaxLength(240);
            entity.Property(x => x.Attribute8).HasColumnName("attribute8").HasMaxLength(240);
            entity.Property(x => x.Attribute9).HasColumnName("attribute9").HasMaxLength(240);
            entity.Property(x => x.Attribute10).HasColumnName("attribute10").HasMaxLength(240);
            entity.Property(x => x.Attribute11).HasColumnName("attribute11").HasMaxLength(240);
            entity.Property(x => x.Attribute12).HasColumnName("attribute12").HasMaxLength(240);
            entity.Property(x => x.Attribute13).HasColumnName("attribute13").HasMaxLength(240);
            entity.Property(x => x.Attribute14).HasColumnName("attribute14").HasMaxLength(240);
            entity.Property(x => x.Attribute15).HasColumnName("attribute15").HasMaxLength(240);
            entity.Property(x => x.Attribute16).HasColumnName("attribute16").HasMaxLength(240);
            entity.Property(x => x.Attribute17).HasColumnName("attribute17").HasMaxLength(240);
            entity.Property(x => x.Attribute18).HasColumnName("attribute18").HasMaxLength(240);
            entity.Property(x => x.Attribute19).HasColumnName("attribute19").HasMaxLength(240);
            entity.Property(x => x.Attribute20).HasColumnName("attribute20").HasMaxLength(240);
            entity.Property(x => x.Attribute21).HasColumnName("attribute21").HasMaxLength(240);
            entity.Property(x => x.Attribute22).HasColumnName("attribute22").HasMaxLength(240);
            entity.Property(x => x.Attribute23).HasColumnName("attribute23").HasMaxLength(240);
            entity.Property(x => x.Attribute24).HasColumnName("attribute24").HasMaxLength(240);
            entity.Property(x => x.Attribute25).HasColumnName("attribute25").HasMaxLength(240);
            entity.Property(x => x.Attribute26).HasColumnName("attribute26").HasMaxLength(240);
            entity.Property(x => x.Attribute27).HasColumnName("attribute27").HasMaxLength(240);
            entity.Property(x => x.Attribute28).HasColumnName("attribute28").HasMaxLength(240);
            entity.Property(x => x.Attribute29).HasColumnName("attribute29").HasMaxLength(240);
            entity.Property(x => x.Attribute30).HasColumnName("attribute30").HasMaxLength(240);
        });

        // =========================================================
        // EXPORT PRODUCTION LINE VIEW
        // =========================================================

        modelBuilder.Entity<ExportProductionLine>(entity =>
        {
            entity.HasNoKey();

            entity.ToView("prs_export_production_line_v");

            entity.Property(x => x.FactoryId)
                .HasColumnName("factory_id");

            entity.Property(x => x.FactoryCode)
                .HasColumnName("factory_code");

            entity.Property(x => x.FactoryName)
                .HasColumnName("factory_name");

            entity.Property(x => x.UserId)
                .HasColumnName("user_id");

            entity.Property(x => x.Username)
                .HasColumnName("username");

            entity.Property(x => x.ProductionLineId)
                .HasColumnName("production_line_id");

            entity.Property(x => x.LineCode)
                .HasColumnName("line_code");

            entity.Property(x => x.LineName)
                .HasColumnName("line_name");
        });

        // =========================================================
        // REPORT
        // =========================================================

        modelBuilder.Entity<Report>(entity =>
        {
            entity.ToTable("prs_list_report_tb");

            entity.HasKey(x => x.ReportId);

            entity.Property(x => x.ReportId)
                .HasColumnName("report_id")
                .ValueGeneratedOnAdd();


            entity.Property(x => x.ReportCode)
                .HasColumnName("report_code")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.ReportName)
                .HasColumnName("report_name")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(x => x.ReportPath)
                .HasColumnName("report_path")
                .HasMaxLength(300)
                .IsRequired();

            entity.Property(x => x.Icon)
                .HasColumnName("icon")
                .HasMaxLength(100);

            entity.Property(x => x.SortOrder)
                .HasColumnName("sort_order");

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.Description)
                .HasColumnName("description")
                .HasMaxLength(500);

            entity.Property(x => x.CreationDate)
                .HasColumnName("creation_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.CreatedBy)
                .HasColumnName("created_by");

            entity.Property(x => x.LastUpdateDate)
                .HasColumnName("last_update_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.LastUpdateBy)
                .HasColumnName("last_update_by");

            entity.HasIndex(x => x.ReportCode)
                .IsUnique()
                .HasDatabaseName("uq_report_code");
        });
        // =========================================================
        // FACTORY REPORT
        // =========================================================

        modelBuilder.Entity<FactoryReport>(entity =>
        {
            entity.ToTable("prs_factory_report_tb");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            entity.Property(x => x.FactoryId)
                .HasColumnName("factory_id");

            entity.Property(x => x.ReportId)
                .HasColumnName("report_id");

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.CreationDate)
                .HasColumnName("creation_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.CreatedBy)
                .HasColumnName("created_by");

            entity.Property(x => x.LastUpdateDate)
                .HasColumnName("last_update_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.LastUpdateBy)
                .HasColumnName("last_update_by");

            entity.HasIndex(x => new
            {
                x.FactoryId,
                x.ReportId
            })
            .IsUnique()
            .HasDatabaseName("uq_factory_report");
        });

        // =========================================================
        // DEPARTMENT REPORT
        // =========================================================

        modelBuilder.Entity<DepartmentReport>(entity =>
        {
            entity.ToTable("prs_department_report_tb");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            entity.Property(x => x.FactoryId)
                .HasColumnName("factory_id");

            entity.Property(x => x.DepartmentId)
                .HasColumnName("department_id");

            entity.Property(x => x.ReportId)
                .HasColumnName("report_id");

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active");

            entity.Property(x => x.CreationDate)
                .HasColumnName("creation_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.CreatedBy)
                .HasColumnName("created_by");

            entity.Property(x => x.LastUpdateDate)
                .HasColumnName("last_update_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.LastUpdateBy)
                .HasColumnName("last_update_by");

            entity.HasIndex(x => new
            {
                x.FactoryId,
                x.DepartmentId,
                x.ReportId
            })
            .IsUnique()
            .HasDatabaseName("uq_factory_department_report");
        });

        modelBuilder.Entity<StyleColor>(entity =>
            {
                entity.ToTable("prs_style_color");

                entity.HasKey(x => x.StyleColorId);

                entity.Property(x => x.StyleColorId)
                    .HasColumnName("style_color_id")
                    .ValueGeneratedOnAdd();

                entity.Property(x => x.ColorCode)
                    .HasColumnName("color_code")
                    .HasMaxLength(15)
                    .IsRequired();

                entity.Property(x => x.ColorName)
                    .HasColumnName("color_name")
                    .HasMaxLength(255);

                entity.Property(x => x.ColorDesc)
                    .HasColumnName("color_desc")
                    .HasMaxLength(255);

                entity.Property(x => x.FactoryId)
                    .HasColumnName("factory_id")
                    .IsRequired();

                entity.Property(x => x.Active)
                    .HasColumnName("active")
                    .IsRequired();

                entity.Property(x => x.CreatedBy)
                    .HasColumnName("created_by");

                entity.Property(x => x.CreationDate)
                    .HasColumnName("creation_date")
                    .HasColumnType("timestamp without time zone");

                entity.Property(x => x.LastUpdatedBy)
                    .HasColumnName("last_updated_by");

                entity.Property(x => x.LastUpdateDate)
                    .HasColumnName("last_update_date")
                    .HasColumnType("timestamp without time zone");

                entity.Property(x => x.Attribute1)
                    .HasColumnName("attribute1")
                    .HasMaxLength(255);

                entity.Property(x => x.Attribute2)
                    .HasColumnName("attribute2")
                    .HasMaxLength(255);

                entity.Property(x => x.Attribute3)
                    .HasColumnName("attribute3")
                    .HasMaxLength(255);

                entity.Property(x => x.Attribute4)
                    .HasColumnName("attribute4")
                    .HasMaxLength(255);

                entity.Property(x => x.Attribute5)
                    .HasColumnName("attribute5")
                    .HasMaxLength(255);

                entity.Property(x => x.Attribute6)
                    .HasColumnName("attribute6")
                    .HasMaxLength(255);

                entity.Property(x => x.Attribute7)
                    .HasColumnName("attribute7")
                    .HasMaxLength(255);

                entity.Property(x => x.Attribute8)
                    .HasColumnName("attribute8")
                    .HasMaxLength(255);

                entity.Property(x => x.Attribute9)
                    .HasColumnName("attribute9")
                    .HasMaxLength(255);

                entity.Property(x => x.Attribute10)
                    .HasColumnName("attribute10")
                    .HasMaxLength(255);

                entity.HasIndex(x => x.FactoryId)
                    .HasDatabaseName("ix_prs_style_color_factory");

                entity.HasIndex(x => new
                {
                    x.FactoryId,
                    x.ColorCode
                })
                .IsUnique()
                .HasDatabaseName(
                    "uq_prs_style_color_factory_code"
                );
            });

        modelBuilder.Entity<MaterialColor>(entity =>
            {
                entity.ToTable("prs_mtl_color");

                entity.HasKey(x => x.MtlColorId);

                entity.Property(x => x.MtlColorId)
                    .HasColumnName("mtl_color_id")
                    .ValueGeneratedOnAdd();

                entity.Property(x => x.ColorDesc)
                    .HasColumnName("color_desc")
                    .HasMaxLength(250);

                entity.Property(x => x.ColorCode)
                    .HasColumnName("color_code")
                    .HasMaxLength(30)
                    .IsRequired();

                entity.Property(x => x.ColorName)
                    .HasColumnName("color_name")
                    .HasMaxLength(250);

                entity.Property(x => x.FactoryId)
                    .HasColumnName("factory_id")
                    .IsRequired();

                entity.Property(x => x.Active)
                    .HasColumnName("active")
                    .IsRequired();

                entity.Property(x => x.CreatedBy)
                    .HasColumnName("created_by");

                entity.Property(x => x.CreationDate)
                    .HasColumnName("creation_date")
                    .HasColumnType("timestamp without time zone");

                entity.Property(x => x.LastUpdatedBy)
                    .HasColumnName("last_updated_by");

                entity.Property(x => x.LastUpdateDate)
                    .HasColumnName("last_update_date")
                    .HasColumnType("timestamp without time zone");

                entity.HasIndex(x => x.FactoryId)
                    .HasDatabaseName(
                        "ix_prs_mtl_color_factory"
                    );

                entity.HasIndex(x => new
                {
                    x.FactoryId,
                    x.ColorCode
                })
                .IsUnique()
                .HasDatabaseName(
                    "uq_prs_mtl_color_factory_code"
                );
            });

        // =========================================================
        // MTL SIZE
        // =========================================================

        modelBuilder.Entity<StyleSize>(entity =>
        {
            entity.ToTable("prs_mtl_size");

            entity.HasKey(x => x.SizeId);

            entity.Property(x => x.SizeId)
                .HasColumnName("size_id")
                .ValueGeneratedOnAdd();

            entity.Property(x => x.MtlSizeCode)
                .HasColumnName("mtl_size_code")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.MtlSizeValue)
                .HasColumnName("mtl_size_value")
                .HasPrecision(18, 4)
                .IsRequired();

            entity.Property(x => x.MtlSizeDesc)
                .HasColumnName("mtl_size_desc")
                .HasMaxLength(250);

            entity.Property(x => x.FactoryId)
                .HasColumnName("factory_id")
                .IsRequired();

            entity.Property(x => x.Active)
                .HasColumnName("active")
                .IsRequired();

            entity.Property(x => x.CreatedBy)
                .HasColumnName("created_by");

            entity.Property(x => x.LastUpdatedBy)
                .HasColumnName("last_updated_by");

            entity.Property(x => x.LastUpdateDate)
                .HasColumnName("last_update_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.LastUpdateLogin)
                .HasColumnName("last_update_login");

            entity.Property(x => x.CreationDate)
                .HasColumnName("creation_date")
                .HasColumnType("timestamp without time zone");

            entity.HasIndex(x => x.FactoryId)
                .HasDatabaseName("ix_prs_mtl_size_factory");

            entity.HasIndex(x => x.MtlSizeValue)
                .HasDatabaseName("ix_prs_mtl_size_value");

            entity.HasIndex(x => new
            {
                x.FactoryId,
                x.MtlSizeCode
            })
            .IsUnique()
            .HasDatabaseName(
                "uq_prs_mtl_size_factory_code");
        });


        // =========================================================
        // HEADER ITEM COLOR
        // =========================================================

        modelBuilder.Entity<HeaderItemColor>(entity =>
        {
            entity.ToTable("prs_header_item_color");

            entity.HasKey(x => x.HeaderColorId);

            entity.Property(x => x.HeaderColorId)
                .HasColumnName("header_color_id")
                .ValueGeneratedOnAdd();

            entity.Property(x => x.MtlHeaderId)
                .HasColumnName("mtl_header_id")
                .IsRequired();

            entity.Property(x => x.ColorId)
                .HasColumnName("color_id")
                .IsRequired();

            entity.Property(x => x.FactoryId)
                .HasColumnName("factory_id")
                .IsRequired();

            entity.Property(x => x.Description)
                .HasColumnName("description")
                .HasMaxLength(150);

            entity.Property(x => x.Remark)
                .HasColumnName("remark")
                .HasMaxLength(150);

            entity.Property(x => x.SoCutting)
                .HasColumnName("so_cutting");

            entity.Property(x => x.CreatedBy)
                .HasColumnName("created_by");

            entity.Property(x => x.CreationDate)
                .HasColumnName("creation_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.LastUpdatedBy)
                .HasColumnName("last_updated_by");

            entity.Property(x => x.LastUpdateDate)
                .HasColumnName("last_update_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.Attribute1)
                .HasColumnName("attribute1")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute2)
                .HasColumnName("attribute2")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute3)
                .HasColumnName("attribute3")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute4)
                .HasColumnName("attribute4")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute5)
                .HasColumnName("attribute5")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute6)
                .HasColumnName("attribute6")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute7)
                .HasColumnName("attribute7")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute8)
                .HasColumnName("attribute8")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute9)
                .HasColumnName("attribute9")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute10)
                .HasColumnName("attribute10")
                .HasMaxLength(150);

            entity.HasIndex(x => x.MtlHeaderId)
                .HasDatabaseName(
                    "idx_header_item_color_mtl_header");

            entity.HasIndex(x => x.ColorId)
                .HasDatabaseName(
                    "idx_header_item_color_color");

            entity.HasIndex(x => x.FactoryId)
                .HasDatabaseName(
                    "idx_header_item_color_factory");

            entity.HasIndex(x => new
            {
                x.FactoryId,
                x.MtlHeaderId,
                x.ColorId
            })
            .IsUnique()
            .HasDatabaseName("uq_header_item_color");
        });


        // =========================================================
        // HEADER ITEM SIZE
        // =========================================================

        modelBuilder.Entity<HeaderItemSize>(entity =>
        {
            entity.ToTable("prs_header_item_size");

            entity.HasKey(x => x.HeaderSizeId);

            entity.Property(x => x.HeaderSizeId)
                .HasColumnName("header_size_id")
                .ValueGeneratedOnAdd();

            entity.Property(x => x.MtlHeaderId)
                .HasColumnName("mtl_header_id")
                .IsRequired();

            entity.Property(x => x.SizeId)
                .HasColumnName("size_id")
                .IsRequired();

            entity.Property(x => x.FactoryId)
                .HasColumnName("factory_id")
                .IsRequired();

            entity.Property(x => x.Description)
                .HasColumnName("description")
                .HasMaxLength(150);

            entity.Property(x => x.Remark)
                .HasColumnName("remark")
                .HasMaxLength(150);

            entity.Property(x => x.CreatedBy)
                .HasColumnName("created_by");

            entity.Property(x => x.CreationDate)
                .HasColumnName("creation_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.LastUpdatedBy)
                .HasColumnName("last_updated_by");

            entity.Property(x => x.LastUpdateDate)
                .HasColumnName("last_update_date")
                .HasColumnType("timestamp without time zone");

            entity.Property(x => x.Attribute1)
                .HasColumnName("attribute1")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute2)
                .HasColumnName("attribute2")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute3)
                .HasColumnName("attribute3")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute4)
                .HasColumnName("attribute4")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute5)
                .HasColumnName("attribute5")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute6)
                .HasColumnName("attribute6")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute7)
                .HasColumnName("attribute7")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute8)
                .HasColumnName("attribute8")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute9)
                .HasColumnName("attribute9")
                .HasMaxLength(150);

            entity.Property(x => x.Attribute10)
                .HasColumnName("attribute10")
                .HasMaxLength(150);

            entity.HasIndex(x => x.MtlHeaderId)
                .HasDatabaseName(
                    "idx_prs_header_item_size_mtl_header");

            entity.HasIndex(x => x.SizeId)
                .HasDatabaseName(
                    "idx_prs_header_item_size_size");

            entity.HasIndex(x => x.FactoryId)
                .HasDatabaseName(
                    "idx_prs_header_item_size_factory");

            entity.HasIndex(x => x.CreatedBy)
                .HasDatabaseName(
                    "idx_prs_header_item_size_created_by");

            entity.HasIndex(x => x.LastUpdatedBy)
                .HasDatabaseName(
                    "idx_prs_header_item_size_updated_by");

            entity.HasIndex(x => new
            {
                x.FactoryId,
                x.MtlHeaderId,
                x.SizeId
            })
            .IsUnique()
            .HasDatabaseName("uq_header_item_size");
        });

        // SALES AGREEMENT HEADER
        modelBuilder.Entity<SalesAgreementHeader>(entity =>
        {
            entity.ToTable("prs_sales_agreement_header_tb");
            entity.HasKey(x => x.HeaderId);
            entity.Property(x => x.HeaderId).HasColumnName("header_id").ValueGeneratedOnAdd();
            entity.Property(x => x.SaleAgreementName).HasColumnName("sale_agreement_name").HasMaxLength(250).IsRequired();
            entity.Property(x => x.SaleAgreementNumber).HasColumnName("sale_agreement_number").HasDefaultValueSql("nextval('prs_sales_agreement_number_seq'::regclass)").ValueGeneratedOnAdd();
            entity.Property(x => x.CustAccountId).HasColumnName("cust_account_id");
            entity.Property(x => x.PriceListId).HasColumnName("price_list_id");
            entity.Property(x => x.CollectionHeaderId).HasColumnName("collection_header_id");
            entity.Property(x => x.TransactionalCurrCode).HasColumnName("transactional_curr_code").HasMaxLength(20);
            entity.Property(x => x.StartDate).HasColumnName("start_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.EndDate).HasColumnName("end_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.CreationDate).HasColumnName("creation_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.CreatedBy).HasColumnName("created_by");
            entity.Property(x => x.LastUpdateDate).HasColumnName("last_update_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.LastUpdateBy).HasColumnName("last_update_by");
            entity.Property(x => x.FactoryId).HasColumnName("factory_id");
            entity.HasIndex(x => new { x.FactoryId, x.SaleAgreementName }).IsUnique().HasDatabaseName("uk_prs_sales_agreement_factory_name");
            entity.HasIndex(x => x.SaleAgreementNumber).IsUnique().HasDatabaseName("uk_prs_sales_agreement_number");
        });

        // SALES AGREEMENT LINE
        modelBuilder.Entity<SalesAgreementLine>(entity =>
        {
            entity.ToTable("prs_sales_agreement_line_tb");
            entity.HasKey(x => x.LineId);
            entity.Property(x => x.LineId).HasColumnName("line_id").ValueGeneratedOnAdd();
            entity.Property(x => x.HeaderId).HasColumnName("header_id");
            entity.Property(x => x.InventoryItemId).HasColumnName("inventory_item_id");
            entity.Property(x => x.StartDate).HasColumnName("start_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.EndDate).HasColumnName("end_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.CreationDate).HasColumnName("creation_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.CreatedBy).HasColumnName("created_by");
            entity.Property(x => x.LastUpdateDate).HasColumnName("last_update_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.LastUpdateBy).HasColumnName("last_update_by");
            entity.Property(x => x.FactoryId).HasColumnName("factory_id");
            entity.HasOne<SalesAgreementHeader>().WithMany().HasForeignKey(x => x.HeaderId).OnDelete(DeleteBehavior.Restrict); // EF relationship only; no database migration implied
        });

        // MATERIAL COLLECTION HEADER
        modelBuilder.Entity<MaterialCollectionHeader>(entity =>
        {
            entity.ToTable("prs_material_collection_header_tb");
            entity.HasKey(x => x.CollectionHeaderId);
            entity.Property(x => x.CollectionHeaderId).HasColumnName("collection_header_id").ValueGeneratedOnAdd();
            entity.Property(x => x.CollectionCode).HasColumnName("collection_code").HasMaxLength(100);
            entity.Property(x => x.CollectionName).HasColumnName("collection_name").HasMaxLength(1000);
            entity.Property(x => x.CurrencyCode).HasColumnName("currency_code").HasMaxLength(24);
            entity.Property(x => x.YearCode).HasColumnName("year_code").HasMaxLength(24);
            entity.Property(x => x.SessionCode).HasColumnName("session_code").HasMaxLength(24);
            entity.Property(x => x.CustAccountId).HasColumnName("cust_account_id");
            entity.Property(x => x.Description).HasColumnName("description").HasMaxLength(240);
            entity.Property(x => x.LongDescription).HasColumnName("long_description").HasMaxLength(2000);
            entity.Property(x => x.CreationDate).HasColumnName("creation_date").HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnType("timestamp without time zone");
            entity.Property(x => x.CreatedBy).HasColumnName("created_by");
            entity.Property(x => x.LastUpdateDate).HasColumnName("last_update_date").HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnType("timestamp without time zone");
            entity.Property(x => x.LastUpdateBy).HasColumnName("last_update_by");
            entity.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(x => x.FactoryId).HasColumnName("factory_id");
            entity.Property(x => x.Attribute1).HasColumnName("attribute1").HasMaxLength(240);
            entity.Property(x => x.Attribute2).HasColumnName("attribute2").HasMaxLength(240);
            entity.Property(x => x.Attribute3).HasColumnName("attribute3").HasMaxLength(240);
            entity.Property(x => x.Attribute4).HasColumnName("attribute4").HasMaxLength(240);
            entity.Property(x => x.Attribute5).HasColumnName("attribute5").HasMaxLength(240);
            entity.Property(x => x.Attribute6).HasColumnName("attribute6").HasMaxLength(240);
            entity.Property(x => x.Attribute7).HasColumnName("attribute7").HasMaxLength(240);
            entity.Property(x => x.Attribute8).HasColumnName("attribute8").HasMaxLength(240);
            entity.Property(x => x.Attribute9).HasColumnName("attribute9").HasMaxLength(240);
            entity.Property(x => x.Attribute10).HasColumnName("attribute10").HasMaxLength(240);
            entity.HasIndex(x => x.CollectionCode).IsUnique().HasDatabaseName("uq_prs_material_collection_code");
        });

        // PRICE LIST HEADER
        modelBuilder.Entity<PriceListHeader>(entity =>
        {
            entity.ToTable("prs_price_list_header_tb");
            entity.HasKey(x => x.HeaderId);
            entity.Property(x => x.HeaderId).HasColumnName("header_id").ValueGeneratedOnAdd();
            entity.Property(x => x.FactoryId).HasColumnName("factory_id");
            entity.Property(x => x.PriceListName).HasColumnName("price_list_name").HasMaxLength(250);
            entity.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            entity.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(5);
            entity.Property(x => x.StartDate).HasColumnName("start_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.EndDate).HasColumnName("end_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.TermId).HasColumnName("term_id");
            entity.Property(x => x.PaymentTerms).HasColumnName("payment_terms").HasMaxLength(250);
            entity.Property(x => x.Attribute1).HasColumnName("attribute1").HasMaxLength(250);
            entity.Property(x => x.Attribute2).HasColumnName("attribute2").HasMaxLength(250);
            entity.Property(x => x.Attribute3).HasColumnName("attribute3").HasMaxLength(250);
            entity.Property(x => x.Attribute4).HasColumnName("attribute4").HasMaxLength(250);
            entity.Property(x => x.Attribute5).HasColumnName("attribute5").HasMaxLength(250);
            entity.Property(x => x.Attribute6).HasColumnName("attribute6").HasMaxLength(250);
            entity.Property(x => x.Attribute7).HasColumnName("attribute7").HasMaxLength(250);
            entity.Property(x => x.Attribute8).HasColumnName("attribute8").HasMaxLength(250);
            entity.Property(x => x.Attribute9).HasColumnName("attribute9").HasMaxLength(250);
            entity.Property(x => x.Attribute10).HasColumnName("attribute10").HasMaxLength(250);
            entity.HasIndex(x => new { x.FactoryId, x.PriceListName }).IsUnique().HasDatabaseName("uk_prs_price_list_factory_name");
        });

        // ORDER HEADER
        modelBuilder.Entity<OrderHeader>(entity =>
        {
            entity.ToTable("prs_order_headers_all");
            entity.HasKey(x => x.HeaderId);
            entity.Property(x => x.HeaderId).HasColumnName("header_id").ValueGeneratedOnAdd();
            entity.Property(x => x.OrderType).HasColumnName("order_type").HasMaxLength(150).IsRequired();
            entity.Property(x => x.OrderNumber).HasColumnName("order_number").HasDefaultValueSql("nextval('public.prs_order_number_seq'::regclass)").ValueGeneratedOnAdd();
            entity.Property(x => x.SourceDocumentId).HasColumnName("source_document_id");
            entity.Property(x => x.OrderedDate).HasColumnName("ordered_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.BookedDate).HasColumnName("booked_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.SaleAgreementId).HasColumnName("sale_agreement_id");
            entity.Property(x => x.CustPoNumber).HasColumnName("cust_po_number").HasMaxLength(50);
            entity.Property(x => x.ShippingMethodCode).HasColumnName("shipping_method_code").HasMaxLength(30);
            entity.Property(x => x.ShipToLocationId).HasColumnName("ship_to_location_id");
            entity.Property(x => x.BillToLocationId).HasColumnName("bill_to_location_id");
            entity.Property(x => x.PaymentTermCode).HasColumnName("payment_term_code").HasMaxLength(50);
            entity.Property(x => x.CreatedBy).HasColumnName("created_by");
            entity.Property(x => x.CreationDate).HasColumnName("creation_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.LastUpdatedBy).HasColumnName("last_updated_by");
            entity.Property(x => x.LastUpdateDate).HasColumnName("last_update_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.FactoryId).HasColumnName("factory_id").IsRequired();
            entity.Property(x => x.Attribute1).HasColumnName("attribute1").HasMaxLength(240);
            entity.Property(x => x.Attribute2).HasColumnName("attribute2").HasMaxLength(240);
            entity.Property(x => x.Attribute3).HasColumnName("attribute3").HasMaxLength(240);
            entity.Property(x => x.Attribute4).HasColumnName("attribute4").HasMaxLength(240);
            entity.Property(x => x.Attribute5).HasColumnName("attribute5").HasMaxLength(240);
            entity.Property(x => x.Attribute6).HasColumnName("attribute6").HasMaxLength(240);
            entity.Property(x => x.Attribute7).HasColumnName("attribute7").HasMaxLength(240);
            entity.Property(x => x.Attribute8).HasColumnName("attribute8").HasMaxLength(240);
            entity.Property(x => x.Attribute9).HasColumnName("attribute9").HasMaxLength(240);
            entity.Property(x => x.Attribute10).HasColumnName("attribute10").HasMaxLength(240);
            entity.Property(x => x.Attribute11).HasColumnName("attribute11").HasMaxLength(240);
            entity.Property(x => x.Attribute12).HasColumnName("attribute12").HasMaxLength(240);
            entity.Property(x => x.Attribute13).HasColumnName("attribute13").HasMaxLength(240);
            entity.Property(x => x.Attribute14).HasColumnName("attribute14").HasMaxLength(240);
            entity.Property(x => x.Attribute15).HasColumnName("attribute15").HasMaxLength(240);
            entity.Property(x => x.Attribute16).HasColumnName("attribute16").HasMaxLength(240);
            entity.Property(x => x.Attribute17).HasColumnName("attribute17").HasMaxLength(240);
            entity.Property(x => x.Attribute18).HasColumnName("attribute18").HasMaxLength(240);
            entity.Property(x => x.Attribute19).HasColumnName("attribute19").HasMaxLength(240);
            entity.Property(x => x.Attribute20).HasColumnName("attribute20").HasMaxLength(240);
            entity.HasIndex(x => new { x.FactoryId, x.OrderNumber }).IsUnique().HasDatabaseName("uq_prs_order_headers_order_number");
        });

        // SHIPPING METHOD
        modelBuilder.Entity<ShippingMethod>(entity =>
        {
            entity.ToTable("prs_shipping_methods_tb");
            entity.HasKey(x => x.ShippingMethodId);
            entity.Property(x => x.ShippingMethodId).HasColumnName("shipping_method_id").ValueGeneratedOnAdd();
            entity.Property(x => x.ShippingMethodCode).HasColumnName("shipping_method_code").HasMaxLength(50).IsRequired();
            entity.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            entity.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(x => x.CreationDate).HasColumnName("creation_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.CreatedBy).HasColumnName("created_by");
            entity.Property(x => x.LastUpdateDate).HasColumnName("last_update_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.LastUpdateBy).HasColumnName("last_update_by");
        });

        // PAYMENT TERM
        modelBuilder.Entity<PaymentTerm>(entity =>
        {
            entity.ToTable("prs_payment_terms_tb");
            entity.HasKey(x => x.PaymentTermId);
            entity.Property(x => x.PaymentTermId).HasColumnName("payment_term_id").ValueGeneratedOnAdd();
            entity.Property(x => x.PaymentTermCode).HasColumnName("payment_term_code").HasMaxLength(50).IsRequired();
            entity.Property(x => x.Prepayment).HasColumnName("prepayment").HasMaxLength(10).IsRequired();
            entity.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            entity.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(x => x.CreationDate).HasColumnName("creation_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.CreatedBy).HasColumnName("created_by");
            entity.Property(x => x.LastUpdateDate).HasColumnName("last_update_date").HasColumnType("timestamp without time zone");
            entity.Property(x => x.LastUpdateBy).HasColumnName("last_update_by");
        });

        // CURRENCY
        modelBuilder.Entity<Currency>(entity =>
        {
            entity.ToTable("prs_currencies_tb");
            entity.HasKey(x => x.CurrencyId);
            entity.Property(x => x.CurrencyId).HasColumnName("currency_id").ValueGeneratedOnAdd();
            entity.Property(x => x.CurrencyCode).HasColumnName("currency_code").HasMaxLength(100);
            entity.Property(x => x.CurrencyName).HasColumnName("currency_name").HasMaxLength(1000);
            entity.Property(x => x.Description).HasColumnName("description").HasMaxLength(100);
            entity.Property(x => x.LongDescription).HasColumnName("long_description").HasMaxLength(1000);
            entity.Property(x => x.CreationDate).HasColumnName("creation_date").HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnType("timestamp without time zone");
            entity.Property(x => x.CreatedBy).HasColumnName("created_by");
            entity.Property(x => x.LastUpdateDate).HasColumnName("last_update_date").HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnType("timestamp without time zone");
            entity.Property(x => x.LastUpdateBy).HasColumnName("last_update_by");
            entity.Property(x => x.Attribute1).HasColumnName("attribute1").HasMaxLength(100);
            entity.Property(x => x.Attribute2).HasColumnName("attribute2").HasMaxLength(100);
            entity.Property(x => x.Attribute3).HasColumnName("attribute3").HasMaxLength(100);
            entity.Property(x => x.Attribute4).HasColumnName("attribute4").HasMaxLength(100);
            entity.Property(x => x.Attribute5).HasColumnName("attribute5").HasMaxLength(100);
        });
    }
}
