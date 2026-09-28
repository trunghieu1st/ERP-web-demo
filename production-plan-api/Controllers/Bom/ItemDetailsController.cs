using production_plan_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System.Data;
using production_plan_api.Data;
using production_plan_api.Models;
using production_plan_api.Helpers;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/item-details")]
[Authorize]
public class ItemDetailsController : ControllerBase
{
    private readonly CustomerDbContext _context;
    private readonly CurrentUserService _currentUser;

    public ItemDetailsController(
        CustomerDbContext context,
        CurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    // =========================================================
    // CURRENT USER + FACTORY
    //
    // UserId và FactoryId lấy trực tiếp từ JWT
    // thông qua CurrentUserService.
    // Không query lại bảng Users.
    // =========================================================

    private Task<CurrentUserInfo?> GetCurrentUserAsync()
    {
        var userId = _currentUser.UserId;
        var factoryId = _currentUser.FactoryId;

        if (
            userId == null ||
            factoryId == null ||
            factoryId.Value <= 0)
        {
            return Task.FromResult<CurrentUserInfo?>(null);
        }

        return Task.FromResult<CurrentUserInfo?>(
            new CurrentUserInfo
            {
                UserId = userId.Value,
                FactoryId = factoryId.Value
            });
    }

    // =========================================================
    // VALIDATE ITEM
    //
    // Mã hàng phải thuộc factory của user login.
    // =========================================================

    private async Task<Item?> GetUserItemAsync(
        long itemId,
        long factoryId)
    {
        return await _context.Items
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.InventoryItemId == itemId &&
                x.FactoryId == factoryId);
    }

    // =========================================================
    // =========================================================
    // STYLE COLOR MASTER
    // =========================================================
    // =========================================================

    // =========================================================
    // GET COLOR MASTER
    //
    // GET:
    // api/item-details/colors
    //
    // Có thể search:
    // api/item-details/colors?keyword=BLK
    // =========================================================

