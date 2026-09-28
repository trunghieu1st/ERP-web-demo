using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/menus")]
[Authorize]
public class MenusController : ControllerBase
{
    private readonly CustomerDbContext _context;

    public MenusController(CustomerDbContext context)
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
    // GET: /api/menus
    // Ví dụ:
    // /api/menus?departmentId=1&interfaceType=WEB
    // /api/menus?interfaceType=WEB&all=true
    // =========================================================
    [HttpGet]
    public async Task<IActionResult> GetMenus(
        [FromQuery] long? departmentId,
        [FromQuery] string interfaceType = "WEB",
        [FromQuery] bool all = false)
    {
        interfaceType = interfaceType.Trim().ToUpper();

        // Chỉ cho phép WEB hoặc PWA
        if (interfaceType != "WEB" && interfaceType != "PWA")
        {
            return BadRequest(new
            {
                message = "INTERFACE_TYPE chỉ được WEB hoặc PWA."
            });
        }

        // =====================================================
        // Query menu đang active theo WEB/PWA
        // =====================================================
        var query = _context.Menus
            .AsNoTracking()
            .Where(x =>
                x.IsActive &&
                x.InterfaceType == interfaceType);

        // =====================================================
        // all = true
        // ADMIN / IT:
        // lấy toàn bộ menu của interface
        // =====================================================
        if (all)
        {
            // Không cần departmentId
        }
        else
        {
            // =================================================
            // User bình thường:
            // bắt buộc phải có DepartmentId
            // =================================================
            if (!departmentId.HasValue)
            {
                return BadRequest(new
                {
                    message = "departmentId là bắt buộc khi all=false."
                });
            }

            // Chỉ lấy menu thuộc phòng ban của user
            query = query.Where(x =>
                x.DepartmentId == departmentId.Value);
        }

        // =====================================================
        // Trả dữ liệu theo thứ tự:
        // MENU_LEVEL
        // SORT_ORDER
        // MENU_ID
        // =====================================================
        var menus = await query
            .OrderBy(x => x.MenuLevel)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.MenuId)
            .Select(x => new
            {
                menuId = x.MenuId,
                parentMenuId = x.ParentMenuId,
                menuLevel = x.MenuLevel,
                menuCode = x.MenuCode,
                menuName = x.MenuName,
                path = x.Path,
                departmentId = x.DepartmentId,
                interfaceType = x.InterfaceType,
                icon = x.Icon,
                sortOrder = x.SortOrder,
                isClickable = x.IsClickable
            })
            .ToListAsync();

        return Ok(menus);
    }
}