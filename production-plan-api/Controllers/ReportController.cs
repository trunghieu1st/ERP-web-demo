using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Helpers;
using production_plan_api.Models;
using production_plan_api.Services;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportController : ControllerBase
{
    private readonly CustomerDbContext _context;
    private readonly CurrentUserService _currentUser;

    public ReportController(
        CustomerDbContext context,
        CurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    // =========================================================
    // GET ALL REPORTS
    // GET: /api/reports
    //
    // Report là GLOBAL MASTER.
    // Không filter theo Factory tại đây.
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetReports()
    {
        var reports = await _context.Reports
            .AsNoTracking()
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
                x.IsActive,
                x.Description,
                x.CreationDate,
                x.CreatedBy,
                x.LastUpdateDate,
                x.LastUpdateBy
            })
            .ToListAsync();

        return Ok(reports);
    }

    // =========================================================
    // GET ONE REPORT
    // GET: /api/reports/1
    // =========================================================

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetReport(long id)
    {
        var report = await _context.Reports
            .AsNoTracking()
            .Where(x => x.ReportId == id)
            .Select(x => new
            {
                x.ReportId,
                x.ReportCode,
                x.ReportName,
                x.ReportPath,
                x.Icon,
                x.SortOrder,
                x.IsActive,
                x.Description,
                x.CreationDate,
                x.CreatedBy,
                x.LastUpdateDate,
                x.LastUpdateBy
            })
            .FirstOrDefaultAsync();

        if (report == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy báo cáo."
            });
        }

        return Ok(report);
    }

    // =========================================================
    // CREATE REPORT
    // POST: /api/reports
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> CreateReport(
        [FromBody] CreateReportRequest request)
    {
        var currentUserId = _currentUser.UserId;

        if (currentUserId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập."
            });
        }

        var reportCode =
            request.ReportCode?.Trim() ?? "";

        var reportName =
            request.ReportName?.Trim() ?? "";

        var reportPath =
            request.ReportPath?.Trim() ?? "";

        // -----------------------------------------------------
        // VALIDATE
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(reportCode))
        {
            return BadRequest(new
            {
                message = "Mã báo cáo không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(reportName))
        {
            return BadRequest(new
            {
                message = "Tên báo cáo không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(reportPath))
        {
            return BadRequest(new
            {
                message = "Đường dẫn báo cáo không được để trống."
            });
        }

        // -----------------------------------------------------
        // CHECK DUPLICATE REPORT CODE
        // -----------------------------------------------------

        var duplicateCode =
            await _context.Reports.AnyAsync(x =>
                x.ReportCode.ToLower() ==
                reportCode.ToLower());

        if (duplicateCode)
        {
            return BadRequest(new
            {
                message =
                    $"Mã báo cáo '{reportCode}' đã tồn tại."
            });
        }

        // -----------------------------------------------------
        // CREATE
        // -----------------------------------------------------

        var now = AppDateTime.Now;

        var report = new Report
        {
            ReportCode = reportCode,

            ReportName = reportName,

            ReportPath = reportPath,

            Icon =
                string.IsNullOrWhiteSpace(request.Icon)
                    ? null
                    : request.Icon.Trim(),

            SortOrder = request.SortOrder,

            IsActive = request.IsActive,

            Description =
                string.IsNullOrWhiteSpace(request.Description)
                    ? null
                    : request.Description.Trim(),

            CreationDate = now,

            CreatedBy = currentUserId.Value,

            LastUpdateDate = now,

            LastUpdateBy = currentUserId.Value
        };

        _context.Reports.Add(report);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            return BadRequest(new
            {
                message =
                    "Không thể tạo báo cáo. Mã báo cáo có thể đã tồn tại.",

                error =
                    ex.InnerException?.Message ??
                    ex.Message
            });
        }

        return Ok(new
        {
            message = "Tạo báo cáo thành công.",
            reportId = report.ReportId
        });
    }

    // =========================================================
    // UPDATE REPORT
    // PUT: /api/reports/1
    // =========================================================

    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdateReport(
        long id,
        [FromBody] UpdateReportRequest request)
    {
        var currentUserId = _currentUser.UserId;

        if (currentUserId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập."
            });
        }

        var report =
            await _context.Reports
                .FirstOrDefaultAsync(x =>
                    x.ReportId == id);

        if (report == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy báo cáo."
            });
        }

        var reportCode =
            request.ReportCode?.Trim() ?? "";

        var reportName =
            request.ReportName?.Trim() ?? "";

        var reportPath =
            request.ReportPath?.Trim() ?? "";

        // -----------------------------------------------------
        // VALIDATE
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(reportCode))
        {
            return BadRequest(new
            {
                message = "Mã báo cáo không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(reportName))
        {
            return BadRequest(new
            {
                message = "Tên báo cáo không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(reportPath))
        {
            return BadRequest(new
            {
                message = "Đường dẫn báo cáo không được để trống."
            });
        }

        // -----------------------------------------------------
        // CHECK DUPLICATE REPORT CODE
        // -----------------------------------------------------

        var duplicateCode =
            await _context.Reports.AnyAsync(x =>
                x.ReportId != id &&
                x.ReportCode.ToLower() ==
                reportCode.ToLower());

        if (duplicateCode)
        {
            return BadRequest(new
            {
                message =
                    $"Mã báo cáo '{reportCode}' đã tồn tại."
            });
        }

        // -----------------------------------------------------
        // UPDATE
        // -----------------------------------------------------

        report.ReportCode = reportCode;

        report.ReportName = reportName;

        report.ReportPath = reportPath;

        report.Icon =
            string.IsNullOrWhiteSpace(request.Icon)
                ? null
                : request.Icon.Trim();

        report.SortOrder =
            request.SortOrder;

        report.IsActive =
            request.IsActive;

        report.Description =
            string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();

        report.LastUpdateDate =
            AppDateTime.Now;

        report.LastUpdateBy =
            currentUserId.Value;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return BadRequest(new
            {
                message =
                    "Không thể cập nhật báo cáo. Mã báo cáo có thể đã tồn tại."
            });
        }

        return Ok(new
        {
            message =
                "Cập nhật báo cáo thành công."
        });
    }

    // =========================================================
    // UPDATE STATUS
    // PUT: /api/reports/1/status
    // =========================================================

    [HttpPut("{id:long}/status")]
    public async Task<IActionResult> UpdateStatus(
        long id,
        [FromBody] UpdateReportStatusRequest request)
    {
        var currentUserId = _currentUser.UserId;

        if (currentUserId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập."
            });
        }

        var report =
            await _context.Reports
                .FirstOrDefaultAsync(x =>
                    x.ReportId == id);

        if (report == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy báo cáo."
            });
        }

        report.IsActive =
            request.IsActive;

        report.LastUpdateDate =
            AppDateTime.Now;

        report.LastUpdateBy =
            currentUserId.Value;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                request.IsActive
                    ? "Đã mở báo cáo."
                    : "Đã khóa báo cáo."
        });
    }

    // =========================================================
    // DELETE REPORT
    // DELETE: /api/reports/1
    // =========================================================

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteReport(long id)
    {
        var report =
            await _context.Reports
                .FirstOrDefaultAsync(x =>
                    x.ReportId == id);

        if (report == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy báo cáo."
            });
        }

        _context.Reports.Remove(report);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return BadRequest(new
            {
                message =
                    "Không thể xóa báo cáo vì báo cáo đã được phân quyền cho nhà máy hoặc phòng ban. " +
                    "Hãy xóa phân quyền trước hoặc khóa báo cáo."
            });
        }

        return Ok(new
        {
            message =
                "Xóa báo cáo thành công."
        });
    }

    // =========================================================
    // GET MY REPORTS
    // GET: /api/reports/my-reports
    // =========================================================

    [HttpGet("my-reports")]
    public async Task<IActionResult> GetMyReports()
    {
        // =====================================================
        // CURRENT USER FROM JWT
        // =====================================================

        var currentUserId =
            _currentUser.UserId;

        if (currentUserId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập."
            });
        }

        var factoryId =
            _currentUser.FactoryId;

        var departmentId =
            _currentUser.DepartmentId;

        var role =
            _currentUser.Role?
                .Trim()
                .ToUpperInvariant() ?? "";

        // =====================================================
        // CHECK FULL ACCESS
        //
        // Giữ nguyên nghiệp vụ cũ:
        // ADMIN hoặc IT = DepartmentId 13
        // =====================================================

        var isFullAccess =
            role == "ADMIN" ||
            departmentId == 13;

        // =====================================================
        // ADMIN / IT
        //
        // Trả tất cả report đang Active.
        // Không cần FactoryReport.
        // Không cần DepartmentReport.
        // =====================================================

        if (isFullAccess)
        {
            var allReports =
                await _context.Reports
                    .AsNoTracking()
                    .Where(x =>
                        x.IsActive)
                    .OrderBy(x =>
                        x.SortOrder)
                    .ThenBy(x =>
                        x.ReportName)
                    .Select(x => new
                    {
                        x.ReportId,
                        x.ReportCode,
                        x.ReportName,
                        x.ReportPath,
                        x.Icon,
                        x.SortOrder
                    })
                    .ToListAsync();

            return Ok(allReports);
        }

        // =====================================================
        // NORMAL USER
        //
        // User phải có FactoryId + DepartmentId.
        // =====================================================

        if (factoryId == null ||
            factoryId.Value <= 0)
        {
            return Ok(
                Array.Empty<object>()
            );
        }

        if (departmentId == null ||
            departmentId.Value <= 0)
        {
            return Ok(
                Array.Empty<object>()
            );
        }

        // =====================================================
        // GET ALLOWED REPORTS
        //
        // 1. Report Active
        //
        // 2. Factory được cấp quyền
        //
        // 3. Department được cấp quyền
        //    trong chính Factory đó
        // =====================================================

        var reports =
            await (
                from report
                    in _context.Reports.AsNoTracking()

                join factoryReport
                    in _context.FactoryReports.AsNoTracking()
                    on report.ReportId
                    equals factoryReport.ReportId

                join departmentReport
                    in _context.DepartmentReports.AsNoTracking()
                    on report.ReportId
                    equals departmentReport.ReportId

                where
                    report.IsActive &&

                    factoryReport.FactoryId ==
                        factoryId.Value &&

                    factoryReport.IsActive &&

                    departmentReport.FactoryId ==
                        factoryId.Value &&

                    departmentReport.DepartmentId ==
                        departmentId.Value &&

                    departmentReport.IsActive

                orderby
                    report.SortOrder,
                    report.ReportName

                select new
                {
                    report.ReportId,
                    report.ReportCode,
                    report.ReportName,
                    report.ReportPath,
                    report.Icon,
                    report.SortOrder
                }
            )
            .Distinct()
            .ToListAsync();

        return Ok(reports);
    }
}

// =========================================================
// REQUEST MODELS
// =========================================================

public class CreateReportRequest
{
    public string ReportCode { get; set; } = "";

    public string ReportName { get; set; } = "";

    public string ReportPath { get; set; } = "";

    public string? Icon { get; set; }

    public int SortOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public string? Description { get; set; }
}

public class UpdateReportRequest
{
    public string ReportCode { get; set; } = "";

    public string ReportName { get; set; } = "";

    public string ReportPath { get; set; } = "";

    public string? Icon { get; set; }

    public int SortOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public string? Description { get; set; }
}

public class UpdateReportStatusRequest
{
    public bool IsActive { get; set; }
}
