using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Helpers;
using production_plan_api.Models;
using production_plan_api.Services;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/style-colors")]
[Authorize]
public class StyleColorsController : ControllerBase
{
    private readonly CustomerDbContext _context;
    private readonly CurrentUserService _currentUser;

    public StyleColorsController(
        CustomerDbContext context,
        CurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    // =========================================================
    // GET LIST
    //
    // GET /api/style-colors
    //
    // factoryId tạm giữ để tương thích frontend cũ.
    // DataScope thật luôn lấy từ JWT.
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] long? factoryId)
    {
        var currentFactoryId =
            _currentUser.FactoryId;

        if (
            currentFactoryId == null ||
            currentFactoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được nhà máy của người dùng đăng nhập."
            });
        }

        var scopedFactoryId =
            currentFactoryId.Value;

        if (
            factoryId.HasValue &&
            factoryId.Value > 0 &&
            factoryId.Value != scopedFactoryId)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy dữ liệu trong nhà máy hiện tại."
            });
        }

        var colors =
            await _context.StyleColors
                .AsNoTracking()
                .Where(x =>
                    x.FactoryId == scopedFactoryId)
                .OrderByDescending(x =>
                    x.Active)
                .ThenBy(x =>
                    x.ColorCode)
                .Select(x => new
                {
                    x.StyleColorId,
                    x.ColorCode,
                    x.ColorName,
                    x.ColorDesc,
                    x.FactoryId,
                    x.Active,

                    x.CreatedBy,
                    x.CreationDate,

                    x.LastUpdatedBy,
                    x.LastUpdateDate,

                    x.Attribute1,
                    x.Attribute2,
                    x.Attribute3,
                    x.Attribute4,
                    x.Attribute5,
                    x.Attribute6,
                    x.Attribute7,
                    x.Attribute8,
                    x.Attribute9,
                    x.Attribute10
                })
                .ToListAsync();

        return Ok(colors);
    }

    // =========================================================
    // GET DETAIL
    //
    // GET /api/style-colors/10
    // =========================================================

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(
        long id)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                message =
                    "Màu không hợp lệ."
            });
        }

        var factoryId =
            _currentUser.FactoryId;

        if (
            factoryId == null ||
            factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được nhà máy của người dùng đăng nhập."
            });
        }

        var color =
            await _context.StyleColors
                .AsNoTracking()
                .Where(x =>
                    x.StyleColorId == id &&
                    x.FactoryId == factoryId.Value)
                .Select(x => new
                {
                    x.StyleColorId,
                    x.ColorCode,
                    x.ColorName,
                    x.ColorDesc,
                    x.FactoryId,
                    x.Active,

                    x.CreatedBy,
                    x.CreationDate,

                    x.LastUpdatedBy,
                    x.LastUpdateDate,

                    x.Attribute1,
                    x.Attribute2,
                    x.Attribute3,
                    x.Attribute4,
                    x.Attribute5,
                    x.Attribute6,
                    x.Attribute7,
                    x.Attribute8,
                    x.Attribute9,
                    x.Attribute10
                })
                .FirstOrDefaultAsync();

        if (color == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy màu."
            });
        }

        return Ok(color);
    }

    // =========================================================
    // CREATE
    //
    // FactoryId lấy từ JWT.
    // request.FactoryId không quyết định DataScope.
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] SaveStyleColorRequest request)
    {
        var currentUserId =
            _currentUser.UserId;

        var factoryId =
            _currentUser.FactoryId;

        if (
            currentUserId == null ||
            factoryId == null ||
            factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập hoặc nhà máy."
            });
        }

        var scopedFactoryId =
            factoryId.Value;

        // =====================================================
        // COLOR CODE
        // =====================================================

        var colorCode =
            request.ColorCode?.Trim();

        if (string.IsNullOrWhiteSpace(
            colorCode))
        {
            return BadRequest(new
            {
                message =
                    "Mã màu không được để trống."
            });
        }

        if (colorCode.Length > 15)
        {
            return BadRequest(new
            {
                message =
                    "Mã màu không được vượt quá 15 ký tự."
            });
        }

        // =====================================================
        // CURRENT FACTORY
        // =====================================================

        var factoryExists =
            await _context.Factories
                .AsNoTracking()
                .AnyAsync(x =>
                    x.FactoryId == scopedFactoryId);

        if (!factoryExists)
        {
            return BadRequest(new
            {
                message =
                    "Nhà máy của người dùng đăng nhập không tồn tại."
            });
        }

        // =====================================================
        // DUPLICATE
        //
        // Unique:
        // FactoryId + ColorCode
        // =====================================================

        var normalizedCode =
            colorCode.ToUpper();

        var duplicate =
            await _context.StyleColors
                .AsNoTracking()
                .AnyAsync(x =>
                    x.FactoryId ==
                        scopedFactoryId &&
                    x.ColorCode.ToUpper() ==
                        normalizedCode);

        if (duplicate)
        {
            return Conflict(new
            {
                message =
                    $"Mã màu '{colorCode}' đã tồn tại trong nhà máy này."
            });
        }

        // =====================================================
        // CREATE
        // =====================================================

        var now =
            AppDateTime.Now;

        var color =
            new StyleColor
            {
                ColorCode =
                    colorCode,

                ColorName =
                    NormalizeNullable(
                        request.ColorName),

                ColorDesc =
                    NormalizeNullable(
                        request.ColorDesc),

                FactoryId =
                    scopedFactoryId,

                Active =
                    request.Active,

                CreatedBy =
                    currentUserId.Value,

                CreationDate =
                    now,

                LastUpdatedBy =
                    currentUserId.Value,

                LastUpdateDate =
                    now,

                Attribute1 =
                    NormalizeNullable(
                        request.Attribute1),

                Attribute2 =
                    NormalizeNullable(
                        request.Attribute2),

                Attribute3 =
                    NormalizeNullable(
                        request.Attribute3),

                Attribute4 =
                    NormalizeNullable(
                        request.Attribute4),

                Attribute5 =
                    NormalizeNullable(
                        request.Attribute5),

                Attribute6 =
                    NormalizeNullable(
                        request.Attribute6),

                Attribute7 =
                    NormalizeNullable(
                        request.Attribute7),

                Attribute8 =
                    NormalizeNullable(
                        request.Attribute8),

                Attribute9 =
                    NormalizeNullable(
                        request.Attribute9),

                Attribute10 =
                    NormalizeNullable(
                        request.Attribute10)
            };

        _context.StyleColors.Add(color);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    "Không thể tạo màu. Mã màu có thể đã tồn tại trong nhà máy."
            });
        }

        return Ok(new
        {
            message =
                "Tạo màu thành công.",

            styleColorId =
                color.StyleColorId
        });
    }

    // =========================================================
    // UPDATE
    //
    // PUT /api/style-colors/10
    //
    // Không cho chuyển StyleColor sang Factory khác.
    // =========================================================

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(
        long id,
        [FromBody] SaveStyleColorRequest request)
    {
        var currentUserId =
            _currentUser.UserId;

        var factoryId =
            _currentUser.FactoryId;

        if (
            currentUserId == null ||
            factoryId == null ||
            factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập hoặc nhà máy."
            });
        }

        if (id <= 0)
        {
            return BadRequest(new
            {
                message =
                    "Màu không hợp lệ."
            });
        }

        var scopedFactoryId =
            factoryId.Value;

        // =====================================================
        // FIND INSIDE CURRENT FACTORY
        // =====================================================

        var color =
            await _context.StyleColors
                .FirstOrDefaultAsync(x =>
                    x.StyleColorId == id &&
                    x.FactoryId == scopedFactoryId);

        if (color == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy màu."
            });
        }

        // =====================================================
        // COLOR CODE
        // =====================================================

        var colorCode =
            request.ColorCode?.Trim();

        if (string.IsNullOrWhiteSpace(
            colorCode))
        {
            return BadRequest(new
            {
                message =
                    "Mã màu không được để trống."
            });
        }

        if (colorCode.Length > 15)
        {
            return BadRequest(new
            {
                message =
                    "Mã màu không được vượt quá 15 ký tự."
            });
        }

        // =====================================================
        // CURRENT FACTORY
        // =====================================================

        var factoryExists =
            await _context.Factories
                .AsNoTracking()
                .AnyAsync(x =>
                    x.FactoryId == scopedFactoryId);

        if (!factoryExists)
        {
            return BadRequest(new
            {
                message =
                    "Nhà máy của người dùng đăng nhập không tồn tại."
            });
        }

        // =====================================================
        // DUPLICATE INSIDE CURRENT FACTORY
        // =====================================================

        var normalizedCode =
            colorCode.ToUpper();

        var duplicate =
            await _context.StyleColors
                .AsNoTracking()
                .AnyAsync(x =>
                    x.StyleColorId != id &&
                    x.FactoryId ==
                        scopedFactoryId &&
                    x.ColorCode.ToUpper() ==
                        normalizedCode);

        if (duplicate)
        {
            return Conflict(new
            {
                message =
                    $"Mã màu '{colorCode}' đã tồn tại trong nhà máy này."
            });
        }

        // =====================================================
        // UPDATE
        //
        // FactoryId KHÔNG được update.
        // =====================================================

        color.ColorCode =
            colorCode;

        color.ColorName =
            NormalizeNullable(
                request.ColorName);

        color.ColorDesc =
            NormalizeNullable(
                request.ColorDesc);

        color.Active =
            request.Active;

        color.Attribute1 =
            NormalizeNullable(
                request.Attribute1);

        color.Attribute2 =
            NormalizeNullable(
                request.Attribute2);

        color.Attribute3 =
            NormalizeNullable(
                request.Attribute3);

        color.Attribute4 =
            NormalizeNullable(
                request.Attribute4);

        color.Attribute5 =
            NormalizeNullable(
                request.Attribute5);

        color.Attribute6 =
            NormalizeNullable(
                request.Attribute6);

        color.Attribute7 =
            NormalizeNullable(
                request.Attribute7);

        color.Attribute8 =
            NormalizeNullable(
                request.Attribute8);

        color.Attribute9 =
            NormalizeNullable(
                request.Attribute9);

        color.Attribute10 =
            NormalizeNullable(
                request.Attribute10);

        color.LastUpdatedBy =
            currentUserId.Value;

        color.LastUpdateDate =
            AppDateTime.Now;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    "Không thể cập nhật màu. Mã màu có thể đã tồn tại trong nhà máy."
            });
        }

        return Ok(new
        {
            message =
                "Cập nhật màu thành công."
        });
    }

    // =========================================================
    // CHANGE STATUS
    //
    // PUT /api/style-colors/10/status
    // =========================================================

    [HttpPut("{id:long}/status")]
    public async Task<IActionResult> ChangeStatus(
        long id,
        [FromBody] ChangeStyleColorStatusRequest request)
    {
        var currentUserId =
            _currentUser.UserId;

        var factoryId =
            _currentUser.FactoryId;

        if (
            currentUserId == null ||
            factoryId == null ||
            factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập hoặc nhà máy."
            });
        }

        if (id <= 0)
        {
            return BadRequest(new
            {
                message =
                    "Màu không hợp lệ."
            });
        }

        var color =
            await _context.StyleColors
                .FirstOrDefaultAsync(x =>
                    x.StyleColorId == id &&
                    x.FactoryId == factoryId.Value);

        if (color == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy màu."
            });
        }

        color.Active =
            request.Active;

        color.LastUpdatedBy =
            currentUserId.Value;

        color.LastUpdateDate =
            AppDateTime.Now;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                request.Active
                    ? "Đã kích hoạt màu."
                    : "Đã ngừng sử dụng màu."
        });
    }

    // =========================================================
    // DELETE
    //
    // DELETE /api/style-colors/10
    // =========================================================

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(
        long id)
    {
        var factoryId =
            _currentUser.FactoryId;

        if (
            factoryId == null ||
            factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được nhà máy của người dùng đăng nhập."
            });
        }

        if (id <= 0)
        {
            return BadRequest(new
            {
                message =
                    "Màu không hợp lệ."
            });
        }

        var color =
            await _context.StyleColors
                .FirstOrDefaultAsync(x =>
                    x.StyleColorId == id &&
                    x.FactoryId == factoryId.Value);

        if (color == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy màu."
            });
        }

        _context.StyleColors.Remove(color);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    "Không thể xóa màu vì dữ liệu này đang được sử dụng. Hãy chuyển sang trạng thái ngừng sử dụng."
            });
        }

        return Ok(new
        {
            message =
                "Xóa màu thành công."
        });
    }

    // =========================================================
    // NORMALIZE STRING
    // =========================================================

    private static string? NormalizeNullable(
        string? value)
    {
        if (string.IsNullOrWhiteSpace(
            value))
        {
            return null;
        }

        return value.Trim();
    }
}

// =========================================================
// REQUEST MODELS
// =========================================================

public class SaveStyleColorRequest
{
    public string ColorCode { get; set; } =
        "";

    public string? ColorName { get; set; }

    public string? ColorDesc { get; set; }

    // Giữ tạm để không phá frontend cũ.
    // Backend không dùng field này làm DataScope.
    public long FactoryId { get; set; }

    public bool Active { get; set; } =
        true;

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

public class ChangeStyleColorStatusRequest
{
    public bool Active { get; set; }
}