    [HttpGet("colors")]
    public async Task<IActionResult> GetColors(
        [FromQuery] string? keyword)
    {
        var currentUser = await GetCurrentUserAsync();

        if (currentUser == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        var query = _context.StyleColors
            .AsNoTracking()
            .Where(x =>
                x.FactoryId == currentUser.FactoryId &&
                x.Active);

        var normalizedKeyword = keyword?.Trim();

        if (!string.IsNullOrWhiteSpace(normalizedKeyword))
        {
            query = query.Where(x =>
                x.ColorCode.Contains(normalizedKeyword) ||
                (x.ColorName != null &&
                 x.ColorName.Contains(normalizedKeyword)) ||
                (x.ColorDesc != null &&
                 x.ColorDesc.Contains(normalizedKeyword)));
        }

        var colors = await query
            .OrderBy(x => x.ColorCode)
            .Select(x => new
            {
                styleColorId = x.StyleColorId,
                colorCode = x.ColorCode,
                colorName = x.ColorName,
                colorDesc = x.ColorDesc,
                active = x.Active
            })
            .ToListAsync();

        return Ok(colors);
    }

    // =========================================================
    // CREATE COLOR MASTER
    //
    // POST:
    // api/item-details/colors
    //
    // FactoryId KHÔNG nhận từ frontend.
    // =========================================================

    [HttpPost("colors")]
    public async Task<IActionResult> CreateColor(
        [FromBody] CreateStyleColorRequest request)
    {
        var currentUser = await GetCurrentUserAsync();

        if (currentUser == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        if (string.IsNullOrWhiteSpace(request.ColorCode))
        {
            return BadRequest(new
            {
                message = "Mã màu không được để trống."
            });
        }

        var colorCode =
            request.ColorCode.Trim().ToUpper();

        var exists = await _context.StyleColors
            .AnyAsync(x =>
                x.FactoryId == currentUser.FactoryId &&
                x.ColorCode == colorCode);

        if (exists)
        {
            return Conflict(new
            {
                message =
                    $"Mã màu \"{colorCode}\" đã tồn tại trong nhà máy này."
            });
        }

        var now = AppDateTime.Now;

        var color = new StyleColor
        {
            ColorCode = colorCode,

            ColorName =
                request.ColorName?.Trim(),

            ColorDesc =
                request.ColorDesc?.Trim(),

            FactoryId =
                currentUser.FactoryId,

            Active = true,

            CreatedBy =
                currentUser.UserId,

            CreationDate = now,

            LastUpdatedBy =
                currentUser.UserId,

            LastUpdateDate = now
        };

        _context.StyleColors.Add(color);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // DB cũng đã có UNIQUE(factory_id, color_code)
            return Conflict(new
            {
                message =
                    $"Mã màu \"{colorCode}\" đã tồn tại trong nhà máy này."
            });
        }

        return Ok(new
        {
            message = "Tạo mã màu thành công.",

            styleColorId =
                color.StyleColorId,

            colorCode =
                color.ColorCode,

            colorName =
                color.ColorName,

            colorDesc =
                color.ColorDesc
        });
    }

    // =========================================================
    // =========================================================
    // COLOR CỦA ITEM
    // =========================================================
    // =========================================================

    // =========================================================
    // GET COLORS OF ITEM
    //
    // GET:
    // api/item-details/100/colors
    // =========================================================

    [HttpGet("{itemId:long}/colors")]
    public async Task<IActionResult> GetItemColors(
        long itemId)
    {
        var currentUser = await GetCurrentUserAsync();

        if (currentUser == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        var item = await GetUserItemAsync(
            itemId,
            currentUser.FactoryId);

        if (item == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy mã hàng trong nhà máy của bạn."
            });
        }

        var colors =
            await (
                from header in _context.HeaderItemColors
                join color in _context.StyleColors
                    on header.ColorId equals color.StyleColorId
                where
                    header.MtlHeaderId == itemId &&
                    header.FactoryId == currentUser.FactoryId &&
                    color.FactoryId == currentUser.FactoryId
                orderby color.ColorCode
                select new
                {
                    headerColorId =
                        header.HeaderColorId,

                    colorId =
                        color.StyleColorId,

                    colorCode =
                        color.ColorCode,

                    colorName =
                        color.ColorName,

                    colorDesc =
                        color.ColorDesc,

                    active =
                        color.Active,

                    description =
                        header.Description,

                    remark =
                        header.Remark,

                    soCutting =
                        header.SoCutting,

                    attribute1 =
                        header.Attribute1,

                    attribute2 =
                        header.Attribute2,

                    usedInBomStyle =
                        _context.Items.Any(detail =>
                            detail.FactoryId == currentUser.FactoryId &&
                            detail.ItemType == "Detail Finished Goods" &&
                            detail.BasicId == itemId &&
                            detail.ColorId == color.StyleColorId)
                }
            )
            .AsNoTracking()
            .ToListAsync();

        return Ok(new
        {
            item = new
            {
                inventoryItemId =
                    item.InventoryItemId,

                itemCode =
                    item.ItemCode,

                description =
                    item.Description
            },

            colors
        });
    }

    // =========================================================
    // GET AVAILABLE COLORS FOR ITEM
    //
    // Dùng cho modal:
    // "+ Thêm màu cho mã hàng"
    //
    // Chỉ trả màu chưa được gán.
    //
    // GET:
    // api/item-details/100/colors/available
    // =========================================================

    [HttpGet("{itemId:long}/colors/available")]
    public async Task<IActionResult> GetAvailableColors(
        long itemId,
        [FromQuery] string? keyword)
    {
        var currentUser = await GetCurrentUserAsync();

        if (currentUser == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        var item = await GetUserItemAsync(
            itemId,
            currentUser.FactoryId);

        if (item == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy mã hàng trong nhà máy của bạn."
            });
        }

        var assignedColorIds =
            _context.HeaderItemColors
                .Where(x =>
                    x.FactoryId == currentUser.FactoryId &&
                    x.MtlHeaderId == itemId)
                .Select(x => x.ColorId);

