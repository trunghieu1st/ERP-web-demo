using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.DTOs.Item;
using production_plan_api.Helpers;
using production_plan_api.Models;
using production_plan_api.Services;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/items")]
[Authorize]
public class ItemsController : ControllerBase
{
    private readonly CustomerDbContext _context;
    private readonly CurrentUserService _currentUser;

    public ItemsController(
        CustomerDbContext context,
        CurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    private async Task<bool> FactoryIsActiveAsync(long factoryId) =>
        await _context.Factories
            .AsNoTracking()
            .AnyAsync(x =>
                x.FactoryId == factoryId &&
                x.IsActive);

    // =========================================================
    // GET api/items
    // =========================================================
    [HttpGet]
    public async Task<IActionResult> GetItems()
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được Factory của người dùng."
            });
        }

        var items = await _context.Items
            .AsNoTracking()
            .Where(x =>
                x.FactoryId == factoryId.Value)
            .OrderBy(x => x.InventoryItemId)
            .ToListAsync();

        return Ok(items);
    }

    // =========================================================
    // GET api/items/1
    // =========================================================
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetItem(long id)
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được Factory của người dùng."
            });
        }

        var item = await _context.Items
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.InventoryItemId == id &&
                x.FactoryId == factoryId.Value);

        if (item == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy Item trong Factory của bạn."
            });
        }

        return Ok(item);
    }

    // =========================================================
    // POST api/items
    // =========================================================
    [HttpPost]
    public async Task<IActionResult> CreateItem(
        [FromBody] ItemBasicCreateRequest request)
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

        if (!await FactoryIsActiveAsync(factoryId.Value))
        {
            return BadRequest(new
            {
                message =
                    "Factory của người dùng không tồn tại hoặc đã bị khóa."
            });
        }

        if (string.IsNullOrWhiteSpace(request.ItemCode))
        {
            return BadRequest(new
            {
                message =
                    "Item Code không được để trống."
            });
        }

        var itemCode = request.ItemCode.Trim();

        var exists = await _context.Items
            .AnyAsync(x =>
                x.FactoryId == factoryId.Value &&
                x.ItemCode == itemCode);

        if (exists)
        {
            return Conflict(new
            {
                message =
                    "Item Code đã tồn tại trong Factory này."
            });
        }

        var now = AppDateTime.Now;

        var item = new Item
        {
            FactoryId = factoryId.Value,
            ItemCode = itemCode,

            CreationDate = now,
            CreatedBy = userId.Value,

            LastUpdateDate = now,
            LastUpdatedBy = userId.Value,

            Description =
                request.Description?.Trim(),

            LongDescription =
                request.LongDescription?.Trim(),

            PrimaryUomCode =
                request.PrimaryUomCode?.Trim(),

            ItemType =
                request.ItemType?.Trim(),

            ItemCategory =
                request.ItemCategory?.Trim()
        };

        _context.Items.Add(item);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Tạo Item thành công.",
            inventoryItemId = item.InventoryItemId
        });
    }

    // =========================================================
    // PUT api/items/1
    // =========================================================
    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdateItem(
        long id,
        [FromBody] ItemBasicUpdateRequest request)
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

        if (!await FactoryIsActiveAsync(factoryId.Value))
        {
            return BadRequest(new
            {
                message =
                    "Factory của người dùng không tồn tại hoặc đã bị khóa."
            });
        }

        var item = await _context.Items
            .FirstOrDefaultAsync(x =>
                x.InventoryItemId == id &&
                x.FactoryId == factoryId.Value);

        if (item == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy Item trong Factory của bạn."
            });
        }

        if (string.IsNullOrWhiteSpace(request.ItemCode))
        {
            return BadRequest(new
            {
                message =
                    "Item Code không được để trống."
            });
        }

        var itemCode =
            request.ItemCode.Trim();

        var duplicate = await _context.Items
            .AnyAsync(x =>
                x.FactoryId == factoryId.Value &&
                x.ItemCode == itemCode &&
                x.InventoryItemId != id);

        if (duplicate)
        {
            return Conflict(new
            {
                message =
                    "Item Code đã tồn tại trong Factory này."
            });
        }

        // Không cho phép đổi Factory của Item qua request.
        item.ItemCode = itemCode;

        item.Description =
            request.Description?.Trim();

        item.LongDescription =
            request.LongDescription?.Trim();

        item.PrimaryUomCode =
            request.PrimaryUomCode?.Trim();

        item.ItemType =
            request.ItemType?.Trim();

        item.ItemCategory =
            request.ItemCategory?.Trim();

        item.LastUpdateDate =
            AppDateTime.Now;

        item.LastUpdatedBy =
            userId.Value;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Cập nhật Item thành công."
        });
    }

    // =========================================================
    // DELETE api/items/1
    // =========================================================
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteItem(long id)
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được Factory của người dùng."
            });
        }

        var item = await _context.Items
            .FirstOrDefaultAsync(x =>
                x.InventoryItemId == id &&
                x.FactoryId == factoryId.Value);

        if (item == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy Item trong Factory của bạn."
            });
        }

        _context.Items.Remove(item);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Xóa Item thành công."
        });
    }

    // =========================================================
    // GET api/items/search
    //
    // ?group=FINISHED_GOODS&keyword=ABC
    // =========================================================
    [HttpGet("search")]
    public async Task<IActionResult> SearchItems(
        [FromQuery] string group,
        [FromQuery] string keyword)
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được Factory của người dùng."
            });
        }

        if (!await FactoryIsActiveAsync(factoryId.Value))
        {
            return BadRequest(new
            {
                message =
                    "Factory của người dùng không tồn tại hoặc đã bị khóa."
            });
        }

        var normalizedGroup =
            group?.Trim().ToUpperInvariant();

        if (
            normalizedGroup != "FINISHED_GOODS" &&
            normalizedGroup != "MATERIAL")
        {
            return BadRequest(new
            {
                message =
                    "Nhóm tìm kiếm không hợp lệ."
            });
        }

        var normalizedKeyword =
            keyword?.Trim();

        if (string.IsNullOrWhiteSpace(normalizedKeyword))
        {
            return BadRequest(new
            {
                message =
                    "Vui lòng nhập nội dung cần tìm."
            });
        }

        var query = _context.Items
            .AsNoTracking()
            .Where(x =>
                x.FactoryId == factoryId.Value);

        if (normalizedGroup == "FINISHED_GOODS")
        {
            query = query.Where(x =>
                x.ItemType ==
                "Basic Finished Goods");
        }
        else
        {
            query = query.Where(x =>
                x.ItemType ==
                "Basic Material");
        }

        // Escape wildcard để % và _ trong từ khóa
        // được tìm như ký tự thông thường.
        var escaped = normalizedKeyword
            .Replace("\\", "\\\\")
            .Replace("%", "\\%")
            .Replace("_", "\\_");

        var pattern = $"%{escaped}%";

        query = query.Where(x =>
            EF.Functions.ILike(
                x.ItemCode,
                pattern,
                "\\") ||

            (
                x.Description != null &&
                EF.Functions.ILike(
                    x.Description,
                    pattern,
                    "\\")
            ) ||

            (
                x.LongDescription != null &&
                EF.Functions.ILike(
                    x.LongDescription,
                    pattern,
                    "\\")
            ));

        var items = await query
            .OrderBy(x => x.ItemCode)
            .Take(100)
            .Select(x => new
            {
                x.InventoryItemId,
                x.FactoryId,
                x.ItemCode,
                x.Description,
                x.LongDescription,
                x.PrimaryUomCode,
                x.ItemType,
                x.ItemCategory
            })
            .ToListAsync();

        return Ok(new
        {
            group = normalizedGroup,
            keyword = normalizedKeyword,
            count = items.Count,
            items
        });
    }
}
