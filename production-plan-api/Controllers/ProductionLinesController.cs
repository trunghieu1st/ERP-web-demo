using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Helpers;
using production_plan_api.Models;
using production_plan_api.Services;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/production-lines")]
[Authorize]
public class ProductionLinesController : ControllerBase
{
    private readonly CustomerDbContext _context;
    private readonly CurrentUserService _currentUser;

    public ProductionLinesController(
        CustomerDbContext context,
        CurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    // =========================================================
    // GET: api/production-lines
    //
    // Chỉ lấy chuyền thuộc Factory của user đăng nhập
    // =========================================================
    [HttpGet]
    public async Task<IActionResult> GetProductionLines()
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được Factory của người dùng."
            });
        }

        var lines = await _context.ProductionLines
            .AsNoTracking()
            .Where(x =>
                x.FactoryId == factoryId.Value &&
                x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.ProductionLineId)
            .Select(x => new
            {
                productionLineId = x.ProductionLineId,
                factoryId = x.FactoryId,
                lineCode = x.LineCode,
                lineName = x.LineName,
                isActive = x.IsActive,
                sortOrder = x.SortOrder
            })
            .ToListAsync();

        return Ok(lines);
    }

    // =========================================================
    // GET: api/production-lines/factory/{factoryId}
    //
    // Giữ route cũ để không làm hỏng frontend.
    // Nhưng chỉ cho truy cập Factory của chính user.
    // =========================================================
    [HttpGet("factory/{factoryId:long}")]
    public async Task<IActionResult> GetProductionLinesByFactory(
        long factoryId)
    {
        var currentFactoryId = _currentUser.FactoryId;

        if (currentFactoryId == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được Factory của người dùng."
            });
        }

        // Không cho client dùng route này để đọc Factory khác.
        if (factoryId != currentFactoryId.Value)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhà máy."
            });
        }

        var factoryExists = await _context.Factories
            .AsNoTracking()
            .AnyAsync(x =>
                x.FactoryId == currentFactoryId.Value &&
                x.IsActive);

        if (!factoryExists)
        {
            return NotFound(new
            {
                message =
                    "Nhà máy không tồn tại hoặc đã ngừng sử dụng."
            });
        }

        var lines = await _context.ProductionLines
            .AsNoTracking()
            .Where(x =>
                x.FactoryId == currentFactoryId.Value &&
                x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.ProductionLineId)
            .Select(x => new
            {
                productionLineId = x.ProductionLineId,
                factoryId = x.FactoryId,
                lineCode = x.LineCode,
                lineName = x.LineName,
                isActive = x.IsActive,
                sortOrder = x.SortOrder
            })
            .ToListAsync();

        return Ok(lines);
    }

    // =========================================================
    // GET: api/production-lines/{id}
    //
    // Chỉ đọc chuyền thuộc Factory hiện tại
    // =========================================================
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetProductionLine(long id)
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được Factory của người dùng."
            });
        }

        var line = await _context.ProductionLines
            .AsNoTracking()
            .Where(x =>
                x.ProductionLineId == id &&
                x.FactoryId == factoryId.Value)
            .Select(x => new
            {
                productionLineId = x.ProductionLineId,
                factoryId = x.FactoryId,
                lineCode = x.LineCode,
                lineName = x.LineName,
                isActive = x.IsActive,
                sortOrder = x.SortOrder
            })
            .FirstOrDefaultAsync();

        if (line == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy chuyền sản xuất."
            });
        }

        return Ok(line);
    }

    // =========================================================
    // POST: api/production-lines
    //
    // FactoryId luôn lấy từ JWT.
    // Không sử dụng FactoryId client gửi.
    // =========================================================
    [HttpPost]
    public async Task<IActionResult> CreateProductionLine(
        [FromBody] ProductionLineRequest request)
    {
        var userId = _currentUser.UserId;
        var factoryId = _currentUser.FactoryId;

        if (userId == null || factoryId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập hoặc Factory."
            });
        }

        // -----------------------------------------------------
        // Validate Factory hiện tại
        // -----------------------------------------------------

        var factoryExists = await _context.Factories
            .AsNoTracking()
            .AnyAsync(x =>
                x.FactoryId == factoryId.Value &&
                x.IsActive);

        if (!factoryExists)
        {
            return BadRequest(new
            {
                message =
                    "Nhà máy không tồn tại hoặc đã ngừng sử dụng."
            });
        }

        // -----------------------------------------------------
        // Validate Line Code
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(request.LineCode))
        {
            return BadRequest(new
            {
                message = "Mã chuyền không được để trống."
            });
        }

        // -----------------------------------------------------
        // Validate Line Name
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(request.LineName))
        {
            return BadRequest(new
            {
                message = "Tên chuyền không được để trống."
            });
        }

        var lineCode = request.LineCode.Trim();

        // -----------------------------------------------------
        // Không cho trùng mã chuyền trong cùng Factory
        // -----------------------------------------------------

        var duplicate = await _context.ProductionLines
            .AnyAsync(x =>
                x.FactoryId == factoryId.Value &&
                x.LineCode == lineCode);

        if (duplicate)
        {
            return Conflict(new
            {
                message =
                    "Mã chuyền đã tồn tại trong nhà máy này."
            });
        }

        // -----------------------------------------------------
        // Tạo mới
        // -----------------------------------------------------

        var now = AppDateTime.Now;

        var productionLine = new ProductionLine
        {
            FactoryId = factoryId.Value,

            LineCode = lineCode,

            LineName = request.LineName.Trim(),

            IsActive = true,

            SortOrder = request.SortOrder,

            CreationDate = now,

            LastUpdateDate = now,

            LastUpdateBy = userId.Value
        };

        _context.ProductionLines.Add(productionLine);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            productionLineId =
                productionLine.ProductionLineId,

            factoryId =
                productionLine.FactoryId,

            lineCode =
                productionLine.LineCode,

            lineName =
                productionLine.LineName,

            isActive =
                productionLine.IsActive,

            sortOrder =
                productionLine.SortOrder
        });
    }

    // =========================================================
    // PUT: api/production-lines/{id}
    //
    // Không cho sửa chuyền Factory khác.
    // Không cho chuyển chuyền sang Factory khác.
    // =========================================================
    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdateProductionLine(
        long id,
        [FromBody] ProductionLineRequest request)
    {
        var userId = _currentUser.UserId;
        var factoryId = _currentUser.FactoryId;

        if (userId == null || factoryId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập hoặc Factory."
            });
        }

        // -----------------------------------------------------
        // Tìm chuyền trong đúng Factory
        // -----------------------------------------------------

        var productionLine = await _context.ProductionLines
            .FirstOrDefaultAsync(x =>
                x.ProductionLineId == id &&
                x.FactoryId == factoryId.Value);

        if (productionLine == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy chuyền sản xuất."
            });
        }

        // -----------------------------------------------------
        // Validate Factory hiện tại
        // -----------------------------------------------------

        var factoryExists = await _context.Factories
            .AsNoTracking()
            .AnyAsync(x =>
                x.FactoryId == factoryId.Value &&
                x.IsActive);

        if (!factoryExists)
        {
            return BadRequest(new
            {
                message =
                    "Nhà máy không tồn tại hoặc đã ngừng sử dụng."
            });
        }

        // -----------------------------------------------------
        // Validate Line Code
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(request.LineCode))
        {
            return BadRequest(new
            {
                message = "Mã chuyền không được để trống."
            });
        }

        // -----------------------------------------------------
        // Validate Line Name
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(request.LineName))
        {
            return BadRequest(new
            {
                message = "Tên chuyền không được để trống."
            });
        }

        var lineCode = request.LineCode.Trim();

        // -----------------------------------------------------
        // Không cho trùng mã trong cùng Factory
        // -----------------------------------------------------

        var duplicate = await _context.ProductionLines
            .AnyAsync(x =>
                x.ProductionLineId != id &&
                x.FactoryId == factoryId.Value &&
                x.LineCode == lineCode);

        if (duplicate)
        {
            return Conflict(new
            {
                message =
                    "Mã chuyền đã tồn tại trong nhà máy này."
            });
        }

        // -----------------------------------------------------
        // Update
        //
        // KHÔNG update FactoryId.
        // -----------------------------------------------------

        productionLine.LineCode = lineCode;

        productionLine.LineName =
            request.LineName.Trim();

        productionLine.SortOrder =
            request.SortOrder;

        productionLine.LastUpdateDate =
            AppDateTime.Now;

        productionLine.LastUpdateBy =
            userId.Value;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            productionLineId =
                productionLine.ProductionLineId,

            factoryId =
                productionLine.FactoryId,

            lineCode =
                productionLine.LineCode,

            lineName =
                productionLine.LineName,

            isActive =
                productionLine.IsActive,

            sortOrder =
                productionLine.SortOrder
        });
    }

    // =========================================================
    // DELETE: api/production-lines/{id}
    //
    // Soft delete
    // Chỉ được xóa chuyền thuộc Factory hiện tại.
    // =========================================================
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteProductionLine(long id)
    {
        var userId = _currentUser.UserId;
        var factoryId = _currentUser.FactoryId;

        if (userId == null || factoryId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập hoặc Factory."
            });
        }

        var productionLine = await _context.ProductionLines
            .FirstOrDefaultAsync(x =>
                x.ProductionLineId == id &&
                x.FactoryId == factoryId.Value);

        if (productionLine == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy chuyền sản xuất."
            });
        }

        productionLine.IsActive = false;

        productionLine.LastUpdateDate =
            AppDateTime.Now;

        productionLine.LastUpdateBy =
            userId.Value;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Đã ngừng sử dụng chuyền sản xuất."
        });
    }
}

// =========================================================
// REQUEST MODEL
//
// FactoryId tạm thời giữ lại để không phá frontend cũ.
// Backend KHÔNG sử dụng giá trị này để quyết định Factory.
// Có thể xóa property này sau khi frontend không còn gửi nó.
// =========================================================
public class ProductionLineRequest
{
    public long FactoryId { get; set; }

    public string LineCode { get; set; } = "";

    public string LineName { get; set; } = "";

    public int SortOrder { get; set; } = 0;
}
