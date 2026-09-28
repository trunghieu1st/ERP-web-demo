using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Helpers;
using production_plan_api.Models;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/factory-reports")]
[Authorize(Roles = "ADMIN")]
public class FactoryReportController : ControllerBase
{
    private readonly CustomerDbContext _context;

    public FactoryReportController(CustomerDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // CURRENT USER ID
    // =========================================================

    private long? GetCurrentUserId()
    {
        var value =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (long.TryParse(value, out var userId))
        {
            return userId;
        }

        return null;
    }

    // =========================================================
    // GET REPORT PERMISSIONS BY FACTORY
    //
    // GET:
    // /api/factory-reports?factoryId=1
    //
    // Trả về toàn bộ report đang active.
    // Report đã được cấp cho factory => isAssigned = true
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetFactoryReports(
        [FromQuery] long factoryId)
    {
        if (factoryId <= 0)
        {
            return BadRequest(new
            {
                message = "Nhà máy không hợp lệ."
            });
        }

        // -----------------------------------------------------
        // CHECK FACTORY
        // -----------------------------------------------------

        var factory = await _context.Factories
            .AsNoTracking()
            .Where(x => x.FactoryId == factoryId)
            .Select(x => new
            {
                x.FactoryId,
                x.FactoryCode,
                x.FactoryName
            })
            .FirstOrDefaultAsync();

        if (factory == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhà máy."
            });
        }

        // -----------------------------------------------------
        // GET REPORTS
        // -----------------------------------------------------

