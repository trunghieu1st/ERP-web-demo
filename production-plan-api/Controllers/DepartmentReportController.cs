using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Helpers;
using production_plan_api.Models;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/department-reports")]
[Authorize]
public class DepartmentReportController : ControllerBase
{
    private readonly CustomerDbContext _context;

    public DepartmentReportController(CustomerDbContext context)
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
    // GET DEPARTMENT REPORT PERMISSIONS
    //
    // GET:
    // /api/department-reports?factoryId=1&departmentId=2
    //
    // Chỉ trả về những report:
    //
    // 1. Report đang active
    // 2. Factory đã được cấp quyền report
    //
    // Sau đó:
    // isAssigned = Department đã được cấp hay chưa
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetDepartmentReports(
        [FromQuery] long factoryId,
        [FromQuery] long departmentId)
    {
        // =====================================================
        // VALIDATE INPUT
        // =====================================================

        if (factoryId <= 0)
        {
            return BadRequest(new
            {
                message = "Nhà máy không hợp lệ."
            });
        }

        if (departmentId <= 0)
        {
            return BadRequest(new
            {
                message = "Phòng ban không hợp lệ."
            });
        }

        // =====================================================
        // CHECK FACTORY
        // =====================================================

        var factory =
            await _context.Factories
                .AsNoTracking()
                .Where(x =>
                    x.FactoryId == factoryId)
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

        // =====================================================
        // CHECK DEPARTMENT
        //
        // Department là danh mục dùng chung.
        //
        // KHÔNG kiểm tra FactoryId trong Department.
        // =====================================================

        var department =
            await _context.Departments
                .AsNoTracking()
                .Where(x =>
                    x.DepartmentId == departmentId)
                .Select(x => new
                {
                    x.DepartmentId,
                    x.DepartmentCode,
                    x.DepartmentName
                })
                .FirstOrDefaultAsync();

        if (department == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy phòng ban."
            });
        }

        // =====================================================
        // GET REPORTS ALLOWED FOR FACTORY
        //
        // Điều kiện:
        //
        // Report.IsActive = true
        //
        // +
        //
        // FactoryReport:
        // FactoryId = factory đang chọn
        // IsActive = true
        //
        // =====================================================

        var reports =
            await (
                from report
                    in _context.Reports.AsNoTracking()

                join factoryReport
                    in _context.FactoryReports.AsNoTracking()
                    on report.ReportId
                    equals factoryReport.ReportId

                where
                    report.IsActive &&
                    factoryReport.FactoryId == factoryId &&
                    factoryReport.IsActive

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
                    report.SortOrder,

                    IsAssigned =
                        _context.DepartmentReports.Any(
                            departmentReport =>
                                departmentReport.FactoryId ==
                                    factoryId &&

                                departmentReport.DepartmentId ==
                                    departmentId &&

                                departmentReport.ReportId ==
                                    report.ReportId &&

                                departmentReport.IsActive
                        )
                }
            )
            .ToListAsync();

        // =====================================================
        // RESULT
        // =====================================================

        return Ok(new
        {
            factory,
            department,
            reports
        });
    }

    // =========================================================
    // SAVE DEPARTMENT REPORT PERMISSIONS
    //
    // PUT:
    // /api/department-reports
    //
    // BODY:
    //
    // {
    //     "factoryId": 1,
    //     "departmentId": 2,
    //     "reportIds": [1, 2, 5]
    // }
    //
    // =========================================================

    [HttpPut]
    public async Task<IActionResult> SaveDepartmentReports(
        [FromBody] SaveDepartmentReportsRequest request)
    {
        // =====================================================
        // VALIDATE FACTORY ID
        // =====================================================

        if (request.FactoryId <= 0)
        {
            return BadRequest(new
            {
                message = "Nhà máy không hợp lệ."
            });
        }

        // =====================================================
        // VALIDATE DEPARTMENT ID
        // =====================================================

        if (request.DepartmentId <= 0)
        {
            return BadRequest(new
            {
                message = "Phòng ban không hợp lệ."
            });
        }

        // =====================================================
        // CHECK FACTORY EXISTS
        // =====================================================

        var factoryExists =
            await _context.Factories
                .AnyAsync(x =>
                    x.FactoryId ==
                    request.FactoryId);

        if (!factoryExists)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhà máy."
            });
        }

        // =====================================================
        // CHECK DEPARTMENT EXISTS
        //
        // Department dùng chung cho tất cả Factory.
        //
        // Vì vậy chỉ check DepartmentId.
        // =====================================================

        var departmentExists =
            await _context.Departments
                .AnyAsync(x =>
                    x.DepartmentId ==
                    request.DepartmentId);

        if (!departmentExists)
        {
            return NotFound(new
            {
                message = "Không tìm thấy phòng ban."
            });
        }

        // =====================================================
        // CLEAN REPORT IDS
        //
        // Loại:
        // - ID <= 0
        // - ID bị trùng
        // =====================================================

        var selectedReportIds =
            (request.ReportIds ?? new List<long>())
                .Where(x => x > 0)
                .Distinct()
                .ToList();

        // =====================================================
        // GET REPORTS FACTORY IS ALLOWED TO USE
        //
        // Đây là phần quan trọng nhất.
        //
        // Department chỉ được phép nhận Report
        // mà Factory đã được cấp quyền.
        // =====================================================

        var factoryAllowedReportIds =
            await (
                from report
                    in _context.Reports.AsNoTracking()

                join factoryReport
                    in _context.FactoryReports.AsNoTracking()
                    on report.ReportId
                    equals factoryReport.ReportId

                where
                    report.IsActive &&

                    factoryReport.FactoryId ==
                        request.FactoryId &&

                    factoryReport.IsActive

                select report.ReportId
            )
            .Distinct()
            .ToListAsync();

        // =====================================================
        // VALIDATE SELECTED REPORTS
        //
        // Nếu frontend cố gửi report mà Factory
        // chưa được cấp -> không cho lưu.
        // =====================================================

        var invalidReportIds =
            selectedReportIds
                .Except(factoryAllowedReportIds)
                .ToList();

        if (invalidReportIds.Count > 0)
        {
            return BadRequest(new
            {
                message =
                    "Có báo cáo chưa được cấp quyền cho nhà máy hoặc đang bị khóa.",

                reportIds =
                    invalidReportIds
            });
        }

        // =====================================================
        // GET EXISTING DEPARTMENT PERMISSIONS
        //
        // QUAN TRỌNG:
        //
        // Mặc dù Department là danh mục chung,
        // quyền Department Report vẫn phải theo:
        //
        // Factory + Department
        //
        // =====================================================

        var existingPermissions =
            await _context.DepartmentReports
                .Where(x =>
                    x.FactoryId ==
                        request.FactoryId &&

                    x.DepartmentId ==
                        request.DepartmentId)
                .ToListAsync();

        // =====================================================
        // AUDIT
        // =====================================================

        var currentUserId =
            GetCurrentUserId();

        // Database đang dùng:
        // timestamp without time zone
        var now =
            AppDateTime.Now;

        // =====================================================
        // UPDATE EXISTING PERMISSIONS
        //
        // Report được chọn:
        //      is_active = true
        //
        // Report không được chọn:
        //      is_active = false
        //
        // Không DELETE record.
        // =====================================================

        foreach (var permission in existingPermissions)
        {
            var shouldBeActive =
                selectedReportIds.Contains(
                    permission.ReportId)
                &&
                factoryAllowedReportIds.Contains(
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

        // =====================================================
        // EXISTING REPORT IDS
        // =====================================================

        var existingReportIds =
            existingPermissions
                .Select(x => x.ReportId)
                .ToHashSet();

        // =====================================================
        // FIND NEW REPORT PERMISSIONS
        // =====================================================

        var newReportIds =
            selectedReportIds
                .Where(reportId =>
                    !existingReportIds.Contains(
                        reportId))
                .ToList();

        // =====================================================
        // INSERT NEW PERMISSIONS
        // =====================================================

        foreach (var reportId in newReportIds)
        {
            var permission =
                new DepartmentReport
                {
                    FactoryId =
                        request.FactoryId,

                    DepartmentId =
                        request.DepartmentId,

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

            _context.DepartmentReports.Add(
                permission);
        }

        // =====================================================
        // SAVE
        // =====================================================

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            return BadRequest(new
            {
                message =
                    "Không thể lưu phân quyền báo cáo cho phòng ban.",

                error =
                    ex.InnerException?.Message ??
                    ex.Message
            });
        }

        // =====================================================
        // RESULT
        // =====================================================

        return Ok(new
        {
            message =
                "Lưu phân quyền báo cáo cho phòng ban thành công.",

            factoryId =
                request.FactoryId,

            departmentId =
                request.DepartmentId,

            assignedCount =
                selectedReportIds.Count
        });
    }

    // =========================================================
    // GET REPORTS ALLOWED FOR FACTORY
    //
    // GET:
    // /api/department-reports/factory-reports?factoryId=1
    //
    // Màn hình phân quyền phòng ban dùng API này để hiển thị
    // TẤT CẢ báo cáo đã được cấp cho nhà máy.
    //
    // Không phụ thuộc Department.
    // =========================================================

    [HttpGet("factory-reports")]
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

        // =====================================================
        // CHECK FACTORY
        // =====================================================

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

        // =====================================================
        // GET REPORTS ALLOWED FOR FACTORY
        //
        // Điều kiện:
        // Report Active
        // +
        // FactoryReport Active
        // =====================================================

        var reports = await (
            from report in _context.Reports.AsNoTracking()

            join factoryReport
                in _context.FactoryReports.AsNoTracking()
                on report.ReportId
                equals factoryReport.ReportId

            where
                report.IsActive &&
                factoryReport.FactoryId == factoryId &&
                factoryReport.IsActive

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
        .ToListAsync();

        return Ok(new
        {
            factory,
            reports
        });
    }

    // =========================================================
    // ASSIGN REPORTS TO MULTIPLE DEPARTMENTS
    //
    // POST:
    // /api/department-reports/assign
    //
    // BODY:
    // {
    //     "factoryId": 1,
    //     "departmentIds": [1, 2, 3],
    //     "reportIds": [5, 8, 10]
    // }
    //
    // QUAN TRỌNG:
    //
    // API này chỉ:
    // - thêm quyền mới
    // - kích hoạt lại quyền cũ
    //
    // KHÔNG xóa / disable các quyền khác đang tồn tại.
    // =========================================================

    [HttpPost("assign")]
    public async Task<IActionResult> AssignReports(
        [FromBody] AssignDepartmentReportsRequest request)
    {
        // =====================================================
        // VALIDATE REQUEST
        // =====================================================

        if (request.FactoryId <= 0)
        {
            return BadRequest(new
            {
                message = "Nhà máy không hợp lệ."
            });
        }

        var departmentIds = request.DepartmentIds
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        var reportIds = request.ReportIds
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        if (departmentIds.Count == 0)
        {
            return BadRequest(new
            {
                message =
                    "Vui lòng chọn ít nhất một phòng ban."
            });
        }

        if (reportIds.Count == 0)
        {
            return BadRequest(new
            {
                message =
                    "Vui lòng chọn ít nhất một báo cáo."
            });
        }

        // =====================================================
        // CURRENT USER
        // =====================================================

        var currentUserId = GetCurrentUserId();

        if (currentUserId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập."
            });
        }

        // =====================================================
        // CHECK FACTORY
        // =====================================================

        var factoryExists = await _context.Factories
            .AsNoTracking()
            .AnyAsync(x =>
                x.FactoryId == request.FactoryId);

        if (!factoryExists)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhà máy."
            });
        }

        // =====================================================
        // CHECK DEPARTMENTS
        //
        // Department của hệ thống b là danh mục GLOBAL,
        // nên KHÔNG filter theo FactoryId.
        // =====================================================

        var validDepartmentIds =
            await _context.Departments
                .AsNoTracking()
                .Where(x =>
                    departmentIds.Contains(
                        x.DepartmentId))
                .Select(x => x.DepartmentId)
                .ToListAsync();

        var invalidDepartmentIds =
            departmentIds
                .Except(validDepartmentIds)
                .ToList();

        if (invalidDepartmentIds.Count > 0)
        {
            return BadRequest(new
            {
                message =
                    "Có phòng ban không tồn tại.",

                departmentIds =
                    invalidDepartmentIds
            });
        }

        // =====================================================
        // CHECK REPORTS ALLOWED FOR FACTORY
        //
        // Chỉ được phân quyền các report:
        //
        // Report Active
        // +
        // FactoryReport Active
        //
        // của Factory đang chọn.
        // =====================================================

        var factoryAllowedReportIds =
            await (
                from report
                    in _context.Reports.AsNoTracking()

                join factoryReport
                    in _context.FactoryReports.AsNoTracking()
                    on report.ReportId
                    equals factoryReport.ReportId

                where
                    report.IsActive &&

                    factoryReport.FactoryId ==
                        request.FactoryId &&

                    factoryReport.IsActive &&

                    reportIds.Contains(
                        report.ReportId)

                select report.ReportId
            )
            .Distinct()
            .ToListAsync();

        // =====================================================
        // REPORT KHÔNG ĐƯỢC FACTORY SỬ DỤNG
        // =====================================================

        var invalidReportIds =
            reportIds
                .Except(factoryAllowedReportIds)
                .ToList();

        if (invalidReportIds.Count > 0)
        {
            return BadRequest(new
            {
                message =
                    "Có báo cáo chưa được cấp quyền cho nhà máy.",

                reportIds =
                    invalidReportIds
            });
        }

        // =====================================================
        // LOAD EXISTING PERMISSIONS
        //
        // Chỉ load đúng:
        // Factory hiện tại
        // +
        // các Department đang chọn
        // +
        // các Report đang chọn
        // =====================================================

        var existingPermissions =
            await _context.DepartmentReports
                .Where(x =>
                    x.FactoryId ==
                        request.FactoryId &&

                    departmentIds.Contains(
                        x.DepartmentId) &&

                    reportIds.Contains(
                        x.ReportId))
                .ToListAsync();

        var now = AppDateTime.Now;

        var insertedCount = 0;
        var reactivatedCount = 0;
        var unchangedCount = 0;

        // =====================================================
        // ASSIGN
        // =====================================================

        foreach (
            var departmentId
            in departmentIds)
        {
            foreach (
                var reportId
                in reportIds)
            {
                var existing =
                    existingPermissions
                        .FirstOrDefault(x =>
                            x.DepartmentId ==
                                departmentId &&

                            x.ReportId ==
                                reportId);

                // =============================================
                // CHƯA TỪNG CÓ
                // -> INSERT
                // =============================================

                if (existing == null)
                {
                    var permission =
                        new DepartmentReport
                        {
                            FactoryId =
                                request.FactoryId,

                            DepartmentId =
                                departmentId,

                            ReportId =
                                reportId,

                            IsActive = true,

                            CreationDate =
                                now,

                            CreatedBy =
                                currentUserId.Value,

                            LastUpdateDate =
                                now,

                            LastUpdateBy =
                                currentUserId.Value
                        };

                    _context.DepartmentReports
                        .Add(permission);

                    insertedCount++;

                    continue;
                }

                // =============================================
                // ĐÃ CÓ NHƯNG ĐANG DISABLE
                // -> ACTIVE LẠI
                // =============================================

                if (!existing.IsActive)
                {
                    existing.IsActive =
                        true;

                    existing.LastUpdateDate =
                        now;

                    existing.LastUpdateBy =
                        currentUserId.Value;

                    reactivatedCount++;

                    continue;
                }

                // =============================================
                // ĐÃ CÓ VÀ ĐANG ACTIVE
                // -> KHÔNG LÀM GÌ
                // =============================================

                unchangedCount++;
            }
        }

        // =====================================================
        // SAVE
        // =====================================================

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
                        "Không thể lưu phân quyền báo cáo. Vui lòng kiểm tra dữ liệu và thử lại."
                });
        }

        // =====================================================
        // RESULT
        // =====================================================

        return Ok(new
        {
            message =
                "Phân quyền báo cáo thành công.",

            factoryId =
                request.FactoryId,

            departmentCount =
                departmentIds.Count,

            reportCount =
                reportIds.Count,

            insertedCount,

            reactivatedCount,

            unchangedCount,

            totalAssignments =
                departmentIds.Count *
                reportIds.Count
        });
    }
    // =========================================================
    // GET DEPARTMENTS BY REPORT
    //
    // GET:
    // /api/department-reports/by-report
    //     ?factoryId=1
    //     &reportId=2
    // =========================================================

    [HttpGet("by-report")]
    public async Task<IActionResult> GetDepartmentsByReport(
        [FromQuery] long factoryId,
        [FromQuery] long reportId)
    {
        if (factoryId <= 0)
        {
            return BadRequest(new
            {
                message = "Nhà máy không hợp lệ."
            });
        }

        if (reportId <= 0)
        {
            return BadRequest(new
            {
                message = "Báo cáo không hợp lệ."
            });
        }

        // =====================================================
        // CHECK FACTORY
        // =====================================================

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

        // =====================================================
        // CHECK REPORT ALLOWED FOR FACTORY
        // =====================================================

        var report = await (
            from r in _context.Reports.AsNoTracking()

            join fr in _context.FactoryReports.AsNoTracking()
                on r.ReportId equals fr.ReportId

            where
                r.ReportId == reportId &&
                r.IsActive &&
                fr.FactoryId == factoryId &&
                fr.IsActive

            select new
            {
                r.ReportId,
                r.ReportCode,
                r.ReportName,
                r.ReportPath
            }
        )
        .FirstOrDefaultAsync();

        if (report == null)
        {
            return NotFound(new
            {
                message =
                    "Báo cáo chưa được cấp quyền cho nhà máy."
            });
        }

        // =====================================================
        // DEPARTMENTS
        //
        // Department là GLOBAL.
        // Không filter Department theo Factory.
        // =====================================================

        var departments = await _context.Departments
            .AsNoTracking()
            .OrderBy(x => x.DepartmentName)
            .Select(x => new
            {
                x.DepartmentId,
                x.DepartmentCode,
                x.DepartmentName,

                IsAssigned = _context.DepartmentReports.Any(dr =>
                    dr.FactoryId == factoryId &&
                    dr.DepartmentId == x.DepartmentId &&
                    dr.ReportId == reportId &&
                    dr.IsActive)
            })
            .ToListAsync();

        return Ok(new
        {
            factory,
            report,
            departments
        });
    }

    // =========================================================
    // SAVE DEPARTMENTS BY REPORT
    //
    // PUT:
    // /api/department-reports/by-report
    //
    // BODY:
    // {
    //   "factoryId": 1,
    //   "reportId": 2,
    //   "departmentIds": [1, 3, 5]
    // }
    //
    // API này là SYNC:
    // - Có trong departmentIds => Active
    // - Không có              => Inactive
    // =========================================================

    [HttpPut("by-report")]
    public async Task<IActionResult> SaveDepartmentsByReport(
        [FromBody] SaveReportDepartmentsRequest request)
    {
        if (request.FactoryId <= 0)
        {
            return BadRequest(new
            {
                message = "Nhà máy không hợp lệ."
            });
        }

        if (request.ReportId <= 0)
        {
            return BadRequest(new
            {
                message = "Báo cáo không hợp lệ."
            });
        }

        var currentUserId = GetCurrentUserId();

        if (currentUserId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập."
            });
        }

        var departmentIds = request.DepartmentIds
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        // =====================================================
        // CHECK FACTORY
        // =====================================================

        var factoryExists = await _context.Factories
            .AsNoTracking()
            .AnyAsync(x =>
                x.FactoryId == request.FactoryId);

        if (!factoryExists)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhà máy."
            });
        }

        // =====================================================
        // CHECK REPORT ALLOWED FOR FACTORY
        // =====================================================

        var reportAllowed = await (
            from report in _context.Reports.AsNoTracking()

            join factoryReport
                in _context.FactoryReports.AsNoTracking()
                on report.ReportId
                equals factoryReport.ReportId

            where
                report.ReportId == request.ReportId &&
                report.IsActive &&
                factoryReport.FactoryId == request.FactoryId &&
                factoryReport.IsActive

            select report.ReportId
        )
        .AnyAsync();

        if (!reportAllowed)
        {
            return BadRequest(new
            {
                message =
                    "Báo cáo chưa được cấp quyền cho nhà máy."
            });
        }

        // =====================================================
        // VALIDATE DEPARTMENTS
        // =====================================================

        if (departmentIds.Count > 0)
        {
            var validDepartmentIds = await _context.Departments
                .AsNoTracking()
                .Where(x =>
                    departmentIds.Contains(x.DepartmentId))
                .Select(x => x.DepartmentId)
                .ToListAsync();

            var invalidDepartmentIds = departmentIds
                .Except(validDepartmentIds)
                .ToList();

            if (invalidDepartmentIds.Count > 0)
            {
                return BadRequest(new
                {
                    message =
                        "Có phòng ban không tồn tại.",

                    departmentIds =
                        invalidDepartmentIds
                });
            }
        }

        // =====================================================
        // EXISTING PERMISSIONS
        // =====================================================

        var existingPermissions =
            await _context.DepartmentReports
                .Where(x =>
                    x.FactoryId == request.FactoryId &&
                    x.ReportId == request.ReportId)
                .ToListAsync();

        var now = AppDateTime.Now;

        // =====================================================
        // UPDATE EXISTING
        // =====================================================

        foreach (var permission in existingPermissions)
        {
            var shouldBeActive =
                departmentIds.Contains(
                    permission.DepartmentId);

            if (permission.IsActive != shouldBeActive)
            {
                permission.IsActive = shouldBeActive;
                permission.LastUpdateDate = now;
                permission.LastUpdateBy =
                    currentUserId.Value;
            }
        }

        // =====================================================
        // INSERT NEW
        // =====================================================

        var existingDepartmentIds =
            existingPermissions
                .Select(x => x.DepartmentId)
                .ToHashSet();

        foreach (var departmentId in departmentIds)
        {
            if (existingDepartmentIds.Contains(departmentId))
            {
                continue;
            }

            _context.DepartmentReports.Add(
                new DepartmentReport
                {
                    FactoryId = request.FactoryId,
                    DepartmentId = departmentId,
                    ReportId = request.ReportId,

                    IsActive = true,

                    CreationDate = now,
                    CreatedBy = currentUserId.Value,

                    LastUpdateDate = now,
                    LastUpdateBy = currentUserId.Value
                });
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
                        "Không thể lưu phân quyền báo cáo."
                });
        }

        return Ok(new
        {
            message =
                "Lưu phân quyền báo cáo thành công.",

            factoryId = request.FactoryId,
            reportId = request.ReportId,
            assignedDepartmentCount =
                departmentIds.Count
        });
    }

}


// =========================================================
// REQUEST MODEL
// =========================================================

public class SaveDepartmentReportsRequest
{
    public long FactoryId { get; set; }

    public long DepartmentId { get; set; }

    public List<long> ReportIds { get; set; }
        = new();
}

public class AssignDepartmentReportsRequest
{
    public long FactoryId { get; set; }

    public List<long> DepartmentIds { get; set; } =
        new();

    public List<long> ReportIds { get; set; } =
        new();
}

public class SaveReportDepartmentsRequest
{
    public long FactoryId { get; set; }

    public long ReportId { get; set; }

    public List<long> DepartmentIds { get; set; } =
        new();
}