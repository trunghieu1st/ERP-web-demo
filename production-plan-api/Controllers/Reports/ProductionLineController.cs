using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Jobs.BackgroundJobs;
using production_plan_api.Jobs.BackgroundJobs.Handlers.ProductionLine;
using production_plan_api.Jobs.BackgroundJobs.Storage;
using production_plan_api.Services;

namespace production_plan_api.Controllers;

[ApiController]
[Authorize]
[Route("api/reports")]
public class ProductionLineController : ControllerBase
{
    private const string ExcelContentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private readonly CustomerDbContext _context;
    private readonly CurrentUserService _currentUser;
    private readonly IBackgroundJobQueue _backgroundJobQueue;
    private readonly IJobFileStorage _fileStorage;

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public ProductionLineController(
        CustomerDbContext context,
        CurrentUserService currentUser,
        IBackgroundJobQueue backgroundJobQueue,
        IJobFileStorage fileStorage)
    {
        _context = context;
        _currentUser = currentUser;
        _backgroundJobQueue = backgroundJobQueue;
        _fileStorage = fileStorage;
    }

    // =========================================================
    // 1. SEARCH PRODUCTION LINE
    //
    // GET:
    // /api/reports/production-lines
    //
    // Factory luôn lấy từ JWT.
    // =========================================================

    [HttpGet("production-lines")]
    public async Task<IActionResult> GetProductionLines(
        [FromQuery] long? factoryId,
        [FromQuery] long? userId,
        [FromQuery] long? productionLineId,
        CancellationToken cancellationToken)
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

        var scopedFactoryId =
            currentFactoryId.Value;

        // =====================================================
        // FACTORY PARAMETER
        //
        // Giữ để tương thích frontend cũ.
        // Security scope vẫn lấy từ JWT.
        // =====================================================