        var query =
            _context.StyleColors
                .AsNoTracking()
                .Where(x =>
                    x.FactoryId == currentUser.FactoryId &&
                    x.Active &&
                    !assignedColorIds.Contains(x.StyleColorId));

        var normalizedKeyword =
            keyword?.Trim();

        if (!string.IsNullOrWhiteSpace(normalizedKeyword))
        {
            query = query.Where(x =>
                x.ColorCode.Contains(normalizedKeyword) ||
                (x.ColorName != null &&
                 x.ColorName.Contains(normalizedKeyword)) ||
                (x.ColorDesc != null &&
                 x.ColorDesc.Contains(normalizedKeyword)));
        }

        var colors = await query
            .OrderBy(x => x.ColorCode)
            .Select(x => new
            {
                colorId =
                    x.StyleColorId,

                colorCode =
                    x.ColorCode,

                colorName =
                    x.ColorName,

                colorDesc =
                    x.ColorDesc
            })
            .ToListAsync();

        return Ok(colors);
    }

    // =========================================================
    // ASSIGN COLORS TO ITEM
    //
    // POST:
    // api/item-details/100/colors/assign
    //
    // Body:
    // {
    //     "colorIds": [1, 2, 3]
    // }
    //
    // ADDITIVE ONLY.
    // Không xóa màu đang có.
    // =========================================================

    [HttpPost("{itemId:long}/colors/assign")]
    public async Task<IActionResult> AssignColors(
        long itemId,
        [FromBody] AssignColorsRequest request)
    {
        var currentUser = await GetCurrentUserAsync();

        if (currentUser == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        var item = await GetUserItemAsync(
            itemId,
            currentUser.FactoryId);

        if (item == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy mã hàng trong nhà máy của bạn."
            });
        }

        var colorIds = request.ColorIds
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        if (colorIds.Count == 0)
        {
            return BadRequest(new
            {
                message = "Vui lòng chọn ít nhất một màu."
            });
        }

        // Chỉ cho phép màu active thuộc factory user.
        var validColorIds =
            await _context.StyleColors
                .Where(x =>
                    x.FactoryId == currentUser.FactoryId &&
                    x.Active &&
                    colorIds.Contains(x.StyleColorId))
                .Select(x => x.StyleColorId)
                .ToListAsync();

        if (validColorIds.Count != colorIds.Count)
        {
            return BadRequest(new
            {
                message =
                    "Có mã màu không tồn tại, đã bị khóa hoặc không thuộc nhà máy của bạn."
            });
        }

        var existingColorIds =
            await _context.HeaderItemColors
                .Where(x =>
                    x.FactoryId == currentUser.FactoryId &&
                    x.MtlHeaderId == itemId &&
                    colorIds.Contains(x.ColorId))
                .Select(x => x.ColorId)
                .ToListAsync();

        var existingSet =
            existingColorIds.ToHashSet();

        var newColorIds =
            colorIds
                .Where(x => !existingSet.Contains(x))
                .ToList();

        if (newColorIds.Count == 0)
        {
            return Conflict(new
            {
                message =
                    "Các màu đã chọn đều đã được gán cho mã hàng."
            });
        }

        var now = AppDateTime.Now;

        foreach (var colorId in newColorIds)
        {
            _context.HeaderItemColors.Add(
                new HeaderItemColor
                {
                    MtlHeaderId =
                        itemId,

                    ColorId =
                        colorId,

                    FactoryId =
                        currentUser.FactoryId,

                    CreatedBy =
                        currentUser.UserId,

                    CreationDate =
                        now,

                    LastUpdatedBy =
                        currentUser.UserId,

                    LastUpdateDate =
                        now
                });
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    "Một hoặc nhiều màu đã được gán cho mã hàng."
            });
        }

        return Ok(new
        {
            message =
                $"Đã thêm {newColorIds.Count} màu vào mã hàng.",

            assignedCount =
                newColorIds.Count
        });
    }

    // =========================================================
    // UPDATE COLOR ATTRIBUTES OF ITEM
    // =========================================================

    [HttpPut("{itemId:long}/colors/attributes")]
    public async Task<IActionResult> UpdateColorAttributes(
        long itemId,
        [FromBody] UpdateColorAttributesRequest request)
    {
        var currentUser = await GetCurrentUserAsync();

        if (currentUser == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        var item = await GetUserItemAsync(
            itemId,
            currentUser.FactoryId);

        if (item == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy mã hàng trong nhà máy của bạn."
            });
        }

        var rows = request.Colors ?? new List<UpdateColorAttributeRow>();
        var colorIds = rows
            .Select(x => x.ColorId)
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        var mappings = await _context.HeaderItemColors
            .Where(x =>
                x.FactoryId == currentUser.FactoryId &&
                x.MtlHeaderId == itemId &&
                colorIds.Contains(x.ColorId))
            .ToListAsync();

        if (mappings.Count != colorIds.Count)
        {
            return BadRequest(new
            {
                message = "Có màu không thuộc mã hàng hiện tại."
            });
        }

        var rowByColorId = rows
            .Where(x => x.ColorId > 0)
            .GroupBy(x => x.ColorId)
            .ToDictionary(x => x.Key, x => x.Last());

        var now = AppDateTime.Now;

        foreach (var mapping in mappings)
        {
            var row = rowByColorId[mapping.ColorId];
            var attribute1 = row.Attribute1?.Trim().ToUpperInvariant();

            if (!string.IsNullOrEmpty(attribute1) &&
                attribute1 != "TACH" &&
                attribute1 != "GOP")
            {
                return BadRequest(new
                {
                    message = "Tác nghiệp cắt chỉ được chọn TACH hoặc GOP."
                });
            }

            mapping.Attribute1 =
                string.IsNullOrEmpty(attribute1) ? null : attribute1;
            mapping.Attribute2 = row.Attribute2 == "Y" ? "Y" : null;
            mapping.LastUpdatedBy = currentUser.UserId;
            mapping.LastUpdateDate = now;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Đã lưu thông tin màu."
        });
    }

    // =========================================================
    // REMOVE COLOR FROM ITEM
    //
    // DELETE:
    // api/item-details/100/colors/5
    //
    // 5 = StyleColorId
    //
    // Chỉ xóa mapping.
    // KHÔNG xóa PRS_STYLE_COLOR.
    // =========================================================

    [HttpDelete("{itemId:long}/colors/{colorId:long}")]
    public async Task<IActionResult> RemoveColor(
        long itemId,
        long colorId)
    {
        var currentUser = await GetCurrentUserAsync();

        if (currentUser == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        var item = await GetUserItemAsync(
            itemId,
            currentUser.FactoryId);

        if (item == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy mã hàng trong nhà máy của bạn."
            });
        }

        var mapping =
            await _context.HeaderItemColors
                .FirstOrDefaultAsync(x =>
                    x.FactoryId == currentUser.FactoryId &&
                    x.MtlHeaderId == itemId &&
                    x.ColorId == colorId);

        if (mapping == null)
        {
            return NotFound(new
            {
                message =
                    "Màu này chưa được gán cho mã hàng."
            });
        }

        var usedInBomStyle = await _context.Items
            .AsNoTracking()
            .AnyAsync(x =>
                x.FactoryId == currentUser.FactoryId &&
                x.ItemType == "Detail Finished Goods" &&
                x.BasicId == itemId &&
                x.ColorId == colorId);

        if (usedInBomStyle)
        {
            return Conflict(new
            {
                message =
                    "Màu này đã được tạo BOM STYLE nên không thể xóa khỏi mã hàng."
            });
        }

        _context.HeaderItemColors.Remove(mapping);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Đã xóa màu khỏi mã hàng."
        });
    }

    // =========================================================
    // =========================================================
    // SIZE MASTER
    // =========================================================
    // =========================================================

    // =========================================================
    // GET SIZE MASTER
    //
    // GET:
    // api/item-details/sizes
    // =========================================================

    [HttpGet("sizes")]
    public async Task<IActionResult> GetSizes(
        [FromQuery] string? keyword)
    {
        var currentUser = await GetCurrentUserAsync();

        if (currentUser == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        var query =
            _context.MtlSizes
                .AsNoTracking()
                .Where(x =>
                    x.FactoryId == currentUser.FactoryId &&
                    x.Active);

        var normalizedKeyword =
            keyword?.Trim();

        if (!string.IsNullOrWhiteSpace(normalizedKeyword))
        {
            query = query.Where(x =>
                x.MtlSizeCode.Contains(normalizedKeyword) ||
                (x.MtlSizeDesc != null &&
                 x.MtlSizeDesc.Contains(normalizedKeyword)));
        }

        var sizes = await query
            .OrderBy(x => x.MtlSizeValue)
            .ThenBy(x => x.MtlSizeCode)
            .Select(x => new
            {
                sizeId =
                    x.SizeId,

                mtlSizeCode =
                    x.MtlSizeCode,

                mtlSizeValue =
                    x.MtlSizeValue,

                mtlSizeDesc =
                    x.MtlSizeDesc,

                active =
                    x.Active
            })
            .ToListAsync();

        return Ok(sizes);
    }

    // =========================================================
    // CREATE SIZE MASTER
    //
    // POST:
    // api/item-details/sizes
    // =========================================================

    [HttpPost("sizes")]
    public async Task<IActionResult> CreateSize(
        [FromBody] CreateMtlSizeRequest request)
    {
        var currentUser = await GetCurrentUserAsync();

        if (currentUser == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        if (string.IsNullOrWhiteSpace(request.MtlSizeCode))
        {
            return BadRequest(new
            {
                message = "Mã cỡ không được để trống."
            });
        }

        var sizeCode =
            request.MtlSizeCode.Trim().ToUpper();

        var exists =
            await _context.MtlSizes
                .AnyAsync(x =>
                    x.FactoryId == currentUser.FactoryId &&
                    x.MtlSizeCode == sizeCode);

        if (exists)
        {
            return Conflict(new
            {
                message =
                    $"Mã cỡ \"{sizeCode}\" đã tồn tại trong nhà máy này."
            });
        }

        var now = AppDateTime.Now;

        var size = new StyleSize
        {
            MtlSizeCode =
                sizeCode,

            MtlSizeValue =
                request.MtlSizeValue,

            MtlSizeDesc =
                request.MtlSizeDesc?.Trim(),

            FactoryId =
                currentUser.FactoryId,

            Active = true,

            CreatedBy =
                currentUser.UserId,

            CreationDate =
                now,

            LastUpdatedBy =
                currentUser.UserId,

            LastUpdateDate =
                now
        };

        _context.MtlSizes.Add(size);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    $"Mã cỡ \"{sizeCode}\" đã tồn tại trong nhà máy này."
            });
        }

        return Ok(new
        {
            message =
                "Tạo mã cỡ thành công.",

            sizeId =
                size.SizeId,

            mtlSizeCode =
                size.MtlSizeCode,

            mtlSizeValue =
                size.MtlSizeValue,

            mtlSizeDesc =
                size.MtlSizeDesc
        });
    }

    // =========================================================
    // =========================================================
    // SIZE CỦA ITEM
    // =========================================================
    // =========================================================

    // =========================================================
    // GET ITEM SIZES
    //
    // GET:
    // api/item-details/100/sizes
    // =========================================================

    [HttpGet("{itemId:long}/sizes")]
    public async Task<IActionResult> GetItemSizes(
        long itemId)
    {
        var currentUser = await GetCurrentUserAsync();

        if (currentUser == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        var item = await GetUserItemAsync(
            itemId,
            currentUser.FactoryId);

        if (item == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy mã hàng trong nhà máy của bạn."
            });
        }

        var sizes =
            await (
                from header in _context.HeaderItemSizes
                join size in _context.MtlSizes
                    on header.SizeId equals size.SizeId
                where
                    header.MtlHeaderId == itemId &&
                    header.FactoryId == currentUser.FactoryId &&
                    size.FactoryId == currentUser.FactoryId
                orderby
                    size.MtlSizeValue,
                    size.MtlSizeCode
                select new
                {
                    headerSizeId =
                        header.HeaderSizeId,

                    sizeId =
                        size.SizeId,

                    mtlSizeCode =
                        size.MtlSizeCode,

                    mtlSizeValue =
                        size.MtlSizeValue,

                    mtlSizeDesc =
                        size.MtlSizeDesc,

                    active =
                        size.Active,

                    description =
                        header.Description,

                    remark =
                        header.Remark,

                    usedInBomStyle =
                        _context.Items.Any(detail =>
                            detail.FactoryId == currentUser.FactoryId &&
                            detail.ItemType == "Detail Finished Goods" &&
                            detail.BasicId == itemId &&
                            detail.SizeId == size.SizeId)
                }
            )
            .AsNoTracking()
            .ToListAsync();

        return Ok(new
        {
            item = new
            {
                inventoryItemId =
                    item.InventoryItemId,

                itemCode =
                    item.ItemCode,

                description =
                    item.Description
            },

            sizes
        });
    }

    // =========================================================
    // AVAILABLE SIZES
    //
    // GET:
    // api/item-details/100/sizes/available
    // =========================================================

    [HttpGet("{itemId:long}/sizes/available")]
    public async Task<IActionResult> GetAvailableSizes(
        long itemId,
        [FromQuery] string? keyword)
    {
        var currentUser = await GetCurrentUserAsync();

        if (currentUser == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        var item = await GetUserItemAsync(
            itemId,
            currentUser.FactoryId);

        if (item == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy mã hàng trong nhà máy của bạn."
            });
        }

        var assignedSizeIds =
            _context.HeaderItemSizes
                .Where(x =>
                    x.FactoryId == currentUser.FactoryId &&
                    x.MtlHeaderId == itemId)
                .Select(x => x.SizeId);

        var query =
            _context.MtlSizes
                .AsNoTracking()
                .Where(x =>
                    x.FactoryId == currentUser.FactoryId &&
                    x.Active &&
                    !assignedSizeIds.Contains(x.SizeId));

        var normalizedKeyword =
            keyword?.Trim();

        if (!string.IsNullOrWhiteSpace(normalizedKeyword))
        {
            query = query.Where(x =>
                x.MtlSizeCode.Contains(normalizedKeyword) ||
                (x.MtlSizeDesc != null &&
                 x.MtlSizeDesc.Contains(normalizedKeyword)));
        }

        var sizes = await query
            .OrderBy(x => x.MtlSizeValue)
            .ThenBy(x => x.MtlSizeCode)
            .Select(x => new
            {
                sizeId =
                    x.SizeId,

                mtlSizeCode =
                    x.MtlSizeCode,

                mtlSizeValue =
                    x.MtlSizeValue,

                mtlSizeDesc =
                    x.MtlSizeDesc
            })
            .ToListAsync();

        return Ok(sizes);
    }

    // =========================================================
    // ASSIGN SIZES TO ITEM
    //
    // POST:
    // api/item-details/100/sizes/assign
    //
    // {
    //     "sizeIds": [1,2,3]
    // }
    // =========================================================

    [HttpPost("{itemId:long}/sizes/assign")]
    public async Task<IActionResult> AssignSizes(
        long itemId,
        [FromBody] AssignSizesRequest request)
    {
        var currentUser = await GetCurrentUserAsync();

        if (currentUser == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        var item = await GetUserItemAsync(
            itemId,
            currentUser.FactoryId);

        if (item == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy mã hàng trong nhà máy của bạn."
            });
        }

        var sizeIds = request.SizeIds
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        if (sizeIds.Count == 0)
        {
            return BadRequest(new
            {
                message =
                    "Vui lòng chọn ít nhất một cỡ."
            });
        }

        var validSizeIds =
            await _context.MtlSizes
                .Where(x =>
                    x.FactoryId == currentUser.FactoryId &&
                    x.Active &&
                    sizeIds.Contains(x.SizeId))
                .Select(x => x.SizeId)
                .ToListAsync();

        if (validSizeIds.Count != sizeIds.Count)
        {
            return BadRequest(new
            {
                message =
                    "Có mã cỡ không tồn tại, đã bị khóa hoặc không thuộc nhà máy của bạn."
            });
        }

        var existingSizeIds =
            await _context.HeaderItemSizes
                .Where(x =>
                    x.FactoryId == currentUser.FactoryId &&
                    x.MtlHeaderId == itemId &&
                    sizeIds.Contains(x.SizeId))
                .Select(x => x.SizeId)
                .ToListAsync();

        var existingSet =
            existingSizeIds.ToHashSet();

        var newSizeIds =
            sizeIds
                .Where(x => !existingSet.Contains(x))
                .ToList();

        if (newSizeIds.Count == 0)
        {
            return Conflict(new
            {
                message =
                    "Các cỡ đã chọn đều đã được gán cho mã hàng."
            });
        }

        var now = AppDateTime.Now;

        foreach (var sizeId in newSizeIds)
        {
            _context.HeaderItemSizes.Add(
                new HeaderItemSize
                {
                    MtlHeaderId =
                        itemId,

                    SizeId =
                        sizeId,

                    FactoryId =
                        currentUser.FactoryId,

                    CreatedBy =
                        currentUser.UserId,

                    CreationDate =
                        now,

                    LastUpdatedBy =
                        currentUser.UserId,

                    LastUpdateDate =
                        now
                });
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    "Một hoặc nhiều cỡ đã được gán cho mã hàng."
            });
        }

        return Ok(new
        {
            message =
                $"Đã thêm {newSizeIds.Count} cỡ vào mã hàng.",

            assignedCount =
                newSizeIds.Count
        });
    }

    // =========================================================
    // REMOVE SIZE FROM ITEM
    //
    // DELETE:
    // api/item-details/100/sizes/5
    //
    // 5 = SizeId
    // =========================================================

    [HttpDelete("{itemId:long}/sizes/{sizeId:long}")]
    public async Task<IActionResult> RemoveSize(
        long itemId,
        long sizeId)
    {
        var currentUser = await GetCurrentUserAsync();

        if (currentUser == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        var item = await GetUserItemAsync(
            itemId,
            currentUser.FactoryId);

        if (item == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy mã hàng trong nhà máy của bạn."
            });
        }

        var mapping =
            await _context.HeaderItemSizes
                .FirstOrDefaultAsync(x =>
                    x.FactoryId == currentUser.FactoryId &&
                    x.MtlHeaderId == itemId &&
                    x.SizeId == sizeId);

        if (mapping == null)
        {
            return NotFound(new
            {
                message =
                    "Cỡ này chưa được gán cho mã hàng."
            });
        }

        var usedInBomStyle = await _context.Items
            .AsNoTracking()
            .AnyAsync(x =>
                x.FactoryId == currentUser.FactoryId &&
                x.ItemType == "Detail Finished Goods" &&
                x.BasicId == itemId &&
                x.SizeId == sizeId);

        if (usedInBomStyle)
        {
            return Conflict(new
            {
                message =
                    "Cỡ này đã được tạo BOM STYLE nên không thể xóa khỏi mã hàng."
            });
        }

        _context.HeaderItemSizes.Remove(mapping);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Đã xóa cỡ khỏi mã hàng."
        });
    }


    // =========================================================
    // DETAIL FINISHED GOODS OF ITEM
    // =========================================================

    [HttpGet("{itemId:long}/detail-items")]
    public async Task<IActionResult> GetDetailItems(long itemId)
    {
        var currentUser = await GetCurrentUserAsync();

        if (currentUser == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        var item = await GetUserItemAsync(
            itemId,
            currentUser.FactoryId);

        if (item == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy mã hàng trong nhà máy của bạn."
            });
        }

        var detailItems = await (
            from detail in _context.Items
            join color0 in _context.StyleColors
                    .Where(x => x.FactoryId == currentUser.FactoryId)
                on detail.ColorId equals color0.StyleColorId into colorGroup
            from color in colorGroup.DefaultIfEmpty()
            join size0 in _context.MtlSizes
                    .Where(x => x.FactoryId == currentUser.FactoryId)
                on detail.SizeId equals size0.SizeId into sizeGroup
            from size in sizeGroup.DefaultIfEmpty()
            where
                detail.FactoryId == currentUser.FactoryId &&
                detail.ItemType == "Detail Finished Goods" &&
                detail.BasicId == itemId
            orderby
                color.ColorCode,
                size.MtlSizeValue,
                detail.ItemCode
            select new
            {
                inventoryItemId = detail.InventoryItemId,
                itemCode = detail.ItemCode,
                colorCode = color != null ? color.ColorCode : null,
                colorName = color != null ? color.ColorName : null,
                mtlSizeCode = size != null ? size.MtlSizeCode : null
            }
        )
        .AsNoTracking()
        .ToListAsync();

        return Ok(new
        {
            item = new
            {
                inventoryItemId = item.InventoryItemId,
                itemCode = item.ItemCode,
                description = item.Description
            },
            detailItems
        });
    }

    // =========================================================
    // BOM STYLE - CREATE DETAIL FINISHED GOODS
    // Transaction do EF Core quản lý.
    // Procedure không COMMIT và không nuốt exception.
    // =========================================================

    [HttpPost("{itemId:long}/bom-style")]
    public async Task<IActionResult> CreateBomStyle(long itemId)
    {
        var currentUser = await GetCurrentUserAsync();

        if (currentUser == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        var item = await GetUserItemAsync(
            itemId,
            currentUser.FactoryId);

        if (item == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy mã hàng trong nhà máy của bạn."
            });
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            var connection = _context.Database.GetDbConnection();

            await using var command = connection.CreateCommand();
            command.Transaction = transaction.GetDbTransaction();
            command.CommandText =
                "CALL prs_create_item_detail_p(@p_mtl_header_id, @p_user_id, @p_out)";

            var headerParameter = command.CreateParameter();
            headerParameter.ParameterName = "p_mtl_header_id";
            headerParameter.DbType = DbType.Int64;
            headerParameter.Value = itemId;
            command.Parameters.Add(headerParameter);

            var userParameter = command.CreateParameter();
            userParameter.ParameterName = "p_user_id";
            userParameter.DbType = DbType.Int64;
            userParameter.Value = currentUser.UserId;
            command.Parameters.Add(userParameter);

            var outputParameter = command.CreateParameter();
            outputParameter.ParameterName = "p_out";
            outputParameter.DbType = DbType.String;
            outputParameter.Direction = ParameterDirection.InputOutput;
            outputParameter.Size = 4000;
            outputParameter.Value = string.Empty;
            command.Parameters.Add(outputParameter);

            await command.ExecuteNonQueryAsync();

            var procedureMessage =
                outputParameter.Value?.ToString()
                ?? "Đã xử lý BOM STYLE.";

            await transaction.CommitAsync();

            return Ok(new
            {
                message = procedureMessage
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();

            return StatusCode(500, new
            {
                message =
                    $"Có lỗi khi tạo mã chi tiết: {ex.Message}"
            });
        }
    }

}

// =============================================================
// REQUEST MODELS
// =============================================================

public class CreateStyleColorRequest
{
    public string ColorCode { get; set; } = "";

    public string? ColorName { get; set; }

    public string? ColorDesc { get; set; }
}

public class AssignColorsRequest
{
    public List<long> ColorIds { get; set; } = new();
}

public class UpdateColorAttributesRequest
{
    public List<UpdateColorAttributeRow> Colors { get; set; } = new();
}

public class UpdateColorAttributeRow
{
    public long ColorId { get; set; }

    public string? Attribute1 { get; set; }

    public string? Attribute2 { get; set; }
}

public class CreateMtlSizeRequest
{
    public string MtlSizeCode { get; set; } = "";

    public decimal MtlSizeValue { get; set; }

    public string? MtlSizeDesc { get; set; }
}

public class AssignSizesRequest
{
    public List<long> SizeIds { get; set; } = new();
}

// =============================================================
// INTERNAL
// =============================================================

public class CurrentUserInfo
{
    public long UserId { get; set; }

    public long FactoryId { get; set; }
}