        var reports = await _context.Reports
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.ReportName)
            .Select(x => new
            {
                x.ReportId,
                x.ReportCode,
                x.ReportName,
                x.ReportPath,
                x.Icon,
                x.SortOrder,

                IsAssigned =
                    _context.FactoryReports.Any(fr =>
                        fr.FactoryId == factoryId &&
                        fr.ReportId == x.ReportId &&
                        fr.IsActive)
            })
            .ToListAsync();

        return Ok(new
        {
            factory,
            reports
        });
    }

    // =========================================================
    // SAVE FACTORY REPORT PERMISSIONS
    //
    // PUT:
    // /api/factory-reports
    //
    // BODY:
    //
    // {
    //   "factoryId": 1,
    //   "reportIds": [1, 2, 3]
    // }
    //
    // =========================================================

    [HttpPut]
    public async Task<IActionResult> SaveFactoryReports(
        [FromBody] SaveFactoryReportsRequest request)
    {
        // -----------------------------------------------------
        // VALIDATE FACTORY
        // -----------------------------------------------------

        if (request.FactoryId <= 0)
        {
            return BadRequest(new
            {
                message = "Nhà máy không hợp lệ."
            });
        }

        var factoryExists =
            await _context.Factories.AnyAsync(x =>
                x.FactoryId == request.FactoryId);

        if (!factoryExists)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhà máy."
            });
        }

        // -----------------------------------------------------
        // CLEAN REPORT IDS
        // -----------------------------------------------------

        var selectedReportIds =
            (request.ReportIds ?? new List<long>())
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        // -----------------------------------------------------
        // CHECK REPORT IDS
        // -----------------------------------------------------

        if (selectedReportIds.Count > 0)
        {
            var validReportIds =
                await _context.Reports
                    .Where(x =>
                        selectedReportIds.Contains(x.ReportId) &&
                        x.IsActive)
                    .Select(x => x.ReportId)
                    .ToListAsync();

            var invalidReportIds =
                selectedReportIds
                    .Except(validReportIds)
                    .ToList();

            if (invalidReportIds.Count > 0)
            {
                return BadRequest(new
                {
                    message =
                        "Có báo cáo không tồn tại hoặc đang bị khóa.",

                    reportIds =
                        invalidReportIds
                });
            }
        }

        // -----------------------------------------------------
        // CURRENT DATA
        // -----------------------------------------------------

        var existingPermissions =
            await _context.FactoryReports
                .Where(x =>
                    x.FactoryId == request.FactoryId)
                .ToListAsync();

        var currentUserId =
            GetCurrentUserId();

        /*
         * Vì database đang dùng:
         *
         * timestamp without time zone
         *
         * nên sử dụng AppDateTime.Now.
         */
        var now = AppDateTime.Now;

        // -----------------------------------------------------
        // UPDATE EXISTING PERMISSIONS
        // -----------------------------------------------------

        foreach (var permission in existingPermissions)
        {
            var shouldBeActive =
                selectedReportIds.Contains(
                    permission.ReportId);

            if (permission.IsActive != shouldBeActive)
            {
                permission.IsActive =
                    shouldBeActive;

                permission.LastUpdateDate =
                    now;

                permission.LastUpdateBy =
                    currentUserId;
            }
        }

        // -----------------------------------------------------
        // INSERT NEW PERMISSIONS
        // -----------------------------------------------------

        var existingReportIds =
            existingPermissions
                .Select(x => x.ReportId)
                .ToHashSet();

        var newReportIds =
            selectedReportIds
                .Where(x =>
                    !existingReportIds.Contains(x))
                .ToList();

        foreach (var reportId in newReportIds)
        {
            var permission =
                new FactoryReport
                {
                    FactoryId =
                        request.FactoryId,

                    ReportId =
                        reportId,

                    IsActive =
                        true,

                    CreationDate =
                        now,

                    CreatedBy =
                        currentUserId,

                    LastUpdateDate =
                        now,

                    LastUpdateBy =
                        currentUserId
                };

            _context.FactoryReports.Add(
                permission);
        }

        // -----------------------------------------------------
        // SAVE
        // -----------------------------------------------------

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            return BadRequest(new
            {
                message =
                    "Không thể lưu phân quyền báo cáo cho nhà máy.",

                error =
                    ex.InnerException?.Message ??
                    ex.Message
            });
        }

        // -----------------------------------------------------
        // RESULT
        // -----------------------------------------------------

        return Ok(new
        {
            message =
                "Lưu phân quyền báo cáo cho nhà máy thành công.",

            factoryId =
                request.FactoryId,

            assignedCount =
                selectedReportIds.Count
        });
    }

    // =========================================================
    // BULK ASSIGN
    //
    // POST /api/factory-reports/assign
    //
    // BODY:
    // {
    //     "factoryIds": [1, 2, 3],
    //     "reportIds": [5, 8, 10]
    // }
    //
    // QUAN TRỌNG:
    // - Chỉ cấp thêm quyền
    // - Quyền đang inactive -> active lại
    // - Quyền đang active -> giữ nguyên
    // - KHÔNG thu hồi các quyền khác
    // =========================================================

    [HttpPost("assign")]
    public async Task<IActionResult> AssignReportsToFactories(
        [FromBody] AssignFactoryReportsRequest request)
    {
        var currentUserId = GetCurrentUserId();

        if (currentUserId == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        var factoryIds = request.FactoryIds
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        var reportIds = request.ReportIds
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        if (factoryIds.Count == 0)
        {
            return BadRequest(new
            {
                message = "Vui lòng chọn ít nhất một nhà máy."
            });
        }

        if (reportIds.Count == 0)
        {
            return BadRequest(new
            {
                message = "Vui lòng chọn ít nhất một báo cáo."
            });
        }

        // =====================================================
        // VALIDATE FACTORIES
        // =====================================================

        var validFactoryIds = await _context.Factories
            .AsNoTracking()
            .Where(x => factoryIds.Contains(x.FactoryId))
            .Select(x => x.FactoryId)
            .ToListAsync();

        var invalidFactoryIds = factoryIds
            .Except(validFactoryIds)
            .ToList();

        if (invalidFactoryIds.Count > 0)
        {
            return BadRequest(new
            {
                message = "Có nhà máy không tồn tại.",
                factoryIds = invalidFactoryIds
            });
        }

        // =====================================================
        // VALIDATE REPORTS
        //
        // Chỉ cho phép cấp report đang Active.
        // =====================================================

        var validReportIds = await _context.Reports
            .AsNoTracking()
            .Where(x =>
                reportIds.Contains(x.ReportId) &&
                x.IsActive)
            .Select(x => x.ReportId)
            .ToListAsync();

        var invalidReportIds = reportIds
            .Except(validReportIds)
            .ToList();

        if (invalidReportIds.Count > 0)
        {
            return BadRequest(new
            {
                message = "Có báo cáo không tồn tại hoặc đã ngừng hoạt động.",
                reportIds = invalidReportIds
            });
        }

        // =====================================================
        // LOAD EXISTING
        // =====================================================

        var existingPermissions = await _context.FactoryReports
            .Where(x =>
                factoryIds.Contains(x.FactoryId) &&
                reportIds.Contains(x.ReportId))
            .ToListAsync();

        // Tìm nhanh theo FactoryId + ReportId
        var existingByKey = existingPermissions
            .ToDictionary(
                x => (x.FactoryId, x.ReportId),
                x => x
            );

        var now = AppDateTime.Now;

        var insertedCount = 0;
        var reactivatedCount = 0;
        var unchangedCount = 0;

        // =====================================================
        // ASSIGN
        // =====================================================

        foreach (var factoryId in factoryIds)
        {
            foreach (var reportId in reportIds)
            {
                if (
                    existingByKey.TryGetValue(
                        (factoryId, reportId),
                        out var existing)
                )
                {
                    // Đã có và đang active
                    if (existing.IsActive)
                    {
                        unchangedCount++;
                        continue;
                    }

                    // Đã có nhưng inactive -> active lại
                    existing.IsActive = true;
                    existing.LastUpdateDate = now;
                    existing.LastUpdateBy = currentUserId.Value;

                    reactivatedCount++;

                    continue;
                }

                // Chưa từng có -> insert
                var permission = new FactoryReport
                {
                    FactoryId = factoryId,
                    ReportId = reportId,

                    IsActive = true,

                    CreationDate = now,
                    CreatedBy = currentUserId.Value,

                    LastUpdateDate = now,
                    LastUpdateBy = currentUserId.Value
                };

                _context.FactoryReports.Add(permission);

                insertedCount++;
            }
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message =
                        "Không thể lưu phân quyền báo cáo cho nhà máy."
                }
            );
        }

        return Ok(new
        {
            message = "Phân quyền báo cáo cho nhà máy thành công.",

            factoryCount = factoryIds.Count,
            reportCount = reportIds.Count,

            insertedCount,
            reactivatedCount,
            unchangedCount,

            totalAssignments =
                factoryIds.Count * reportIds.Count
        });
    }
    // =========================================================
    // GET FACTORIES BY REPORT
    //
    // GET:
    // /api/factory-reports/by-report?reportId=1
    //
    // Trả về:
    // - thông tin Report
    // - TẤT CẢ Factory
    // - isAssigned = Factory có được cấp Report hay không
    // =========================================================

    [HttpGet("by-report")]
    public async Task<IActionResult> GetFactoriesByReport(
        [FromQuery] long reportId)
    {
        if (reportId <= 0)
        {
            return BadRequest(new
            {
                message = "Báo cáo không hợp lệ."
            });
        }

        // =====================================================
        // REPORT
        // =====================================================

        var report = await _context.Reports
            .AsNoTracking()
            .Where(x =>
                x.ReportId == reportId &&
                x.IsActive)
            .Select(x => new
            {
                x.ReportId,
                x.ReportCode,
                x.ReportName,
                x.ReportPath,
                x.Icon,
                x.SortOrder
            })
            .FirstOrDefaultAsync();

        if (report == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy báo cáo hoặc báo cáo đã ngừng hoạt động."
            });
        }

        // =====================================================
        // ALL FACTORIES + ASSIGNED STATUS
        // =====================================================

        var factories = await _context.Factories
            .AsNoTracking()
            .OrderBy(x => x.FactoryName)
            .Select(x => new
            {
                x.FactoryId,
                x.FactoryCode,
                x.FactoryName,

                IsAssigned =
                    _context.FactoryReports.Any(fr =>
                        fr.FactoryId == x.FactoryId &&
                        fr.ReportId == reportId &&
                        fr.IsActive)
            })
            .ToListAsync();

        return Ok(new
        {
            report,
            factories
        });
    }
}

// =========================================================
// REQUEST
// =========================================================

public class SaveFactoryReportsRequest
{
    public long FactoryId { get; set; }

    public List<long> ReportIds { get; set; } = new();
}

public class AssignFactoryReportsRequest
{
    public List<long> FactoryIds { get; set; } =
        new();

    public List<long> ReportIds { get; set; } =
        new();
}

public class SaveReportFactoriesRequest
{
    public long ReportId { get; set; }

    public List<long> FactoryIds { get; set; } =
        new();
}