        if (
            factoryId.HasValue &&
            factoryId.Value != scopedFactoryId)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy dữ liệu trong Factory hiện tại."
            });
        }

        // =====================================================
        // VALIDATE USER
        // =====================================================

        if (userId.HasValue)
        {
            var userExists =
                await _context.Users
                    .AsNoTracking()
                    .AnyAsync(
                        x =>
                            x.UserId == userId.Value &&
                            x.FactoryId == scopedFactoryId &&
                            x.IsActive,
                        cancellationToken);

            if (!userExists)
            {
                return BadRequest(new
                {
                    message =
                        "User không tồn tại, đã khóa hoặc không thuộc Factory hiện tại."
                });
            }
        }

        // =====================================================
        // VALIDATE PRODUCTION LINE
        // =====================================================

        if (productionLineId.HasValue)
        {
            var productionLineExists =
                await _context.ProductionLines
                    .AsNoTracking()
                    .AnyAsync(
                        x =>
                            x.ProductionLineId ==
                                productionLineId.Value &&
                            x.FactoryId ==
                                scopedFactoryId &&
                            x.IsActive,
                        cancellationToken);

            if (!productionLineExists)
            {
                return BadRequest(new
                {
                    message =
                        "Chuyền không tồn tại, đã khóa hoặc không thuộc Factory hiện tại."
                });
            }
        }

        // =====================================================
        // QUERY
        // =====================================================

        var query =
            _context.ExportProductionLines
                .AsNoTracking()
                .Where(x =>
                    x.FactoryId ==
                    scopedFactoryId);

        if (userId.HasValue)
        {
            query =
                query.Where(x =>
                    x.UserId ==
                    userId.Value);
        }

        if (productionLineId.HasValue)
        {
            query =
                query.Where(x =>
                    x.ProductionLineId ==
                    productionLineId.Value);
        }

        var data =
            await query
                .OrderBy(x =>
                    x.FactoryCode)
                .ThenBy(x =>
                    x.Username)
                .ThenBy(x =>
                    x.LineCode)
                .ThenBy(x =>
                    x.ProductionLineId)
                .Select(x => new
                {
                    factoryId =
                        x.FactoryId,

                    factoryCode =
                        x.FactoryCode,

                    factoryName =
                        x.FactoryName,

                    userId =
                        x.UserId,

                    username =
                        x.Username,

                    productionLineId =
                        x.ProductionLineId,

                    lineCode =
                        x.LineCode,

                    lineName =
                        x.LineName
                })
                .ToListAsync(
                    cancellationToken);

        return Ok(new
        {
            total = data.Count,
            data
        });
    }

    // =========================================================
    // 2. START EXPORT
    //
    // POST:
    // /api/reports/production-lines/export
    // =========================================================

    [HttpPost("production-lines/export")]
    public async Task<IActionResult> ExportProductionLines(
        [FromBody] ProductionLineExportRequest request,
        CancellationToken cancellationToken)
    {
        var currentUserId =
            _currentUser.UserId;

        var factoryId =
            _currentUser.FactoryId;

        if (!currentUserId.HasValue)
        {
            return Unauthorized();
        }

        if (
            !factoryId.HasValue ||
            factoryId.Value <= 0)
        {
            return Forbid();
        }

        // =====================================================
        // VALIDATE USER FILTER
        // =====================================================

        if (request.UserId.HasValue)
        {
            var userExists =
                await _context.Users
                    .AsNoTracking()
                    .AnyAsync(
                        x =>
                            x.UserId ==
                                request.UserId.Value &&
                            x.FactoryId ==
                                factoryId.Value &&
                            x.IsActive,
                        cancellationToken);

            if (!userExists)
            {
                return BadRequest(new
                {
                    message =
                        "User không tồn tại, đã khóa hoặc không thuộc Factory hiện tại."
                });
            }
        }

        // =====================================================
        // VALIDATE PRODUCTION LINE FILTER
        // =====================================================

        if (request.ProductionLineId.HasValue)
        {
            var productionLineExists =
                await _context.ProductionLines
                    .AsNoTracking()
                    .AnyAsync(
                        x =>
                            x.ProductionLineId ==
                                request.ProductionLineId.Value &&
                            x.FactoryId ==
                                factoryId.Value &&
                            x.IsActive,
                        cancellationToken);

            if (!productionLineExists)
            {
                return BadRequest(new
                {
                    message =
                        "Chuyền không tồn tại, đã khóa hoặc không thuộc Factory hiện tại."
                });
            }
        }

        // =====================================================
        // PAYLOAD
        //
        // FactoryId KHÔNG lấy từ frontend.
        // =====================================================

        var payload =
            new ProductionLineExportPayload
            {
                UserId =
                    request.UserId,

                ProductionLineId =
                    request.ProductionLineId
            };

        var payloadJson =
            JsonSerializer.Serialize(
                payload);

        // =====================================================
        // ENQUEUE
        // =====================================================

        var job =
            await _backgroundJobQueue.EnqueueAsync(
                ProductionLineExportHandler.Type,
                payloadJson,
                currentUserId.Value,
                factoryId.Value,
                maxRetries: 3,
                cancellationToken);

        return Accepted(new
        {
            jobId =
                job.JobId,

            status =
                job.Status
        });
    }

    // =========================================================
    // 3. GET EXPORT STATUS
    //
    // GET:
    // /api/reports/production-lines/export/{jobId}
    //
    // Chỉ owner + cùng Factory.
    // =========================================================

    [HttpGet(
        "production-lines/export/{jobId:guid}")]
    public async Task<IActionResult>
        GetProductionLineExportStatus(
            Guid jobId,
            CancellationToken cancellationToken)
    {
        var currentUserId =
            _currentUser.UserId;

        var currentFactoryId =
            _currentUser.FactoryId;

        if (
            !currentUserId.HasValue ||
            !currentFactoryId.HasValue ||
            currentFactoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập hoặc Factory."
            });
        }

        // =====================================================
        // LẤY TRỰC TIẾP TỪ POSTGRESQL
        //
        // Security được đưa luôn vào WHERE.
        // =====================================================

        var job =
            await _context.BackgroundJobs
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.JobId == jobId &&
                        x.JobType ==
                            ProductionLineExportHandler.Type &&
                        x.RequestedByUserId ==
                            currentUserId.Value &&
                        x.FactoryId ==
                            currentFactoryId.Value,
                    cancellationToken);

        if (job == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy Export Job."
            });
        }

        string? fileName =
            null;

        if (job.ResultJson != null)
        {
            if (
                job.ResultJson.RootElement
                    .TryGetProperty(
                        "fileName",
                        out var fileNameElement))
            {
                fileName =
                    fileNameElement.GetString();
            }
        }

        string? downloadUrl =
            null;

        if (job.Status == "COMPLETED")
        {
            downloadUrl =
                $"/api/reports/production-lines/export/{job.JobId}/download";
        }

        return Ok(new
        {
            jobId =
                job.JobId,

            jobType =
                job.JobType,

            status =
                job.Status,

            progress =
                job.Progress,

            fileName,

            downloadUrl,

            errorMessage =
                job.ErrorMessage,

            retryCount =
                job.RetryCount,

            maxRetries =
                job.MaxRetries,

            createdAt =
                job.CreatedAt,

            startedAt =
                job.StartedAt,

            completedAt =
                job.CompletedAt
        });
    }

    // =========================================================
    // 4. DOWNLOAD EXPORT
    //
    // GET:
    // /api/reports/production-lines/export/{jobId}/download
    //
    // Chỉ owner + cùng Factory.
    // =========================================================

    [HttpGet(
        "production-lines/export/{jobId:guid}/download")]
    public async Task<IActionResult>
        DownloadProductionLineExport(
            Guid jobId,
            CancellationToken cancellationToken)
    {
        var currentUserId =
            _currentUser.UserId;

        var currentFactoryId =
            _currentUser.FactoryId;

        if (
            !currentUserId.HasValue ||
            !currentFactoryId.HasValue ||
            currentFactoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập hoặc Factory."
            });
        }

        // =====================================================
        // JOB + SECURITY
        // =====================================================

        var job =
            await _context.BackgroundJobs
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.JobId == jobId &&
                        x.JobType ==
                            ProductionLineExportHandler.Type &&
                        x.RequestedByUserId ==
                            currentUserId.Value &&
                        x.FactoryId ==
                            currentFactoryId.Value,
                    cancellationToken);

        if (job == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy Export Job."
            });
        }

        // =====================================================
        // STATUS
        // =====================================================

        if (job.Status != "COMPLETED")
        {
            return BadRequest(new
            {
                message =
                    "File Excel chưa sẵn sàng.",

                status =
                    job.Status
            });
        }

        // =====================================================
        // RESULT JSON
        // =====================================================

        if (job.ResultJson == null)
        {
            return NotFound(new
            {
                message =
                    "Export Job không có thông tin file."
            });
        }

        var result =
            job.ResultJson.RootElement;

        if (
            !result.TryGetProperty(
                "storageKey",
                out var storageKeyElement))
        {
            return NotFound(new
            {
                message =
                    "Export Job không có storage key."
            });
        }

        var storageKey =
            storageKeyElement.GetString();

        if (string.IsNullOrWhiteSpace(
            storageKey))
        {
            return NotFound(new
            {
                message =
                    "Storage key không hợp lệ."
            });
        }

        // =====================================================
        // FILE NAME
        // =====================================================

        string downloadFileName =
            "ProductionLine.xlsx";

        if (
            result.TryGetProperty(
                "fileName",
                out var fileNameElement))
        {
            var resultFileName =
                fileNameElement.GetString();

            if (!string.IsNullOrWhiteSpace(
                resultFileName))
            {
                downloadFileName =
                    resultFileName;
            }
        }

        // =====================================================
        // CONTENT TYPE
        // =====================================================

        var contentType =
            ExcelContentType;

        if (
            result.TryGetProperty(
                "contentType",
                out var contentTypeElement))
        {
            var resultContentType =
                contentTypeElement.GetString();

            if (!string.IsNullOrWhiteSpace(
                resultContentType))
            {
                contentType =
                    resultContentType;
            }
        }

        // =====================================================
        // CHECK STORAGE
        // =====================================================

        var exists =
            await _fileStorage.ExistsAsync(
                storageKey,
                cancellationToken);

        if (!exists)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy file Export trong storage."
            });
        }

        // =====================================================
        // OPEN STREAM
        // =====================================================

        var stream =
            await _fileStorage.OpenReadAsync(
                storageKey,
                cancellationToken);

        return File(
            stream,
            contentType,
            downloadFileName);
    }
}

// =============================================================
// REQUEST DTO
// =============================================================

public class ProductionLineExportRequest
{
    public long? UserId { get; set; }

    public long? ProductionLineId { get; set; }
}