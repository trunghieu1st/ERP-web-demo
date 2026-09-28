using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Helpers;
using production_plan_api.Models;
using production_plan_api.Services;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/user-functions")]
[Authorize(Roles = "ADMIN")]
public class UserFunctionsController : ControllerBase
{
    private readonly CustomerDbContext _context;
    private readonly CurrentUserService _currentUser;

    public UserFunctionsController(
        CustomerDbContext context,
        CurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    // =========================================================
    // GET: api/user-functions/users
    //
    // Danh sách User để màn hình phân chuyền sử dụng.
    // Chỉ trả User thuộc Factory của người đăng nhập.
    // =========================================================

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null || factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được Factory của người dùng đăng nhập."
            });
        }

        var users = await _context.Users
            .AsNoTracking()
            .Where(x =>
                x.IsActive &&
                x.FactoryId == factoryId.Value)
            .OrderBy(x => x.UserId)
            .Select(x => new
            {
                userId = x.UserId,
                username = x.Username,
                fullName = x.FullName,
                factoryId = x.FactoryId,
                departmentId = x.DepartmentId,
                roleCode = x.RoleCode
            })
            .ToListAsync();

        return Ok(users);
    }

    // =========================================================
    // GET: api/user-functions/{userId}
    //
    // Lấy các chuyền đã phân cho User.
    //
    // Target User phải thuộc cùng Factory
    // với người đang đăng nhập.
    // =========================================================

    [HttpGet("{userId:long}")]
    public async Task<IActionResult> GetUserProductionLines(
        long userId)
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null || factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được Factory của người dùng đăng nhập."
            });
        }

        var user = await _context.Users
            .AsNoTracking()
            .Where(x =>
                x.UserId == userId &&
                x.FactoryId == factoryId.Value &&
                x.IsActive)
            .Select(x => new
            {
                x.UserId,
                x.Username,
                x.FullName,
                x.FactoryId,
                x.DepartmentId,
                x.RoleCode
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy User."
            });
        }

        var lines = await _context.UserFunctions
            .AsNoTracking()
            .Where(x =>
                x.UserId == userId &&
                x.FactoryId == factoryId.Value &&
                x.IsActive)
            .Join(
                _context.ProductionLines.AsNoTracking()
                    .Where(x =>
                        x.FactoryId == factoryId.Value),
                uf => uf.ProductionLineId,
                pl => pl.ProductionLineId,
                (uf, pl) => new
                {
                    productionLineId =
                        pl.ProductionLineId,

                    factoryId =
                        pl.FactoryId,

                    lineCode =
                        pl.LineCode,

                    lineName =
                        pl.LineName,

                    sortOrder =
                        pl.SortOrder
                })
            .OrderBy(x => x.sortOrder)
            .ThenBy(x => x.productionLineId)
            .ToListAsync();

        return Ok(new
        {
            user,
            productionLines = lines
        });
    }

    // =========================================================
    // PUT: api/user-functions/{userId}
    //
    // Đồng bộ danh sách chuyền của User
    //
    // Body:
    //
    // {
    //   "productionLineIds": [1, 3, 5]
    // }
    //
    // DataScope:
    //
    // 1. Người thao tác có Factory từ JWT.
    // 2. Target User phải thuộc Factory đó.
    // 3. ProductionLine phải thuộc Factory đó.
    // 4. UserFunction lưu Factory đó.
    // =========================================================

    [HttpPut("{userId:long}")]
    public async Task<IActionResult> AssignProductionLines(
        long userId,
        [FromBody] AssignProductionLinesRequest request)
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
                    "Không xác định được Factory của người dùng đăng nhập."
            });
        }

        // -----------------------------------------------------
        // Target User phải thuộc cùng Factory
        // -----------------------------------------------------

        var user = await _context.Users
            .FirstOrDefaultAsync(x =>
                x.UserId == userId &&
                x.FactoryId == currentFactoryId.Value &&
                x.IsActive);

        if (user == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy User."
            });
        }

        var factoryId =
            currentFactoryId.Value;

        // -----------------------------------------------------
        // Xóa các ID trùng trong request
        // -----------------------------------------------------

        var productionLineIds =
            (request.ProductionLineIds ??
             new List<long>())
            .Distinct()
            .ToList();

        // -----------------------------------------------------
        // Kiểm tra toàn bộ chuyền:
        //
        // - tồn tại
        // - active
        // - thuộc Factory hiện tại
        // -----------------------------------------------------

        if (productionLineIds.Count > 0)
        {
            var validLines =
                await _context.ProductionLines
                    .AsNoTracking()
                    .Where(x =>
                        productionLineIds.Contains(
                            x.ProductionLineId) &&

                        x.FactoryId ==
                            factoryId &&

                        x.IsActive)
                    .Select(x =>
                        x.ProductionLineId)
                    .ToListAsync();

            var invalidLines =
                productionLineIds
                    .Except(validLines)
                    .ToList();

            if (invalidLines.Count > 0)
            {
                return BadRequest(new
                {
                    message =
                        "Có chuyền không tồn tại, đã khóa hoặc không thuộc nhà máy của User.",

                    invalidProductionLineIds =
                        invalidLines
                });
            }
        }

        // -----------------------------------------------------
        // Lấy assignment hiện tại
        //
        // User + Factory
        // -----------------------------------------------------

        var currentAssignments =
            await _context.UserFunctions
                .Where(x =>
                    x.UserId == userId &&
                    x.FactoryId == factoryId)
                .ToListAsync();

        var now = AppDateTime.Now;

        // -----------------------------------------------------
        // Assignment không còn được chọn
        // => inactive
        // -----------------------------------------------------

        foreach (var assignment in currentAssignments)
        {
            if (!productionLineIds.Contains(
                assignment.ProductionLineId))
            {
                assignment.IsActive = false;

                assignment.LastUpdateDate =
                    now;
            }
        }

        // -----------------------------------------------------
        // Assignment được chọn
        // -----------------------------------------------------

        foreach (var productionLineId
                 in productionLineIds)
        {
            var existing =
                currentAssignments
                    .FirstOrDefault(x =>
                        x.ProductionLineId ==
                        productionLineId);

            if (existing != null)
            {
                existing.IsActive = true;

                existing.LastUpdateDate =
                    now;
            }
            else
            {
                var newAssignment =
                    new UserFunction
                    {
                        UserId =
                            userId,

                        FactoryId =
                            factoryId,

                        ProductionLineId =
                            productionLineId,

                        IsActive =
                            true,

                        CreationDate =
                            now,

                        LastUpdateDate =
                            now
                    };

                _context.UserFunctions.Add(
                    newAssignment);
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Đã cập nhật phân chuyền cho User.",

            userId,

            factoryId,

            productionLineIds
        });
    }
}

// =========================================================
// REQUEST
// =========================================================

public class AssignProductionLinesRequest
{
    public List<long> ProductionLineIds { get; set; } = new();
}
