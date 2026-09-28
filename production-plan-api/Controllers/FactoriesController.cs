
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Helpers;
using production_plan_api.Models;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/factories")]
[Authorize(Roles = "ADMIN")]
public class FactoriesController : ControllerBase
{
    private readonly CustomerDbContext _context;

    public FactoriesController(CustomerDbContext context)
    {
        _context = context;
    }

    private long? GetCurrentUserId()
    {
        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (long.TryParse(userIdValue, out var userId))
        {
            return userId;
        }

        return null;
    }


    // =========================================================
    // GET: api/factories
    // Lấy danh sách nhà máy đang hoạt động
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetFactories()
    {
        var factories = await _context.Factories
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.FactoryId)
            .Select(x => new
            {
                factoryId = x.FactoryId,
                factoryCode = x.FactoryCode,
                factoryName = x.FactoryName,
                isActive = x.IsActive
            })
            .ToListAsync();

        return Ok(factories);
    }


    // =========================================================
    // GET: api/factories/{id}
    // =========================================================

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetFactory(long id)
    {
        var factory = await _context.Factories
            .AsNoTracking()
            .Where(x => x.FactoryId == id)
            .Select(x => new
            {
                factoryId = x.FactoryId,
                factoryCode = x.FactoryCode,
                factoryName = x.FactoryName,
                isActive = x.IsActive
            })
            .FirstOrDefaultAsync();

        if (factory == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhà máy."
            });
        }

        return Ok(factory);
    }


    // =========================================================
    // POST: api/factories
    // Thêm nhà máy
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> CreateFactory(
        [FromBody] FactoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FactoryCode))
        {
            return BadRequest(new
            {
                message = "Mã nhà máy không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(request.FactoryName))
        {
            return BadRequest(new
            {
                message = "Tên nhà máy không được để trống."
            });
        }

        var factoryCode = request.FactoryCode.Trim();

        var exists = await _context.Factories
            .AnyAsync(x => x.FactoryCode == factoryCode);

        if (exists)
        {
            return Conflict(new
            {
                message = $"Mã nhà máy '{factoryCode}' đã tồn tại."
            });
        }

        var currentUserId = GetCurrentUserId();

        if (currentUserId == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        var factory = new Factory
        {
            FactoryCode = factoryCode,
            FactoryName = request.FactoryName.Trim(),
            IsActive = true,
            CreationDate = AppDateTime.Now,// AppDateTime.Now,
            CreatedBy = currentUserId.Value,
            LastUpdateDate = AppDateTime.Now,
            LastUpdateBy = currentUserId.Value
        };

        _context.Factories.Add(factory);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetFactory),
            new { id = factory.FactoryId },
            new
            {
                factoryId = factory.FactoryId,
                factoryCode = factory.FactoryCode,
                factoryName = factory.FactoryName,
                isActive = factory.IsActive
            });
    }


    // =========================================================
    // PUT: api/factories/{id}
    // Sửa nhà máy
    // =========================================================

    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdateFactory(
        long id,
        [FromBody] FactoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FactoryCode))
        {
            return BadRequest(new
            {
                message = "Mã nhà máy không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(request.FactoryName))
        {
            return BadRequest(new
            {
                message = "Tên nhà máy không được để trống."
            });
        }

        var factory = await _context.Factories
            .FirstOrDefaultAsync(x => x.FactoryId == id);

        if (factory == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhà máy."
            });
        }

        var factoryCode = request.FactoryCode.Trim();

        var duplicate = await _context.Factories
            .AnyAsync(x =>
                x.FactoryCode == factoryCode &&
                x.FactoryId != id);

        if (duplicate)
        {
            return Conflict(new
            {
                message = $"Mã nhà máy '{factoryCode}' đã tồn tại."
            });
        }

        factory.FactoryCode = factoryCode;
        factory.FactoryName = request.FactoryName.Trim();
        factory.LastUpdateDate = AppDateTime.Now;

        var currentUserId = GetCurrentUserId();

        if (currentUserId == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        factory.LastUpdateBy = currentUserId.Value;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            factoryId = factory.FactoryId,
            factoryCode = factory.FactoryCode,
            factoryName = factory.FactoryName,
            isActive = factory.IsActive
        });
    }


    // =========================================================
    // DELETE: api/factories/{id}
    // Không xóa vật lý.
    // Chỉ chuyển IS_ACTIVE = 0
    // =========================================================

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteFactory(long id)
    {
        var factory = await _context.Factories
            .FirstOrDefaultAsync(x => x.FactoryId == id);

        if (factory == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhà máy."
            });
        }

        factory.IsActive = false;
        factory.LastUpdateDate = AppDateTime.Now;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Đã khóa nhà máy.",
            factoryId = factory.FactoryId
        });
    }
}


// =========================================================
// REQUEST MODEL
// =========================================================

public class FactoryRequest
{
    public string FactoryCode { get; set; } = "";

    public string FactoryName { get; set; } = "";
}
