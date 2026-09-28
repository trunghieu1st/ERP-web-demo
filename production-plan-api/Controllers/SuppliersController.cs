using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Helpers;
using production_plan_api.Models;
using production_plan_api.Services;

namespace production_plan_api.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN")]
[Route("api/suppliers")]
public class SuppliersController : ControllerBase
{
    private readonly CustomerDbContext _context;
    private readonly CurrentUserService _currentUser;

    public SuppliersController(
        CustomerDbContext context,
        CurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    // ============================================================
    // GET ALL SUPPLIERS
    // Chỉ lấy Supplier thuộc Factory hiện tại
    // ============================================================

    [HttpGet]
    public async Task<IActionResult> GetSuppliers()
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null || factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message = "Không xác định được Factory của tài khoản."
            });
        }

        var suppliers = await _context.Suppliers
            .AsNoTracking()
            .Where(x => x.FactoryId == factoryId.Value)
            .Join(
                _context.Factories.AsNoTracking(),
                supplier => supplier.FactoryId,
                factory => factory.FactoryId,
                (supplier, factory) => new
                {
                    supplierId = supplier.SupplierId,
                    supplierCode = supplier.SupplierCode,
                    supplierName = supplier.SupplierName,

                    countryCode = supplier.CountryCode,
                    address = supplier.Address,
                    phoneNumber = supplier.PhoneNumber,
                    email = supplier.Email,

                    description = supplier.Description,
                    longDescription = supplier.LongDescription,

                    factoryId = supplier.FactoryId,
                    factoryName = factory.FactoryName,

                    isActive = supplier.IsActive,

                    creationDate = supplier.CreationDate,
                    createdBy = supplier.CreatedBy,
                    lastUpdateDate = supplier.LastUpdateDate,
                    lastUpdateBy = supplier.LastUpdateBy
                })
            .OrderBy(x => x.supplierId)
            .ToListAsync();

        return Ok(suppliers);
    }

    // ============================================================
    // GET SUPPLIER BY ID
    // ============================================================

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetSupplier(long id)
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null || factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message = "Không xác định được Factory của tài khoản."
            });
        }

        var supplier = await _context.Suppliers
            .AsNoTracking()
            .Where(x =>
                x.SupplierId == id &&
                x.FactoryId == factoryId.Value)
            .Select(x => new
            {
                supplierId = x.SupplierId,
                supplierCode = x.SupplierCode,
                supplierName = x.SupplierName,

                countryCode = x.CountryCode,
                address = x.Address,
                phoneNumber = x.PhoneNumber,
                email = x.Email,

                description = x.Description,
                longDescription = x.LongDescription,

                factoryId = x.FactoryId,
                isActive = x.IsActive,

                creationDate = x.CreationDate,
                createdBy = x.CreatedBy,
                lastUpdateDate = x.LastUpdateDate,
                lastUpdateBy = x.LastUpdateBy
            })
            .FirstOrDefaultAsync();

        if (supplier == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhà cung cấp."
            });
        }

        return Ok(supplier);
    }

    // ============================================================
    // CREATE SUPPLIER
    // FactoryId lấy từ JWT
    // ============================================================

    [HttpPost]
    public async Task<IActionResult> CreateSupplier(
        [FromBody] CreateSupplierRequest request)
    {
        var userId = _currentUser.UserId;
        var factoryId = _currentUser.FactoryId;

        if (userId == null || factoryId == null || factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập hoặc Factory."
            });
        }

        // 1. Validate Supplier Code
        if (string.IsNullOrWhiteSpace(request.SupplierCode))
        {
            return BadRequest(new
            {
                message = "Mã nhà cung cấp không được để trống."
            });
        }

        // 2. Validate Supplier Name
        if (string.IsNullOrWhiteSpace(request.SupplierName))
        {
            return BadRequest(new
            {
                message = "Tên nhà cung cấp không được để trống."
            });
        }

        // 3. Factory của user phải còn active
        var factoryExists = await _context.Factories
            .AsNoTracking()
            .AnyAsync(x =>
                x.FactoryId == factoryId.Value &&
                x.IsActive);

        if (!factoryExists)
        {
            return BadRequest(new
            {
                message = "Factory không tồn tại hoặc đã bị khóa."
            });
        }

        var supplierCode = request.SupplierCode.Trim();

        // 4. Supplier Code unique trong Factory
        var supplierExists = await _context.Suppliers
            .AnyAsync(x =>
                x.FactoryId == factoryId.Value &&
                x.SupplierCode == supplierCode);

        if (supplierExists)
        {
            return Conflict(new
            {
                message =
                    "Mã nhà cung cấp đã tồn tại trong Factory này."
            });
        }

        // 5. Create
        var now = AppDateTime.Now;

        var supplier = new Supplier
        {
            SupplierCode = supplierCode,
            SupplierName = request.SupplierName.Trim(),

            CountryCode = request.CountryCode?.Trim(),
            Address = request.Address?.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            Email = request.Email?.Trim(),

            Description = request.Description?.Trim(),
            LongDescription = request.LongDescription?.Trim(),

            // Không tin FactoryId client gửi
            FactoryId = factoryId.Value,

            IsActive = request.IsActive,

            CreationDate = now,
            CreatedBy = userId.Value,

            LastUpdateDate = now,
            LastUpdateBy = userId.Value
        };

        _context.Suppliers.Add(supplier);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Tạo nhà cung cấp thành công.",
            supplierId = supplier.SupplierId
        });
    }

    // ============================================================
    // UPDATE SUPPLIER
    // Chỉ update Supplier thuộc Factory hiện tại
    // ============================================================

    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdateSupplier(
        long id,
        [FromBody] UpdateSupplierRequest request)
    {
        var userId = _currentUser.UserId;
        var factoryId = _currentUser.FactoryId;

        if (userId == null || factoryId == null || factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập hoặc Factory."
            });
        }

        // 1. Supplier phải thuộc Factory hiện tại
        var supplier = await _context.Suppliers
            .FirstOrDefaultAsync(x =>
                x.SupplierId == id &&
                x.FactoryId == factoryId.Value);

        if (supplier == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhà cung cấp."
            });
        }

        // 2. Validate Supplier Code
        if (string.IsNullOrWhiteSpace(request.SupplierCode))
        {
            return BadRequest(new
            {
                message = "Mã nhà cung cấp không được để trống."
            });
        }

        // 3. Validate Supplier Name
        if (string.IsNullOrWhiteSpace(request.SupplierName))
        {
            return BadRequest(new
            {
                message = "Tên nhà cung cấp không được để trống."
            });
        }

        // 4. Factory hiện tại phải active
        var factoryExists = await _context.Factories
            .AsNoTracking()
            .AnyAsync(x =>
                x.FactoryId == factoryId.Value &&
                x.IsActive);

        if (!factoryExists)
        {
            return BadRequest(new
            {
                message = "Factory không tồn tại hoặc đã bị khóa."
            });
        }

        var supplierCode = request.SupplierCode.Trim();

        // 5. Check duplicate trong cùng Factory
        var supplierCodeExists = await _context.Suppliers
            .AnyAsync(x =>
                x.FactoryId == factoryId.Value &&
                x.SupplierCode == supplierCode &&
                x.SupplierId != id);

        if (supplierCodeExists)
        {
            return Conflict(new
            {
                message =
                    "Mã nhà cung cấp đã tồn tại trong Factory này."
            });
        }

        // 6. Update
        supplier.SupplierCode = supplierCode;
        supplier.SupplierName = request.SupplierName.Trim();

        supplier.CountryCode = request.CountryCode?.Trim();
        supplier.Address = request.Address?.Trim();
        supplier.PhoneNumber = request.PhoneNumber?.Trim();
        supplier.Email = request.Email?.Trim();

        supplier.Description = request.Description?.Trim();
        supplier.LongDescription = request.LongDescription?.Trim();

        // KHÔNG update FactoryId.
        // Supplier không được chuyển sang Factory khác bằng request.

        supplier.IsActive = request.IsActive;

        supplier.LastUpdateDate = AppDateTime.Now;
        supplier.LastUpdateBy = userId.Value;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Cập nhật nhà cung cấp thành công."
        });
    }

    // ============================================================
    // DELETE SUPPLIER
    // Chỉ xóa Supplier thuộc Factory hiện tại
    // ============================================================

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteSupplier(long id)
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null || factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message = "Không xác định được Factory của tài khoản."
            });
        }

        var supplier = await _context.Suppliers
            .FirstOrDefaultAsync(x =>
                x.SupplierId == id &&
                x.FactoryId == factoryId.Value);

        if (supplier == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhà cung cấp."
            });
        }

        _context.Suppliers.Remove(supplier);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Xóa nhà cung cấp thành công."
        });
    }
}

// ============================================================
// REQUEST MODELS
//
// FactoryId tạm giữ để không phá frontend hiện tại.
// Backend KHÔNG sử dụng FactoryId client gửi.
// Sau này frontend bỏ field này thì backend cũng xóa.
// ============================================================

public class CreateSupplierRequest
{
    public string? SupplierCode { get; set; }

    public string? SupplierName { get; set; }

    public string? CountryCode { get; set; }

    public string? Address { get; set; }

    public string? PhoneNumber { get; set; }

    public string? Email { get; set; }

    public string? Description { get; set; }

    public string? LongDescription { get; set; }

    public long? FactoryId { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UpdateSupplierRequest
{
    public string? SupplierCode { get; set; }

    public string? SupplierName { get; set; }

    public string? CountryCode { get; set; }

    public string? Address { get; set; }

    public string? PhoneNumber { get; set; }

    public string? Email { get; set; }

    public string? Description { get; set; }

    public string? LongDescription { get; set; }

    public long? FactoryId { get; set; }

    public bool IsActive { get; set; } = true;
}