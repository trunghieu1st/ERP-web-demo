using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Helpers;
using production_plan_api.Models;
using production_plan_api.Services;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/material-colors")]
[Authorize]
public class MaterialColorsController : ControllerBase
{
    private readonly CustomerDbContext _context;
    private readonly CurrentUserService _currentUser;

    public MaterialColorsController(
        CustomerDbContext context,
        CurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    // =========================================================
    // GET LIST
    //
    // GET /api/material-colors
    //
    // factoryId có thể vẫn được frontend cũ gửi lên,
    // nhưng backend KHÔNG dùng nó để quyết định DataScope.
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

        // Giữ compatibility với frontend cũ.
        // Nếu client cố truyền factory khác JWT thì không cho phép.
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
            await _context.MaterialColors
                .AsNoTracking()
                .Where(x =>
                    x.FactoryId == scopedFactoryId)
                .OrderByDescending(x =>
                    x.Active)
                .ThenBy(x =>
                    x.ColorCode)
                .Select(x => new
                {
                    x.MtlColorId,
                    x.ColorCode,
                    x.ColorName,
                    x.ColorDesc,
                    x.FactoryId,
                    x.Active,

                    x.CreatedBy,
                    x.CreationDate,

                    x.LastUpdatedBy,
                    x.LastUpdateDate
                })
                .ToListAsync();

        return Ok(colors);
    }

    // =========================================================
    // GET DETAIL
    //
    // GET /api/material-colors/10
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
                    "Màu nguyên liệu không hợp lệ."
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
            await _context.MaterialColors
                .AsNoTracking()
                .Where(x =>
                    x.MtlColorId == id &&
                    x.FactoryId == factoryId.Value)
                .Select(x => new
                {
                    x.MtlColorId,
                    x.ColorCode,
                    x.ColorName,
                    x.ColorDesc,
                    x.FactoryId,
                    x.Active,

                    x.CreatedBy,
                    x.CreationDate,

                    x.LastUpdatedBy,
                    x.LastUpdateDate
                })
                .FirstOrDefaultAsync();

