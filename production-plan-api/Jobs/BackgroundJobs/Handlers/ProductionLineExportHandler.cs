using System.Text.Json;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Jobs.BackgroundJobs.Storage;
using production_plan_api.Models;

namespace production_plan_api.Jobs.BackgroundJobs.Handlers.ProductionLine;

public class ProductionLineExportHandler
    : IBackgroundJobHandler
{
    public const string Type =
        "EXPORT_PRODUCTION_LINE";

    public string JobType => Type;

    private readonly CustomerDbContext _context;
    private readonly IJobFileStorage _storage;

    public ProductionLineExportHandler(
        CustomerDbContext context,
        IJobFileStorage storage)
    {
        _context = context;
        _storage = storage;
    }

    public async Task<string?> HandleAsync(
        BackgroundJob job,
        CancellationToken cancellationToken)
    {
        if (!job.FactoryId.HasValue)
            throw new InvalidOperationException(
                $"Job {job.JobId} does not have factory scope.");

        var payload =
            job.PayloadJson == null
                ? new ProductionLineExportPayload()
                : job.PayloadJson
                      .Deserialize<ProductionLineExportPayload>(
                          new JsonSerializerOptions
                          {
                              PropertyNameCaseInsensitive = true
                          })
                  ?? new ProductionLineExportPayload();

        var factoryId =
            job.FactoryId.Value;

        var query =
            _context.ExportProductionLines
                .AsNoTracking()
                .Where(x =>
                    x.FactoryId == factoryId);

        if (payload.UserId.HasValue)
        {
            query =
                query.Where(x =>
                    x.UserId ==
                    payload.UserId.Value);
        }

        if (payload.ProductionLineId.HasValue)
        {
            query =
                query.Where(x =>
                    x.ProductionLineId ==
                    payload.ProductionLineId.Value);
        }

        var rows =
            await query
                .OrderBy(x => x.LineCode)
                .ThenBy(x => x.ProductionLineId)
                .Select(x => new
                {
                    x.FactoryCode,
                    x.FactoryName,
                    x.Username,
                    x.LineCode,
                    x.LineName
                })
                .ToListAsync(
                    cancellationToken);

        using var workbook =
            new XLWorkbook();

        var worksheet =
            workbook.Worksheets.Add(
                "Production Lines");

        worksheet.Cell(1, 1).Value = "STT";
        worksheet.Cell(1, 2).Value = "Factory Code";
        worksheet.Cell(1, 3).Value = "Factory Name";
        worksheet.Cell(1, 4).Value = "Username";
        worksheet.Cell(1, 5).Value = "Line Code";
        worksheet.Cell(1, 6).Value = "Line Name";

        var header =
            worksheet.Range(1, 1, 1, 6);

        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor =
            XLColor.LightGray;

        var rowNumber = 2;

        foreach (var item in rows)
        {
            worksheet.Cell(rowNumber, 1).Value =
                rowNumber - 1;

            worksheet.Cell(rowNumber, 2).Value =
                item.FactoryCode ?? string.Empty;

            worksheet.Cell(rowNumber, 3).Value =
                item.FactoryName ?? string.Empty;

            worksheet.Cell(rowNumber, 4).Value =
                item.Username ?? string.Empty;

            worksheet.Cell(rowNumber, 5).Value =
                item.LineCode ?? string.Empty;

            worksheet.Cell(rowNumber, 6).Value =
                item.LineName ?? string.Empty;

            rowNumber++;
        }

        var lastRow =
            Math.Max(rowNumber - 1, 1);

        var usedRange =
            worksheet.Range(
                1,
                1,
                lastRow,
                6);

        usedRange.Style.Border.TopBorder =
            XLBorderStyleValues.Thin;

        usedRange.Style.Border.BottomBorder =
            XLBorderStyleValues.Thin;

        usedRange.Style.Border.LeftBorder =
            XLBorderStyleValues.Thin;

        usedRange.Style.Border.RightBorder =
            XLBorderStyleValues.Thin;

        worksheet.SheetView.FreezeRows(1);

        worksheet.Columns()
            .AdjustToContents();

        var now =
            DateTime.UtcNow;

        var fileName =
            $"ProductionLine_{now:yyyyMMdd_HHmmss}_{job.JobId:N}.xlsx";

        var storagePath =
            $"exports/production-line/{now:yyyy/MM}/{fileName}";

        await using var memoryStream =
            new MemoryStream();

        workbook.SaveAs(memoryStream);

        memoryStream.Position = 0;

        var storageKey =
            await _storage.SaveAsync(
                storagePath,
                memoryStream,
                cancellationToken);

        return JsonSerializer.Serialize(
            new
            {
                fileName,
                storageKey,

                contentType =
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

                rowCount = rows.Count
            });
    }
}