        if (color == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy màu nguyên liệu."
            });
        }

        return Ok(color);
    }

    // =========================================================
    // CREATE
    //
    // FactoryId luôn lấy từ JWT.
    // request.FactoryId không được tin cậy.
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] SaveMaterialColorRequest request)
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

        if (colorCode.Length > 30)
        {
            return BadRequest(new
            {
                message =
                    "Mã màu không được vượt quá 30 ký tự."
            });
        }

        // =====================================================
        // NAME / DESCRIPTION
        // =====================================================

        var colorName =
            NormalizeNullable(
                request.ColorName);

        var colorDesc =
            NormalizeNullable(
                request.ColorDesc);

        if (
            colorName != null &&
            colorName.Length > 250)
        {
            return BadRequest(new
            {
                message =
                    "Tên màu không được vượt quá 250 ký tự."
            });
        }

        if (
            colorDesc != null &&
            colorDesc.Length > 250)
        {
            return BadRequest(new
            {
                message =
                    "Mô tả màu không được vượt quá 250 ký tự."
            });
        }

        // =====================================================
        // CURRENT FACTORY MUST EXIST
        // =====================================================

        var factoryExists =
            await _context.Factories
                .AsNoTracking()
                .AnyAsync(x =>
                    x.FactoryId ==
                    scopedFactoryId);

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
            await _context.MaterialColors
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
            new MaterialColor
            {
                ColorCode =
                    colorCode,

                ColorName =
                    colorName,

                ColorDesc =
                    colorDesc,

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
                    now
            };

        _context.MaterialColors.Add(
            color);

        try
        {
            await _context
                .SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    "Không thể tạo màu nguyên liệu. Mã màu có thể đã tồn tại trong nhà máy."
            });
        }

        return Ok(new
        {
            message =
                "Tạo màu nguyên liệu thành công.",

            mtlColorId =
                color.MtlColorId
        });
    }

    // =========================================================
    // UPDATE
    //
    // PUT /api/material-colors/10
    //
    // Không cho chuyển record sang Factory khác.
    // =========================================================

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(
        long id,
        [FromBody] SaveMaterialColorRequest request)
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
                    "Màu nguyên liệu không hợp lệ."
            });
        }

        var scopedFactoryId =
            factoryId.Value;

        // =====================================================
        // FIND INSIDE CURRENT FACTORY ONLY
        // =====================================================

        var color =
            await _context.MaterialColors
                .FirstOrDefaultAsync(x =>
                    x.MtlColorId == id &&
                    x.FactoryId == scopedFactoryId);

        if (color == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy màu nguyên liệu."
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

        if (colorCode.Length > 30)
        {
            return BadRequest(new
            {
                message =
                    "Mã màu không được vượt quá 30 ký tự."
            });
        }

        // =====================================================
        // NAME / DESCRIPTION
        // =====================================================

        var colorName =
            NormalizeNullable(
                request.ColorName);

        var colorDesc =
            NormalizeNullable(
                request.ColorDesc);

        if (
            colorName != null &&
            colorName.Length > 250)
        {
            return BadRequest(new
            {
                message =
                    "Tên màu không được vượt quá 250 ký tự."
            });
        }

        if (
            colorDesc != null &&
            colorDesc.Length > 250)
        {
            return BadRequest(new
            {
                message =
                    "Mô tả màu không được vượt quá 250 ký tự."
            });
        }

        // =====================================================
        // CURRENT FACTORY MUST EXIST
        // =====================================================

        var factoryExists =
            await _context.Factories
                .AsNoTracking()
                .AnyAsync(x =>
                    x.FactoryId ==
                    scopedFactoryId);

        if (!factoryExists)
        {
            return BadRequest(new
            {
                message =
                    "Nhà máy của người dùng đăng nhập không tồn tại."
            });
        }

        // =====================================================
        // CHECK DUPLICATE INSIDE CURRENT FACTORY
        // =====================================================

        var normalizedCode =
            colorCode.ToUpper();

        var duplicate =
            await _context.MaterialColors
                .AsNoTracking()
                .AnyAsync(x =>
                    x.MtlColorId != id &&
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
        // Không update FactoryId.
        // =====================================================

        color.ColorCode =
            colorCode;

        color.ColorName =
            colorName;

        color.ColorDesc =
            colorDesc;

        color.Active =
            request.Active;

        color.LastUpdatedBy =
            currentUserId.Value;

        color.LastUpdateDate =
            AppDateTime.Now;

        try
        {
            await _context
                .SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    "Không thể cập nhật màu nguyên liệu. Mã màu có thể đã tồn tại trong nhà máy."
            });
        }

        return Ok(new
        {
            message =
                "Cập nhật màu nguyên liệu thành công."
        });
    }

    // =========================================================
    // CHANGE STATUS
    //
    // PUT /api/material-colors/10/status
    // =========================================================

    [HttpPut("{id:long}/status")]
    public async Task<IActionResult> ChangeStatus(
        long id,
        [FromBody] ChangeMaterialColorStatusRequest request)
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
                    "Màu nguyên liệu không hợp lệ."
            });
        }

        var color =
            await _context.MaterialColors
                .FirstOrDefaultAsync(x =>
                    x.MtlColorId == id &&
                    x.FactoryId == factoryId.Value);

        if (color == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy màu nguyên liệu."
            });
        }

        color.Active =
            request.Active;

        color.LastUpdatedBy =
            currentUserId.Value;

        color.LastUpdateDate =
            AppDateTime.Now;

        await _context
            .SaveChangesAsync();

        return Ok(new
        {
            message =
                request.Active
                    ? "Đã kích hoạt màu nguyên liệu."
                    : "Đã ngừng sử dụng màu nguyên liệu."
        });
    }

    // =========================================================
    // DELETE
    //
    // DELETE /api/material-colors/10
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
                    "Màu nguyên liệu không hợp lệ."
            });
        }

        // Chỉ được xóa record thuộc Factory hiện tại.
        var color =
            await _context.MaterialColors
                .FirstOrDefaultAsync(x =>
                    x.MtlColorId == id &&
                    x.FactoryId == factoryId.Value);

        if (color == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy màu nguyên liệu."
            });
        }

        _context.MaterialColors.Remove(
            color);

        try
        {
            await _context
                .SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    "Không thể xóa màu nguyên liệu vì dữ liệu này đang được sử dụng. Hãy chuyển sang trạng thái ngừng sử dụng."
            });
        }

        return Ok(new
        {
            message =
                "Xóa màu nguyên liệu thành công."
        });
    }

    // =========================================================
    // NORMALIZE
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

public class SaveMaterialColorRequest
{
    public string ColorCode { get; set; } =
        "";

    public string? ColorName { get; set; }

    public string? ColorDesc { get; set; }

    // Tạm giữ để không phá contract frontend cũ.
    // Backend KHÔNG dùng field này để quyết định Factory.
    public long FactoryId { get; set; }

    public bool Active { get; set; } =
        true;
}

public class ChangeMaterialColorStatusRequest
{
    public bool Active { get; set; }
}
